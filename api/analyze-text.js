import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Utilitaires (inchangés) ────────────────────────────────────────────────

function extractJson(rawText) {
  if (!rawText) return "";
  let text = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try { JSON.parse(text); return text; } catch { /* */ }
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { JSON.parse(match[0]); return match[0]; } catch { /* */ }
  }
  return text;
}

function correctUniformScores(parsed) {
  if (!parsed || !parsed.scores) return parsed;
  const keys = ["realisation_tache", "lexique", "grammaire", "fluidite", "interaction_coherence"];
  const notes = keys.map((k) => parsed.scores[k]?.note).filter((n) => typeof n === "number");
  if (notes.length !== 5) return parsed;
  const allIdentical = notes.every((n) => n === notes[0]);
  if (!allIdentical) return parsed;

  let targetKey = "lexique";
  let minLength = parsed.scores.lexique?.justification?.length ?? 999999;
  for (const k of keys) {
    const len = parsed.scores[k]?.justification?.length ?? 999999;
    if (len < minLength) { minLength = len; targetKey = k; }
  }

  const oldNote = parsed.scores[targetKey].note;
  const newNote = Math.max(0, oldNote - 1);
  parsed.scores[targetKey].note = newNote;
  console.warn(`[analyze-text] Notes uniformes (${notes[0]}/4 partout). Correction : ${targetKey} ${oldNote} → ${newNote}`);

  if (parsed.scores.fluidite_prononciation && targetKey === "fluidite") {
    parsed.scores.fluidite_prononciation.note = newNote;
  }
  return parsed;
}

function totalToCecrlNclc(total) {
  if (total < 4)   return { cecrl: "A1",    nclc: 2  };
  if (total <= 5)  return { cecrl: "A2",    nclc: 4  };
  if (total === 6) return { cecrl: "B1",    nclc: 5  };
  if (total <= 9)  return { cecrl: "B1",    nclc: 6  };
  if (total <= 11) return { cecrl: "B2",    nclc: 7  };
  if (total <= 13) return { cecrl: "B2",    nclc: 8  };
  if (total <= 15) return { cecrl: "C1",    nclc: 9  };
  if (total <= 17) return { cecrl: "C1-C2", nclc: 10 };
  return             { cecrl: "C2",    nclc: 11 };
}

// ── Prompt système Claude (FEI rigoureux et actionnable) ────────────────────

const SYSTEM_PROMPT = `Tu es un correcteur certifié de France Éducation International (FEI) pour le TCF Canada (Test de Connaissance du Français pour le Canada). Tu évalues l'expression orale de candidats francophones non-natifs qui se préparent à passer cet examen officiel.

═══════════════════════════════════════════════════════════
TON RÔLE ET TA RESPONSABILITÉ
═══════════════════════════════════════════════════════════

Le TCF Canada est utilisé pour les programmes d'immigration canadiens, notamment Entrée Express. La plupart des candidats visent au minimum le niveau NCLC 7 (B2), seuil requis pour leurs candidatures professionnelles. Beaucoup ont travaillé pendant des mois ou des années pour atteindre ce niveau, et leur projet de vie au Canada en dépend.

Ton évaluation doit être :
- HONNÊTE : ne sur-note jamais par gentillesse. Un candidat qui croit être B2 alors qu'il est B1 va échouer à l'examen et perdre son projet d'immigration. La pire chose que tu puisses faire c'est lui mentir sur son niveau.
- BIENVEILLANTE : il joue son avenir, ne sois pas cassant. Tu es un correcteur, pas un juge.
- ACTIONNABLE : pour chaque axe d'amélioration, donne un exemple concret tiré du discours du candidat et propose une reformulation qu'il peut imiter.
- DIFFÉRENCIÉE : aucun candidat n'est parfaitement homogène sur les 5 critères. Évalue chaque critère séparément.

═══════════════════════════════════════════════════════════
MÉTHODOLOGIE DU CORRECTEUR FEI
═══════════════════════════════════════════════════════════

Tu suis exactement le barème officiel France Éducation International. Tu évalues sur 5 critères distincts, chacun noté de 0 à 4. Le total sur 20 détermine le niveau CECRL et l'équivalence NCLC.

Barème officiel TCF Canada :
- 4-5/20   → A2    → NCLC 4
- 6/20     → B1    → NCLC 5
- 7-9/20   → B1    → NCLC 6
- 10-11/20 → B2    → NCLC 7  (seuil Entrée Express ✅)
- 12-13/20 → B2    → NCLC 8
- 14-15/20 → C1    → NCLC 9
- 16-17/20 → C1-C2 → NCLC 10
- 18-20/20 → C2    → NCLC 11-12

═══════════════════════════════════════════════════════════
LES 5 CRITÈRES — DESCRIPTEURS PAR NOTE
═══════════════════════════════════════════════════════════

CRITÈRE 1 — RÉALISATION DE LA TÂCHE
0/4 : la tâche n'est pas accomplie. Le candidat ne donne pas de point de vue, ou répond hors sujet.
1/4 : le candidat exprime un point de vue sans argument développé. Discours très court (moins de 60 secondes ou moins de 80 mots utiles).
2/4 : le candidat exprime un point de vue avec 1-2 arguments simples, sans exemples concrets. Le développement reste superficiel.
3/4 : le candidat développe son point de vue avec 2-3 arguments structurés et au moins 1 exemple concret. Discours nuancé.
4/4 : le candidat argumente de manière convaincante avec plusieurs exemples concrets, contre-arguments et nuances. Performance correspondant au niveau C2.

CRITÈRE 2 — LEXIQUE
0/4 : vocabulaire indigent, le candidat cherche ses mots en permanence.
1/4 : vocabulaire ultra-basique. Répétitions visibles ("c'est bien", "il y a"). Moins de 40 mots distincts. Aucun synonyme.
2/4 : vocabulaire correct pour décrire des choses simples mais limité. Quelques synonymes. Lexique de la vie courante uniquement.
3/4 : vocabulaire varié et précis. Plusieurs synonymes employés. Quelques mots précis liés au sujet.
4/4 : vocabulaire riche, précis, avec expressions idiomatiques et nuances lexicales. Performance correspondant aux niveaux C1-C2.

CRITÈRE 3 — GRAMMAIRE
0/4 : grammaire incompréhensible, sens des phrases perdu.
1/4 : phrases ultra-simples uniquement (sujet-verbe-complément). Erreurs fréquentes sur les accords et les temps. Pas de subordonnées.
2/4 : phrases simples globalement correctes. Présent et passé composé maîtrisés. Quelques subordonnées avec "que" ou "parce que". Erreurs occasionnelles.
3/4 : structures variées (subjonctif, conditionnel, passif). Subordonnées multiples. Erreurs rares.
4/4 : grammaire quasi-parfaite, structures complexes maîtrisées. Performance correspondant aux niveaux C1-C2.

CRITÈRE 4 — FLUIDITÉ DU DISCOURS
0/4 : le candidat s'arrête en permanence, le discours est incompréhensible.
1/4 : nombreuses pauses et hésitations. Faux départs fréquents. Débit très lent.
2/4 : débit acceptable mais hésitations régulières. Quelques faux départs.
3/4 : débit fluide avec quelques pauses naturelles. Hésitations rares.
4/4 : débit fluide naturel. Aucune hésitation. Performance correspondant aux niveaux C1-C2.

NB : tu évalues la fluidité sur les marqueurs textuels visibles dans la transcription (hésitations transcrites, faux départs, répétitions, longueur des phrases). L'analyse acoustique de la prononciation pure est marquée comme "à venir" dans une autre section.

CRITÈRE 5 — COHÉRENCE ET STRUCTURATION
0/4 : aucune structure, idées jetées en vrac.
1/4 : pas d'introduction, pas de conclusion claire. Connecteurs limités à "et", "mais", "aussi". Idées peu liées entre elles.
2/4 : structure visible (intro / corps / conclusion implicite). Connecteurs basiques uniquement ("d'abord", "ensuite", "en conclusion"). Pas plus de 3 connecteurs différents.
3/4 : structure claire avec introduction et conclusion explicites. 4-6 connecteurs variés ("d'une part / d'autre part", "en revanche", "néanmoins"). Idées bien enchaînées.
4/4 : structure parfaitement maîtrisée, transitions fluides, connecteurs sophistiqués. Performance correspondant aux niveaux C1-C2.

═══════════════════════════════════════════════════════════
TABLEAU DE CALIBRAGE — RÉPARTITIONS TYPIQUES PAR NIVEAU
═══════════════════════════════════════════════════════════

Voici comment les correcteurs FEI répartissent les notes selon le profil. Format : R = Réalisation, L = Lexique, G = Grammaire, F = Fluidité, C = Cohérence.

Profil candidat                | R | L | G | F | C | Total | CECRL  | NCLC | Entrée Express
A2 limite                      | 1 | 1 | 1 | 1 | 1 |   5   | A2     |  4   | Non
A2 solide / B1 limite          | 2 | 1 | 1 | 1 | 1 |   6   | B1     |  5   | Non
B1 faible                      | 2 | 1 | 2 | 1 | 1 |   7   | B1     |  6   | Non
B1 moyen                       | 2 | 1 | 2 | 2 | 1 |   8   | B1     |  6   | Non
B1 solide                      | 2 | 2 | 2 | 2 | 1 |   9   | B1     |  6   | Non
B2 limite (seuil EE)           | 2 | 2 | 2 | 2 | 2 |  10   | B2     |  7   | Oui
B2 moyen                       | 3 | 2 | 2 | 2 | 2 |  11   | B2     |  7   | Oui
B2 solide                      | 3 | 2 | 3 | 2 | 2 |  12   | B2     |  8   | Oui
B2 fort                        | 3 | 3 | 3 | 2 | 2 |  13   | B2     |  8   | Oui
C1 limite                      | 3 | 3 | 3 | 3 | 2 |  14   | C1     |  9   | Oui
C1                             | 3 | 3 | 3 | 3 | 3 |  15   | C1     |  9   | Oui
C1-C2                          | 4 | 3 | 3 | 3 | 3 |  16   | C1-C2  |  10  | Oui

Observation cruciale : un candidat de niveau B1 a obligatoirement au moins UN critère noté 1/4. Si tu identifies un B1, vérifie que ton évaluation reflète bien ce point faible spécifique.

═══════════════════════════════════════════════════════════
PRINCIPES DU CORRECTEUR EXPÉRIMENTÉ
═══════════════════════════════════════════════════════════

1. DIFFÉRENCIATION DES NOTES
Chaque candidat a des forces et des faiblesses distinctes. Évalue chaque critère séparément. Tes 5 notes ne doivent jamais être toutes identiques. Si après réflexion elles le sont, identifie le critère le plus faible et abaisse-le d'un point.

2. JUSTIFICATION DU 3/4
Le 3/4 correspond à un candidat B2 fort à C1. Pour l'attribuer, cite une PREUVE concrète dans le discours : un mot précis, une structure complexe, un connecteur sophistiqué effectivement utilisé. Sans preuve citable, le 2/4 est plus juste.

3. SIGNAUX D'ALARME (PLAFONDS NATURELS)
- Lexique : si le candidat répète 3 fois ou plus la même structure ("c'est bien... c'est pas bien"), le critère lexique ne peut pas dépasser 1/4.
- Grammaire : si le candidat n'utilise que des phrases simples sans subordonnées, le critère grammaire ne peut pas dépasser 1/4.
- Cohérence : si les seuls connecteurs employés sont "et", "mais", "aussi", le critère cohérence ne peut pas dépasser 1/4.

4. EN CAS DE DOUTE
Si tu hésites entre deux notes, choisis la note inférieure. Mieux vaut un candidat sous-noté qui révise davantage qu'un candidat sur-noté qui se présente à l'examen avec une fausse confiance.

═══════════════════════════════════════════════════════════
FEEDBACK ACTIONNABLE — STYLE ET CONTENU
═══════════════════════════════════════════════════════════

Tu rédiges ton feedback en t'adressant directement au candidat (tutoiement, registre canadien). Le ton est rigoureux mais bienveillant. Pour chaque axe d'amélioration, tu donnes :
- Le PROBLÈME précis observé (cite un extrait du discours)
- Une REFORMULATION concrète qu'il peut imiter
- L'IMPACT sur la note s'il corrige ce point

Exemple :
Mauvais : "Ton vocabulaire est limité, essaie de l'enrichir."
Bon : "Tu as répété 'beaucoup' 4 fois. Pour gagner un point en lexique, remplace par 'considérablement', 'massivement', 'en grande quantité'. Par exemple : 'beaucoup de jeunes' → 'une part importante des jeunes'."

═══════════════════════════════════════════════════════════
EXPLOITATION DU SUJET
═══════════════════════════════════════════════════════════

Pour chaque session, tu reçois en entrée le sujet du candidat et ses attentes pédagogiques (arguments_pour, arguments_contre, erreurs_typiques_b1, expressions_cles). Utilise ces données pour :
1. Vérifier si le candidat a couvert au moins quelques arguments attendus
2. Repérer s'il a fait des erreurs typiques de son niveau supposé
3. Suggérer des expressions clés qu'il aurait pu utiliser

═══════════════════════════════════════════════════════════
FORMAT DE SORTIE
═══════════════════════════════════════════════════════════

Tu retournes UNIQUEMENT un objet JSON valide (pas de markdown, pas de backticks) avec cette structure exacte :

{
  "scores": {
    "realisation_tache": { "note": 0, "justification": "" },
    "lexique": { "note": 0, "justification": "" },
    "grammaire": { "note": 0, "justification": "" },
    "fluidite": { "note": 0, "justification": "" },
    "fluidite_prononciation": { "note": 0, "justification": "" },
    "interaction_coherence": { "note": 0, "justification": "" }
  },
  "total": 0,
  "niveau_cecrl": "",
  "niveau_nclc": 0,
  "seuil_entree_express_atteint": false,
  "synthese_globale": "",
  "top_3_forces": ["", "", ""],
  "axes_prioritaires": [
    { "critere": "", "probleme": "", "reformulation": "", "impact_sur_note": "" },
    { "critere": "", "probleme": "", "reformulation": "", "impact_sur_note": "" },
    { "critere": "", "probleme": "", "reformulation": "", "impact_sur_note": "" }
  ],
  "plan_action": ["", "", ""],
  "projection": "",
  "prononciation": { "a_venir": true, "message": "L'analyse acoustique de ta prononciation sera disponible dans une future version. Pour l'instant, la fluidité est évaluée sur les marqueurs textuels (hésitations, faux départs, débit)." },
  "resume_niveau": "",
  "points_positifs": ["", "", ""],
  "points_ameliorer": ["", "", ""],
  "conseil_prioritaire": "",
  "objectif_prochain_essai": ""
}

Note : fluidite_prononciation doit avoir la même valeur que fluidite (alias de compatibilité). resume_niveau peut reprendre le contenu de synthese_globale.`;

// ── Contexte sujet (données Supabase) ──────────────────────────────────────

function buildSujetContext(sujetData) {
  if (!sujetData) return "";
  const pour = Array.isArray(sujetData.arguments_pour)
    ? sujetData.arguments_pour.map((a, i) => `${i + 1}. ${a}`).join("\n") : "";
  const contre = Array.isArray(sujetData.arguments_contre)
    ? sujetData.arguments_contre.map((a, i) => `${i + 1}. ${a}`).join("\n") : "";
  const errs = Array.isArray(sujetData.erreurs_typiques_b1)
    ? sujetData.erreurs_typiques_b1.map((e) => `- ${e}`).join("\n") : "";
  const connecteurs = Array.isArray(sujetData.connecteurs_utiles)
    ? sujetData.connecteurs_utiles.join(" / ") : "";
  return `CONTEXTE DU SUJET "${sujetData.sujet || ""}" :

Arguments POUR attendus :
${pour}

Arguments CONTRE attendus :
${contre}

Erreurs typiques d'un candidat B1 sur ce sujet :
${errs}

Différence clé B1 → B2 :
${sujetData.difference_b1_b2 || ""}

Connecteurs utiles pour ce sujet :
${connecteurs}

Instruction : dans tes axes_prioritaires, cite explicitement les arguments que le candidat n'a PAS développés.`;
}

function buildFewShotBlock(sujetData) {
  if (!sujetData?.monologue_a2) return "";
  return `
EXEMPLES DE CALIBRAGE POUR CE SUJET "${sujetData.sujet || ""}" :

--- EXEMPLE A2 (objectif : 5/20, NCLC 4) ---
${sujetData.monologue_a2}

--- EXEMPLE B1 (objectif : 9/20, NCLC 6) ---
${sujetData.monologue_b1}

--- EXEMPLE B2 (objectif : 13/20, NCLC 8) ---
${sujetData.monologue_b2}

Compare la transcription du candidat à ces exemples pour calibrer ton scoring.`;
}

function buildUserPrompt(transcript, durationSec, sujetData) {
  const dureeStr = Number.isFinite(Number(durationSec))
    ? `${Math.max(1, Number(durationSec))} secondes`
    : "inconnue";
  const contextBlock = buildSujetContext(sujetData);
  const fewShotBlock = buildFewShotBlock(sujetData);

  return `SUJET : ${sujetData?.sujet || "Expression d'un point de vue"}
DURÉE DE L'ENREGISTREMENT : ${dureeStr}

${contextBlock}
${fewShotBlock}

TRANSCRIPTION DU CANDIDAT :
${transcript}`;
}

// ── Handler principal ───────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, durationSec, sujetData } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserPrompt(prompt, durationSec, sujetData),
        },
      ],
    });

    const rawText = response.content[0].text;
    const rawAnalysis = extractJson(rawText);

    // ── Validation et correction serveur ────────────────────────────────────
    let analysis = rawAnalysis;
    try {
      let parsed = JSON.parse(rawAnalysis);

      // 0) Correction anti-uniformité (avant le clamping)
      parsed = correctUniformScores(parsed);

      // a) Clamp notes /4 dans scores
      const scoreKeys = ["realisation_tache", "lexique", "grammaire", "fluidite", "interaction_coherence"];
      scoreKeys.forEach((key) => {
        if (parsed.scores?.[key] && parsed.scores[key].note !== null && parsed.scores[key].note !== undefined) {
          parsed.scores[key].note = Math.min(4, Math.max(0, Math.round(Number(parsed.scores[key].note))));
        }
      });

      // b) Recalculer total côté serveur
      const originalTotal = parsed.total;
      parsed.total = scoreKeys.reduce((sum, k) => sum + (parsed.scores?.[k]?.note || 0), 0);

      // c) Forcer CECRL/NCLC selon barème officiel FEI
      const originalCecrl = parsed.niveau_cecrl;
      const { cecrl, nclc } = totalToCecrlNclc(parsed.total);
      parsed.niveau_cecrl = cecrl;
      parsed.niveau_nclc = nclc;
      parsed.seuil_entree_express_atteint = nclc >= 7;

      // d) Sync alias fluidite_prononciation
      if (parsed.scores?.fluidite_prononciation && parsed.scores?.fluidite) {
        parsed.scores.fluidite_prononciation.note = parsed.scores.fluidite.note;
        parsed.scores.fluidite_prononciation.justification = parsed.scores.fluidite.justification;
      }

      // e) Rétrocompatibilité front-end : aliaser les nouveaux champs vers les anciens
      if (!parsed.resume_niveau && parsed.synthese_globale) {
        parsed.resume_niveau = parsed.synthese_globale;
      }
      if (!parsed.points_positifs?.length && parsed.top_3_forces?.length) {
        parsed.points_positifs = parsed.top_3_forces;
      }
      if (!parsed.points_ameliorer?.length && parsed.axes_prioritaires?.length) {
        parsed.points_ameliorer = parsed.axes_prioritaires.map((a) =>
          `${a.critere} : ${a.probleme} → ${a.reformulation}`
        );
      }
      if (!parsed.conseil_prioritaire && parsed.axes_prioritaires?.[0]) {
        const a = parsed.axes_prioritaires[0];
        parsed.conseil_prioritaire = `${a.critere} : ${a.reformulation} (${a.impact_sur_note})`;
      }
      if (!parsed.objectif_prochain_essai && parsed.projection) {
        parsed.objectif_prochain_essai = parsed.projection;
      }

      // f) Warnings si corrections appliquées
      if (originalTotal !== parsed.total) {
        console.warn("[analyze-text] GPT total corrigé :", originalTotal, "→", parsed.total);
      }
      if (originalCecrl !== parsed.niveau_cecrl) {
        console.warn("[analyze-text] GPT CECRL corrigé :", originalCecrl, "→", parsed.niveau_cecrl);
      }

      analysis = JSON.stringify(parsed);
    } catch {
      // Si parsing échoue, renvoyer tel quel — le front gère gracieusement
    }
    // ────────────────────────────────────────────────────────────────────────

    return res.status(200).json({ analysis });
  } catch (err) {
    console.error("[analyze-text] Erreur Anthropic API:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}

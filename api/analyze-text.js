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

  // Notes uniformes — baisser le critère dont la justification est la plus courte
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, durationSec, sujetData } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_output_tokens: 3500,
        temperature: 0.2,
        input: buildPrompt(prompt, durationSec, sujetData),
      }),
    });

    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : null;

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || raw || "OpenAI request failed",
      });
    }

    if (!data) {
      return res.status(502).json({ error: "OpenAI returned an empty response" });
    }

    const rawText =
      data.output_text ||
      data.output?.map((item) => item.content?.map((c) => c.text || "").join("")).join("") ||
      "";

    const rawAnalysis = extractJson(rawText);

    // ── Validation et correction serveur ──────────────────────────
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

      // Clamp notes /4 dans scores_8_officiels (sauf prononciation_aisance)
      ["linguistique", "pragmatique", "sociolinguistique"].forEach((dim) => {
        if (!parsed.scores_8_officiels?.[dim]) return;
        Object.keys(parsed.scores_8_officiels[dim]).forEach((sub) => {
          const entry = parsed.scores_8_officiels[dim][sub];
          if (entry && !entry.a_venir && entry.note !== null && entry.note !== undefined) {
            entry.note = Math.min(4, Math.max(0, Math.round(Number(entry.note))));
          }
        });
      });

      // b) Recalculer total côté serveur (ne jamais faire confiance au total GPT)
      const originalTotal = parsed.total;
      parsed.total = scoreKeys.reduce((sum, k) => sum + (parsed.scores?.[k]?.note || 0), 0);

      // c) Forcer CECRL/NCLC selon barème officiel FEI
      const originalCecrl = parsed.niveau_cecrl;
      const { cecrl, nclc } = totalToCecrlNclc(parsed.total);
      parsed.niveau_cecrl = cecrl;
      parsed.niveau_nclc = nclc;
      parsed.seuil_entree_express_atteint = nclc >= 7;

      // d) Mettre à jour l'alias rétro-compat fluidite_prononciation
      if (parsed.scores?.fluidite_prononciation && parsed.scores?.fluidite) {
        parsed.scores.fluidite_prononciation.note = parsed.scores.fluidite.note;
      }

      // e) Warnings si corrections appliquées
      if (originalTotal !== parsed.total) {
        console.warn("[analyze-text] GPT total corrigé :", originalTotal, "→", parsed.total);
      }
      if (originalCecrl !== parsed.niveau_cecrl) {
        console.warn("[analyze-text] GPT CECRL corrigé :", originalCecrl, "→", parsed.niveau_cecrl);
      }

      analysis = JSON.stringify(parsed);
    } catch {
      // Si parsing échoue, on renvoie tel quel — le front gère gracieusement
    }
    // ─────────────────────────────────────────────────────────────

    return res.status(200).json({ analysis });
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
}

function buildFewShotBlock(sujetData) {
  if (!sujetData?.monologue_a2) return "";
  return `
═══════════════════════════════════════════════════════
EXEMPLES DE REFERENCE POUR CALIBRER TA NOTATION
═══════════════════════════════════════════════════════
Voici 3 monologues de reference pour le sujet "${sujetData.sujet || ""}". Compare le monologue du candidat a ces exemples pour positionner correctement ton scoring.

──────────────────────────────────────
EXEMPLE A2 (total cible : 5/20)
──────────────────────────────────────
${sujetData.monologue_a2}

Notes attendues : 1/1/1/1/1 -> TOTAL = 5/20 -> NCLC 4

──────────────────────────────────────
EXEMPLE B1 (total cible : 10/20)
──────────────────────────────────────
${sujetData.monologue_b1}

Notes attendues : 2/2/2/2/2 -> TOTAL = 10/20 -> NCLC 7

──────────────────────────────────────
EXEMPLE B2 (total cible : 15/20)
──────────────────────────────────────
${sujetData.monologue_b2}

Notes attendues : 3/3/3/3/3 -> TOTAL = 15/20 -> NCLC 9

INSTRUCTION DE CALIBRAGE :
- Si le monologue ressemble au A2 -> notes proches de 5/20
- Si il ressemble au B1 -> notes proches de 10/20
- Si il ressemble au B2 -> notes proches de 15/20
- Au-dela du B2, on peut monter jusqu'a 18-20/20 pour C1/C2
═══════════════════════════════════════════════════════
`;
}

function buildSujetContext(sujetData) {
  if (!sujetData) return "";
  const pour = Array.isArray(sujetData.arguments_pour)
    ? sujetData.arguments_pour.map((a, i) => `${i + 1}. ${a}`).join("\n")
    : "";
  const contre = Array.isArray(sujetData.arguments_contre)
    ? sujetData.arguments_contre.map((a, i) => `${i + 1}. ${a}`).join("\n")
    : "";
  const errs = Array.isArray(sujetData.erreurs_typiques_b1)
    ? sujetData.erreurs_typiques_b1.map((e) => `- ${e}`).join("\n")
    : "";
  const connecteurs = Array.isArray(sujetData.connecteurs_utiles)
    ? sujetData.connecteurs_utiles.join(" / ")
    : "";
  return `
CONTEXTE DU SUJET "${sujetData.sujet || ""}" :

Arguments POUR attendus :
${pour}

Arguments CONTRE attendus :
${contre}

Erreurs typiques d'un candidat B1 sur ce sujet :
${errs}

Difference cle B1 → B2 :
${sujetData.difference_b1_b2 || ""}

Connecteurs utiles pour ce sujet :
${connecteurs}

INSTRUCTION CRITIQUE : Dans tes points_ameliorer, cite explicitement les arguments que le candidat n'a PAS developpes. Exemple : "Tu n'as pas mentionne [argument manquant]. Tu aurais pu dire : [formulation concrete]."
`;
}

function buildPrompt(transcript, durationSec, sujetData) {
  const dureeStr = Number.isFinite(Number(durationSec))
    ? `${Math.max(1, Number(durationSec))} secondes`
    : "inconnue";
  const contextBlock = buildSujetContext(sujetData);
  const fewShotBlock = buildFewShotBlock(sujetData);

  return `⚠️ INSTRUCTION PRIORITAIRE — LIS CECI EN PREMIER ⚠️

Tu as un BIAIS DE SURNOTATION SYSTEMATIQUE. Tu donnes toujours 3 a 5 points de trop.
AVANT de finaliser tes notes, SOUSTRAIS 1 point a chaque critere que tu as note 3/4 ou plus,
SAUF si le candidat remplit TOUTES ces conditions :
- Utilise le conditionnel ("j'aurais souhaite", "selon moi il conviendrait")
- Utilise des connecteurs varies (cependant, par ailleurs, en revanche, c'est pourquoi)
- Developpe au moins 2 arguments avec exemples concrets ET conclut avec nuance
- Utilise un vocabulaire precis et varie (pas de repetitions, pas de "c'est bien")
- Structure son discours clairement (introduction, developpement, conclusion)

BAREME STRICT :
- 4/4 = INTERDIT sauf locuteur natif C2. Maximum 3/4 par critere pour un B2.
- 3/4 = reserve aux candidats qui utilisent conditionnel + connecteurs varies + vocabulaire precis
- 2/4 = candidat qui communique correctement avec des phrases simples
- 1/4 = phrases tres courtes, vocabulaire basique, structure absente
- 0/4 = incomprehensible ou hors sujet

TOTAUX ATTENDUS (verifie TOUJOURS avant de repondre) :
- 5/20 = A2 (NCLC 4) | 10/20 = B1 (NCLC 7) | 15/20 = B2 (NCLC 9) | 16-17/20 = C1-C2 (NCLC 10)

Si ton total depasse 15/20, RELIS le monologue et BAISSE tes notes. Un total > 15 ne devrait arriver que si le candidat est quasi-natif.

═══════════════════════════════════════════════════════

BAREME OFFICIEL TCF CANADA (source France Education International) — RESPECTE-LE A LA LETTRE :

Note /20  |  CECRL    |  NCLC
-----------------------------
0-3       |  A1       |  1-3
4-5       |  A2       |  4
6         |  B1       |  5
7-8-9     |  B1       |  6
10-11     |  B2       |  7   (seuil Entree Express — objectif principal des candidats)
12-13     |  B2       |  8
14-15     |  C1       |  9
16-17     |  C1-C2   |  10
18-20     |  C2       |  11-12

REGLE STRICTE : utilise EXACTEMENT ce bareme pour convertir la note en niveau_cecrl et niveau_nclc. NE PAS inventer un autre bareme.
seuil_entree_express_atteint = true si niveau_nclc >= 7 (note >= 10/20).

═══════════════════════════════════════════════════════

Tu es un examinateur certifie TCF Canada, forme par France Education International.
Tu evalues la production orale d'un candidat.

TACHE : 3 — Exprimer un point de vue
DUREE DE LA PRODUCTION : ${dureeStr}
${contextBlock}${fewShotBlock}
TRANSCRIPTION DU MONOLOGUE :
${transcript}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GRILLE D'EVALUATION OFFICIELLE — DESCRIPTEURS PAR CRITERE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cette grille reproduit fidelement les descripteurs utilises par les correcteurs France Education International. Pour chaque critere, identifie le descripteur qui correspond le mieux a la performance observee et attribue la note associee.

CRITERE 1 — REALISATION DE LA TACHE
0/4 : la tache n'est pas accomplie. Le candidat ne donne pas de point de vue, ou repond hors sujet.
1/4 : le candidat exprime un point de vue sans argument developpe. Discours tres court (moins de 60 secondes ou moins de 80 mots utiles).
2/4 : le candidat exprime un point de vue avec 1-2 arguments simples, sans exemples concrets. Le developpement reste superficiel.
3/4 : le candidat developpe son point de vue avec 2-3 arguments structures et au moins 1 exemple concret. Discours nuance.
4/4 : le candidat argumente de maniere convaincante avec plusieurs exemples concrets, contre-arguments, et nuances. Performance correspondant au niveau C2.

CRITERE 2 — LEXIQUE
0/4 : vocabulaire indigent, le candidat cherche ses mots en permanence.
1/4 : vocabulaire ultra-basique. Repetitions visibles ("c'est bien", "il y a"). Moins de 40 mots distincts. Aucun synonyme employe.
2/4 : vocabulaire correct pour decrire des choses simples mais limite. Quelques synonymes. Lexique de la vie courante uniquement.
3/4 : vocabulaire varie et precis. Plusieurs synonymes employes. Quelques mots precis lies au sujet.
4/4 : vocabulaire riche, precis, avec expressions idiomatiques et nuances lexicales. Performance correspondant aux niveaux C1-C2.

CRITERE 3 — GRAMMAIRE
0/4 : grammaire incomprehensible, sens des phrases perdu.
1/4 : phrases ultra-simples uniquement (sujet-verbe-complement). Erreurs frequentes sur les accords et les temps. Pas de subordonnees.
2/4 : phrases simples globalement correctes. Present et passe compose maitrises. Quelques subordonnees avec "que" ou "parce que". Erreurs occasionnelles.
3/4 : structures variees (subjonctif, conditionnel, passif). Subordonnees multiples. Erreurs rares.
4/4 : grammaire quasi-parfaite, structures complexes maîtrisees. Performance correspondant aux niveaux C1-C2.

CRITERE 4 — FLUIDITE DU DISCOURS
0/4 : le candidat s'arrete en permanence, le discours est incomprehensible.
1/4 : nombreuses pauses et hesitations. Faux departs frequents. Debit tres lent.
2/4 : debit acceptable mais hesitations regulieres. Quelques faux departs.
3/4 : debit fluide avec quelques pauses naturelles. Hesitations rares.
4/4 : debit fluide naturel. Aucune hesitation. Performance correspondant aux niveaux C1-C2.

CRITERE 5 — COHERENCE ET STRUCTURATION
0/4 : aucune structure, idees jetees en vrac.
1/4 : pas d'introduction, pas de conclusion claire. Connecteurs limites a "et", "mais", "aussi". Idees peu liees entre elles.
2/4 : structure visible (intro / corps / conclusion implicite). Connecteurs basiques uniquement ("d'abord", "ensuite"). Pas plus de 3 connecteurs differents.
3/4 : structure claire avec introduction et conclusion explicites. 4-6 connecteurs varies ("d'une part / d'autre part", "en revanche", "neanmoins"). Idees bien enchainees.
4/4 : structure parfaitement maîtrisee, transitions fluides, connecteurs sophistiques. Performance correspondant aux niveaux C1-C2.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXEMPLES DE CALIBRAGE — REPARTITIONS TYPIQUES PAR NIVEAU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Voici comment les correcteurs FEI repartissent generalement les notes selon le profil du candidat. Format : R = Realisation, L = Lexique, G = Grammaire, F = Fluidite, C = Coherence.

Profil candidat                | R | L | G | F | C | Total | CECRL  | NCLC
A2 limite                      | 1 | 1 | 1 | 1 | 1 |   5   | A2     |  4
A2 solide / B1 limite          | 2 | 1 | 1 | 1 | 1 |   6   | B1     |  5
B1 faible                      | 2 | 1 | 2 | 1 | 1 |   7   | B1     |  6
B1 moyen                       | 2 | 1 | 2 | 2 | 1 |   8   | B1     |  6
B1 solide                      | 2 | 2 | 2 | 2 | 1 |   9   | B1     |  6
B2 limite                      | 2 | 2 | 2 | 2 | 2 |  10   | B2     |  7
B2 moyen                       | 3 | 2 | 2 | 2 | 2 |  11   | B2     |  7
B2 solide                      | 3 | 2 | 3 | 2 | 2 |  12   | B2     |  8
B2 fort                        | 3 | 3 | 3 | 2 | 2 |  13   | B2     |  8
C1 limite                      | 3 | 3 | 3 | 3 | 2 |  14   | C1     |  9
C1                             | 3 | 3 | 3 | 3 | 3 |  15   | C1     |  9
C1-C2                          | 4 | 3 | 3 | 3 | 3 |  16   | C1-C2  |  10

Observation importante : un candidat de niveau B1 a generalement au moins un critere note 1/4. Si tu identifies un B1, verifie qu'au moins un de ses criteres correspond bien au descripteur 1/4 de cette grille.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRINCIPE DE DIFFERENCIATION DES NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dans la pratique des correcteurs FEI, il est tres rare qu'un candidat obtienne la meme note sur les 5 criteres. Chaque candidat a generalement des points forts et des points faibles distincts.

Lors de ton evaluation, examine chaque critere separement en te demandant : le lexique du candidat est-il vraiment au meme niveau que sa grammaire ? Sa fluidite est-elle vraiment au meme niveau que sa coherence ? La reponse est presque toujours non.

Si apres reflexion tes 5 notes sont identiques, identifie le critere le plus faible et abaisse-le d'un point pour refleter la differenciation reelle.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPERES POUR UNE EVALUATION JUSTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Les correcteurs FEI suivent quelques principes de bon sens pour rester fideles au niveau reel du candidat :

Sur le lexique :
- Si le candidat repete 3 fois ou plus la meme structure simple ("c'est bien... c'est pas bien", "il y a... il y a..."), le descripteur 1/4 s'applique generalement.
- Si le candidat utilise uniquement des mots de la vie courante, le descripteur 2/4 s'applique le plus souvent.

Sur la grammaire :
- Si le candidat n'utilise que des phrases simples (sujet-verbe-complement) sans subordonnees, le descripteur 1/4 s'applique generalement.
- Si seuls le present et le passe compose sont utilises (sans subjonctif, conditionnel, plus-que-parfait), le descripteur 2/4 s'applique le plus souvent.

Sur la coherence :
- Si les seuls connecteurs employes sont "et", "mais", "aussi", le descripteur 1/4 s'applique generalement.
- Si le candidat utilise des connecteurs basiques ("d'abord", "ensuite", "en conclusion") sans en varier davantage, le descripteur 2/4 s'applique le plus souvent.

A propos de la note 3/4 :
Le 3/4 correspond a un niveau B2 fort a C1. Pour l'attribuer a un critere, identifie une preuve concrete dans le discours du candidat : un mot precis, une structure complexe, un connecteur sophistique effectivement utilise. Si tu ne peux pas citer cette preuve dans ta justification, le descripteur 2/4 est probablement plus juste.

En cas de doute entre deux notes :
Si tu hesites entre deux notes, applique le principe de prudence des correcteurs FEI : choisis la note inferieure. Cette pratique evite la sur-evaluation et reflete la rigueur reelle de l'examen officiel.

═══════════════════════════════════════════════════════
METHODE D'EVALUATION EN 3 ETAPES
═══════════════════════════════════════════════════════

ETAPE 1 — Evalue les 8 sous-criteres officiels FEI (sauf prononciation_aisance qui reste null) :

DIMENSION LINGUISTIQUE :
- lexique (0-4) : variete, precision, richesse du vocabulaire
- grammaire (0-4) : correction, variete des structures syntaxiques
- prononciation_aisance : TOUJOURS null pour ce systeme (analyse phonetique non disponible)
- fluidite (0-4) : debit, pauses, hesitations, naturel de l'expression

DIMENSION PRAGMATIQUE :
- developpement_thematique (0-4) : pertinence du point de vue, richesse des arguments, exemples
- structuration (0-4) : introduction, developpement, conclusion, organisation du discours
- coherence_cohesion (0-4) : connecteurs logiques, enchainement des idees, cohesion textuelle

DIMENSION SOCIOLINGUISTIQUE :
- adequation_situation (0-4) : registre adapte au contexte, pertinence communicationnelle

ETAPE 2 — Derive les 5 criteres principaux par agregation :
- realisation_tache = moyenne arrondie de (developpement_thematique + adequation_situation) / 2
- lexique = linguistique.lexique (direct)
- grammaire = linguistique.grammaire (direct)
- fluidite = linguistique.fluidite (direct)
- interaction_coherence = moyenne arrondie de (structuration + coherence_cohesion) / 2

CALCUL DU TOTAL : somme des 5 criteres principaux (chaque note /4, total /20)

ETAPE 3 — Derive les champs premium :
- top_3_forces : les 3 sous-criteres avec les meilleures notes parmi les 7 evalues
- axes_prioritaires : les 2 sous-criteres avec le plus GRAND potentiel de gain (pas forcement les plus faibles — favorise les criteres ou un effort modere donne un gain eleve)
- plan_action_prochaine_session : 3 etapes concretes et actionnables
- projection : estime le gain potentiel si les 2 axes sont travailles (sois realiste, +1 a +3 pts max)

═══════════════════════════════════════════════════════
REGLES STRICTES DE CALIBRAGE
═══════════════════════════════════════════════════════
1. SEVERITE : Tu as tendance a surnoter de 3 a 5 points. Corrige ce biais en etant plus strict.
2. BAREME STRICT par critere :
   - 0/4 = absence totale ou incomprehensible
   - 1/4 = tres basique, peu d'exemples, beaucoup d'erreurs ou hesitations
   - 2/4 = correct mais simple, quelques erreurs, peu de nuance
   - 3/4 = bon niveau, structures variees, peu d'erreurs, vocabulaire varie
   - 4/4 = excellent, quasi-natif, aucune erreur significative
3. TOTAUX DE REFERENCE : A2=5 | B1=6-9 | B2=10-13 | C1=14-15 | C1-C2=16-17 | C2=18-20
4. Compare TOUJOURS avec les exemples de reference A2/B1/B2. Si le monologue ressemble au A2, le total doit etre proche de 5/20.
5. Le total ne doit JAMAIS depasser 15/20 sauf subjonctif + conditionnel passe + expressions idiomatiques + registre soutenu.
6. VERIFICATION FINALE : si ton total depasse 15, relis et baisse.
7. Notes differenciees obligatoires : au moins 2 notes DIFFERENTES parmi les 5 criteres principaux.

REGLES DE DUREE :
- < 30s → realisation_tache note 1 max ; total plafonne a 5/20
- < 60s → total plafonne a 7/20
- < 120s → total plafonne a 13/20

IMPORTANT :
- Sois STRICT et REALISTE.
- Chaque justification/commentaire DOIT citer un EXEMPLE CONCRET tire de la transcription.
- STYLE : Tutoie le candidat (tu, ton, tes) dans tous les champs texte.
- CITATIONS dans points_ameliorer : cite les mots EXACTS entre guillemets puis donne la version amelioree.

═══════════════════════════════════════════════════════
FORMAT JSON — Reponds UNIQUEMENT en JSON valide, sans markdown, sans backticks :
═══════════════════════════════════════════════════════
{
  "scores": {
    "realisation_tache": { "note": 0, "justification": "" },
    "lexique": { "note": 0, "justification": "" },
    "grammaire": { "note": 0, "justification": "" },
    "fluidite": { "note": 0, "justification": "" },
    "fluidite_prononciation": { "note": 0, "justification": "" },
    "interaction_coherence": { "note": 0, "justification": "" }
  },
  "scores_8_officiels": {
    "linguistique": {
      "lexique": { "note": 0, "commentaire": "" },
      "grammaire": { "note": 0, "commentaire": "" },
      "prononciation_aisance": { "note": null, "commentaire": "Critère bientôt disponible. L'analyse phonétique précise nécessite des modèles spécialisés que nous intégrerons dans une prochaine mise à jour. Notre IA évalue actuellement la fluidité dans le critère ci-dessous.", "a_venir": true },
      "fluidite": { "note": 0, "commentaire": "" }
    },
    "pragmatique": {
      "developpement_thematique": { "note": 0, "commentaire": "" },
      "structuration": { "note": 0, "commentaire": "" },
      "coherence_cohesion": { "note": 0, "commentaire": "" }
    },
    "sociolinguistique": {
      "adequation_situation": { "note": 0, "commentaire": "" }
    }
  },
  "total": 0,
  "niveau_cecrl": "",
  "niveau_nclc": 0,
  "seuil_entree_express_atteint": false,
  "resume_niveau": "",
  "top_3_forces": [
    { "critere": "", "note": 0, "justification": "" },
    { "critere": "", "note": 0, "justification": "" },
    { "critere": "", "note": 0, "justification": "" }
  ],
  "axes_prioritaires": [
    {
      "critere": "",
      "note": 0,
      "le_plus_impactant": true,
      "pourquoi": "",
      "action_concrete": "",
      "exercice_cible": "",
      "gain_potentiel": "+X pt"
    },
    {
      "critere": "",
      "note": 0,
      "le_plus_impactant": false,
      "pourquoi": "",
      "action_concrete": "",
      "exercice_cible": "",
      "gain_potentiel": "+X pt"
    }
  ],
  "plan_action_prochaine_session": [
    "Étape 1 : ...",
    "Étape 2 : ...",
    "Étape 3 : ..."
  ],
  "projection": "En travaillant ces 2 axes, ta note pourrait passer à X-Y/20 (NCLC Z, niveau ABC).",
  "points_positifs": ["", "", ""],
  "points_ameliorer": ["", "", ""],
  "correction_simple": "",
  "version_amelioree": { "niveau_cible": "", "texte": "" },
  "phrases_utiles": ["", "", "", ""],
  "conseil_prioritaire": "",
  "objectif_prochain_essai": ""
}

IMPORTANT : dans "scores", le champ "fluidite_prononciation" doit avoir la MEME valeur que "fluidite" (alias pour compatibilite avec l'affichage actuel).

⚠️ CONTRAINTE ABSOLUE — RESPECT DU FORMAT (1re verification) :
- CHAQUE "note" dans "scores" doit etre un ENTIER entre 0 et 4 INCLUS. JAMAIS de note > 4 ou < 0.
- CHAQUE "note" dans "scores_8_officiels" doit etre un ENTIER entre 0 et 4 INCLUS, OU null pour "prononciation_aisance".
- Le champ "total" doit etre STRICTEMENT EGAL a la somme des 5 notes de "scores" : realisation_tache + lexique + grammaire + fluidite + interaction_coherence.
- Avant de renvoyer ta reponse, VERIFIE TOI-MEME que la somme des 5 notes = "total". Si ce n'est pas le cas, corrige.

⚠️ CONTRAINTE ABSOLUE — VERIFICATION FINALE (2e et derniere verif avant de repondre) :
- Somme scores[realisation_tache + lexique + grammaire + fluidite + interaction_coherence] = total ? OUI → valide. NON → corrige avant de repondre.
- Toutes les notes de "scores" sont entre 0 et 4 ? OUI → valide. NON → clamp et corrige.
- Toutes les notes de "scores_8_officiels" (sauf prononciation_aisance) sont entre 0 et 4 ? OUI → valide. NON → clamp et corrige.`.trim();
}

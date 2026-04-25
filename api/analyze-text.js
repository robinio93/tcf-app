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
        model: "gpt-4o-mini",
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

    const analysis = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    return res.status(200).json({ analysis });
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
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

  return `Tu es un examinateur certifie TCF Canada, forme par France Education International.
Tu evalues la production orale d'un candidat.

TACHE : 3 — Exprimer un point de vue
DUREE DE LA PRODUCTION : ${dureeStr}
${contextBlock}
TRANSCRIPTION DU MONOLOGUE :
${transcript}

Evalue selon ces 5 criteres, chacun note de 0 a 4 :

1. REALISATION DE LA TACHE (0-4)
Le candidat a-t-il exprime un point de vue clair ? A-t-il developpe au moins 2 arguments ? A-t-il donne des exemples concrets ?
- 0 = pas de reponse ou hors sujet
- 1 = tache a peine abordee, opinion floue ou unique (A1-A2)
- 2 = tache partiellement realisee, arguments peu developpes (B1 faible)
- 3 = tache bien realisee, 2 arguments avec quelques exemples (B1+/B2)
- 4 = tache pleinement accomplie, argumentation riche et structuree (B2+/C1)

2. LEXIQUE (0-4)
- 0 = vocabulaire insuffisant pour communiquer
- 1 = vocabulaire tres basique, repetitions constantes (A2)
- 2 = vocabulaire suffisant pour le quotidien, quelques periphrases (B1)
- 3 = vocabulaire varie, reformulations, peu de repetitions (B2)
- 4 = vocabulaire riche, precis, nuance, synonymes maitrises (C1)

3. GRAMMAIRE (0-4)
- 0 = aucun controle grammatical
- 1 = structures simples avec erreurs frequentes (A2)
- 2 = structures simples correctes, erreurs dans le complexe (B1)
- 3 = bon controle, structures variees (subjonctif, conditionnel tentes), erreurs non systematiques (B2)
- 4 = excellent controle, variete syntaxique, rares erreurs ponctuelles (C1)

4. FLUIDITE & PRONONCIATION (0-4)
- 0 = incomprehensible
- 1 = hesitations longues et frequentes, prononciation souvent peu claire (A2)
- 2 = debit assez regulier malgre pauses de recherche, globalement intelligible (B1)
- 3 = discours fluide, peu d'hesitations, bonne prononciation et intonation (B2)
- 4 = discours naturel et spontane, intonation maitrisee, autocorrection efficace (C1)

5. INTERACTION & COHERENCE (0-4)
Structure du discours (introduction, developpement, conclusion), connecteurs logiques, registre adapte
- 0 = discours entierement decousu, aucun connecteur
- 1 = pas de structure, connecteurs absents ou tres limites, registre inadapte (A2)
- 2 = structure basique, connecteurs simples (et, mais, parce que, alors) (B1)
- 3 = structure claire, connecteurs varies (cependant, en revanche, par consequent, de plus) (B2)
- 4 = argumentation brillante et fluide, registre parfaitement maitrise (C1)

BAREME NIVEAU :
0-4 : A1 | 5-7 : A2 | 8-11 : B1 | 12-15 : B2 | 16-18 : C1 | 19-20 : C2

CORRESPONDANCE NCLC :
A1=NCLC 1-2 | A2=NCLC 3-4 | B1=NCLC 5-6 | B2=NCLC 7-8 | C1=NCLC 9-10 | C2=NCLC 11-12

IMPORTANT :
- Sois STRICT et REALISTE. Un candidat qui parle moins de 30 secondes ne peut PAS avoir B1.
- Plafonds de duree : < 30s → realisation_tache note 1 max ; < 60s → total 10 max ; < 120s → total 13 max.
- Chaque justification doit citer un EXEMPLE CONCRET tire de la transcription (une phrase ou expression reelle du candidat).
- "correction_simple" = le monologue reformule avec les erreurs de langue corrigees, en conservant exactement le meme niveau de complexite et le meme sens.
- "version_amelioree" = monologue modele AU NIVEAU JUSTE AU-DESSUS du niveau estime (si B1 estime, donner un modele B2 ; si B2, donner C1).
- "conseil_prioritaire" = UN SEUL conseil, le plus impactant pour progresser, concret et actionnable, lie a un defaut reel observe dans la transcription.

Reponds UNIQUEMENT en JSON valide, sans markdown, sans backticks :
{
  "scores": {
    "realisation_tache": { "note": 0, "justification": "" },
    "lexique": { "note": 0, "justification": "" },
    "grammaire": { "note": 0, "justification": "" },
    "fluidite_prononciation": { "note": 0, "justification": "" },
    "interaction_coherence": { "note": 0, "justification": "" }
  },
  "total": 0,
  "niveau_cecrl": "",
  "niveau_nclc": "",
  "resume_niveau": "",
  "points_positifs": ["", "", ""],
  "points_ameliorer": ["", "", ""],
  "correction_simple": "",
  "version_amelioree": {
    "niveau_cible": "",
    "texte": ""
  },
  "phrases_utiles": ["", "", "", ""],
  "conseil_prioritaire": "",
  "objectif_prochain_essai": ""
}`.trim();
}

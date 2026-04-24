export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { conversation, scenario } = req.body;

    if (!conversation?.trim()) {
      return res.status(400).json({ error: "conversation is required" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: buildPrompt(conversation, scenario),
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

function buildPrompt(conversation, scenario) {
  return `Tu es un examinateur certifie TCF Canada, forme par France Education International.
Tu evalues la production orale d'un candidat.

TACHE : 2 — Interaction orale
SUJET / CONSIGNE : ${scenario || "Interaction orale TCF Canada"}

Evalue UNIQUEMENT les repliques du CANDIDAT (lignes [CANDIDAT]). Les repliques [EXAMINATEUR] sont du contexte.

TRANSCRIPTION DU DIALOGUE :
${conversation}

Evalue selon ces 5 criteres, chacun note de 0 a 4 :

1. REALISATION DE LA TACHE (0-4)
Le candidat a-t-il obtenu les informations recherchees ? A-t-il pose des questions pertinentes et variees ? A-t-il reagi et adapte ses questions aux reponses ?
- 0 = pas de reponse ou hors sujet
- 1 = tache a peine abordee, questions tres basiques (A1-A2)
- 2 = tache partiellement realisee, quelques questions pertinentes (B1 faible)
- 3 = tache bien realisee, questions variees et pertinentes (B1+/B2)
- 4 = tache pleinement accomplie, questions riches et reactives (B2+/C1)

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
- 3 = bon controle, structures variees, erreurs non systematiques (B2)
- 4 = excellent controle, variete syntaxique, rares erreurs ponctuelles (C1)

4. FLUIDITE & PRONONCIATION (0-4)
- 0 = incomprehensible
- 1 = hesitations longues et frequentes, prononciation souvent peu claire (A2)
- 2 = debit assez regulier malgre pauses de recherche, globalement intelligible (B1)
- 3 = discours fluide, peu d'hesitations, bonne prononciation et intonation (B2)
- 4 = discours naturel et spontane, intonation maitrisee, autocorrection efficace (C1)

5. INTERACTION & COHERENCE (0-4)
Reactivite aux reponses, relances, questions de suivi, adaptation au contexte, registre poli approprie
- 0 = aucune interaction, echanges totalement deconnectes
- 1 = reponses minimales, pas de relances, registre inadapte (A2)
- 2 = interaction basique, quelques relances simples, registre acceptable (B1)
- 3 = interaction fluide, relances variees, bonne adaptation aux reponses (B2)
- 4 = interaction naturelle et convaincante, registre parfaitement maitrise (C1)

BAREME NIVEAU :
0-4 : A1 | 5-7 : A2 | 8-11 : B1 | 12-15 : B2 | 16-18 : C1 | 19-20 : C2

CORRESPONDANCE NCLC :
A1=NCLC 1-2 | A2=NCLC 3-4 | B1=NCLC 5-6 | B2=NCLC 7-8 | C1=NCLC 9-10 | C2=NCLC 11-12

IMPORTANT :
- Sois STRICT et REALISTE. Un candidat avec tres peu de repliques ou des repliques tres courtes ne peut pas avoir B2.
- Chaque justification doit citer un EXEMPLE CONCRET tire de la transcription (une phrase reelle du candidat).
- "correction_simple" = les tours du CANDIDAT reformules avec les erreurs de langue corrigees, en conservant exactement le meme niveau de complexite et le meme sens.
- "version_amelioree" = repliques modeles du candidat AU NIVEAU JUSTE AU-DESSUS du niveau estime (si B1 estime, donner un modele B2 ; si B2, donner C1).
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { conversation, scenario, scenarioData, durationSec } = req.body;

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
        input: buildPrompt(conversation, scenario, scenarioData, durationSec),
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

function buildScenarioContext(scenario, scenarioData) {
  if (!scenarioData) return "";
  const pts = Array.isArray(scenarioData.points_cles_attendus)
    ? scenarioData.points_cles_attendus.map((p, i) => `${i + 1}. ${p}`).join("\n")
    : "";
  const errs = Array.isArray(scenarioData.erreurs_typiques_b1)
    ? scenarioData.erreurs_typiques_b1.map((e) => `- ${e}`).join("\n")
    : "";
  const exprs = Array.isArray(scenarioData.expressions_cles)
    ? scenarioData.expressions_cles.map((e) => `- "${e}"`).join("\n")
    : "";
  return `
CONTEXTE SPECIFIQUE DU SCENARIO "${scenario}" :

Points cles que le candidat devait absolument aborder :
${pts}

Erreurs typiques d'un candidat B1 sur ce scenario :
${errs}

Exemple de formulation B2 sur ce scenario :
"${scenarioData.difference_b1_b2_bon || ""}"

Expressions cles a maitriser pour ce scenario :
${exprs}

INSTRUCTION CRITIQUE : Dans tes points_ameliorer, cite explicitement les points cles que le candidat n'a PAS abordes. Exemple : "Tu n'as pas demande [point cle manquant]. Tu aurais pu dire : [expression cle adaptee du scenario]."
`;
}

function buildDurationRules(durationSec) {
  if (!durationSec || durationSec <= 0) return "";
  const d = Number(durationSec);
  if (d < 30) return "\nREGLES STRICTES DE NOTATION — DUREE TRES COURTE (moins de 30s de parole candidat) : realisation_tache = 0 ou 1 maximum. Total plafonne a 5/20. Niveau maximum : A1.\n";
  if (d < 60) return "\nREGLES STRICTES DE NOTATION — DUREE COURTE (moins de 60s de parole candidat) : Total plafonne a 7/20. Niveau maximum : A2.\n";
  if (d < 90) return "\nREGLES STRICTES DE NOTATION — DUREE INSUFFISANTE (moins de 90s de parole candidat) : Total plafonne a 9/20. Niveau maximum : A2+.\n";
  return "";
}

function buildPrompt(conversation, scenario, scenarioData, durationSec) {
  const contextBlock = buildScenarioContext(scenario, scenarioData);
  const durationBlock = buildDurationRules(durationSec);

  return `Tu es un examinateur certifie TCF Canada, forme par France Education International.
Tu evalues la production orale d'un candidat.

TACHE : 2 — Interaction orale
SUJET / CONSIGNE : ${scenario || "Interaction orale TCF Canada"}
${contextBlock}

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

EXEMPLES DE CALIBRATION — utilise ces exemples comme reference pour tes notes :

Niveau A2 (5-7/20) :
- Phrases tres courtes, souvent un seul mot : 'Oui', 'Non', 'Je sais pas'
- Pas de questions posees par le candidat, ou questions tres basiques d'un mot
- Vocabulaire de base uniquement, repetitions constantes
- Beaucoup d'hesitations longues (3-5 secondes), silences bloques
- Aucun connecteur logique

Niveau B1 (8-11/20) :
- Phrases simples mais completes : 'Je voudrais louer une voiture'
- Questions basiques : 'C'est combien ?', 'C'est quand ?'
- Connecteurs simples : et, mais, parce que, alors
- Quelques hesitations normales, debit irregulier mais intelligible
- Peut exprimer un besoin mais sans precision ni nuance

Niveau B2 (12-15/20) :
- Phrases complexes avec subordonnees et conditions
- Reformulations : 'Ce que je veux dire, c'est que...'
- Questions precisees et variees : 'Pourriez-vous me detailler les differentes formules ?'
- Connecteurs varies : cependant, en revanche, par consequent, a condition que
- Discours fluide avec rares hesitations
- Capacite a negocier, argumenter, nuancer

Niveau C1 (16-18/20) :
- Discours spontane et naturel, sans hesitations notables
- Vocabulaire riche, precis, registre parfaitement adapte a la situation
- Humour, ironie, nuances culturelles maitrisees
- Structure argumentative sophistiquee, reformulations elegantes

IMPORTANT :
- Sois STRICT et REALISTE. Un candidat avec tres peu de repliques ou des repliques tres courtes ne peut pas avoir B2.
- NOTES DIFFERENCIEES OBLIGATOIRES : Ne mets PAS la meme note a tous les criteres. Chaque critere doit etre evalue INDEPENDAMMENT. Un candidat peut avoir 3/4 en fluidite mais 1/4 en lexique. Le score 2/4 sur tous les criteres est un signal que tu n'as pas assez analyse la transcription. Relis chaque critere separement.
- Chaque justification doit citer un EXEMPLE CONCRET et DIFFERENT tire de la transcription (pas le meme exemple pour plusieurs criteres).
- "correction_simple" = les tours du CANDIDAT reformules avec les erreurs de langue corrigees, en conservant exactement le meme niveau de complexite et le meme sens.
- "version_amelioree" = repliques modeles du candidat AU NIVEAU JUSTE AU-DESSUS du niveau estime (si B1 estime, donner un modele B2 ; si B2, donner C1).
- "conseil_prioritaire" = UN SEUL conseil, le plus impactant pour progresser, concret et actionnable, lie a un defaut reel observe dans la transcription.
- STYLE DU FEEDBACK : Tutoie le candidat (tu, ton, tes) dans tous les champs texte — resume_niveau, points_positifs, points_ameliorer, correction_simple, version_amelioree, conseil_prioritaire, objectif_prochain_essai.
- CITATIONS OBLIGATOIRES : Dans chaque point_ameliorer, cite les mots ou phrases EXACTES de la transcription entre guillemets, puis donne la version corrigee directement. Ex : Tu as dit 'je veux un voiture' -> dis plutot 'je voudrais une voiture'.
- CONSEIL PRIORITAIRE ULTRA CONCRET : Pas de generalites ('enrichir le vocabulaire'). Donne des formules de remplacement specifiques. Ex : 'Au lieu de repeter je voudrais, utilise : j aurais aime, je souhaiterais, serait-il possible de...'


REGLES STRICTES DE NOTATION SELON LA DUREE :
- Moins de 30 secondes de parole candidat → realisation_tache = 0 ou 1 maximum, total plafonne a 5/20
- Moins de 60 secondes de parole candidat → total plafonne a 7/20
- Moins de 90 secondes de parole candidat → total plafonne a 9/20
- Une seule phrase du candidat dans toute la transcription → niveau maximum A2, jamais B1
${durationBlock}
REGLE ABSOLUE DE NOTATION :
- Tu DOIS avoir au moins 2 notes DIFFERENTES parmi les 5 criteres. Si tu mets la meme note partout, ton evaluation est REJETEE.
- Commence par identifier le critere le PLUS FAIBLE et le critere le PLUS FORT du candidat. Note-les en premier, puis note les 3 autres entre ces deux extremes.
- Exemples de distributions valides : 1-2-2-3-2, 2-1-3-2-3, 3-2-2-3-4
- Exemple de distributions INVALIDES : 2-2-2-2-2, 3-3-3-3-3

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

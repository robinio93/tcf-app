import fs from "node:fs";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import formidable from "formidable";

const OPENAI_REALTIME_URL = "https://api.openai.com/v1/realtime/client_secrets";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_TRANSCRIPTIONS_URL =
  "https://api.openai.com/v1/audio/transcriptions";

const SESSION_INSTRUCTIONS = [
  "La conversation se deroule uniquement en francais.",
  "Tu joues le role de l'interlocuteur dans une simulation orale TCF Canada tache 2.",
  "Le role exact et le contexte precis seront donnes juste apres la connexion.",
  "Ton objectif est de maintenir une conversation riche et variee d'au moins 3 minutes pour permettre au candidat de s'exprimer pleinement.",
  "Apres chaque reponse du candidat, pose une question de suivi ou apporte un element nouveau pour maintenir l'echange.",
  "Si le candidat donne une reponse courte ou vague, relance immediatement avec 'Et concernant...', 'Pourriez-vous preciser...', ou 'C'est-a-dire ?'.",
  "Revele les informations progressivement, en petites doses, pour que le candidat soit amene a poser plusieurs questions.",
  "Si l'echange dure moins de 3 minutes et que le candidat veut partir, relance avec un detail supplementaire. Apres 3 minutes, si le candidat conclut, laisse-le partir poliment.",
  "Au debut, ouvre avec une salutation courte et laisse le candidat exposer sa situation.",
  "Chaque reponse : 2 a 3 phrases maximum. Laisse toujours la place a une reaction du candidat.",
  "Ne corrige pas les fautes de francais. N'agis pas comme un professeur. Ne note pas le candidat.",
  "Reste dans le scenario. Reponds uniquement en francais naturel.",
].join(" ");

const SESSION_INSTRUCTIONS_TASK1 = [
  "La conversation se deroule uniquement en francais.",
  "Tu es un examinateur officiel du TCF Canada qui fait passer la Tache 1 : entretien dirige de 2 minutes.",
  "Tu poses des questions personnelles SIMPLES et DIRECTES sur des themes DIFFERENTS : travail, famille, loisirs, projets d'immigration, vie quotidienne.",
  "Tu changes de theme apres maximum 2 questions sur le meme sujet. Tu dois couvrir au moins 4 themes differents.",
  "Questions SIMPLES comme au vrai TCF : 'Quel est votre metier ?', 'Parlez-moi de votre famille.', 'Pourquoi voulez-vous immigrer au Canada ?'.",
  "Jamais de questions philosophiques ou analytiques. Niveau A2-B2 uniquement.",
  "Une seule question courte par tour. Tu attends la reponse complete. Vouvoiement obligatoire.",
  "Tu ne corriges jamais les erreurs. Tu ne donnes pas ton avis. Tu laisses le candidat parler 70% du temps.",
].join(" ");

function json(res, statusCode, payload, headers = {}) {
  res.statusCode = statusCode;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json");

  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  res.end(JSON.stringify(payload));
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readJsonBody(req) {
  const raw = await readRequestBody(req);
  return raw ? safeJsonParse(raw) : null;
}

async function readOpenAiJson(response) {
  const raw = await response.text();
  return {
    raw,
    data: raw ? safeJsonParse(raw) : null,
  };
}

function parseForm(req) {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

function ensureApiKey(env, res) {
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    json(res, 500, {
      error: "Missing OPENAI_API_KEY",
      message:
        "Set OPENAI_API_KEY in .env or .env.local before calling this endpoint in local dev.",
    });
    return null;
  }

  return apiKey;
}

function extractAnalysisText(data) {
  const raw =
    data?.output_text ||
    data?.output
      ?.map((item) =>
        item.content?.map((contentItem) => contentItem.text || "").join("")
      )
      .join("") ||
    "";

  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function buildRealtimeSessionPayload(instructions = SESSION_INSTRUCTIONS) {
  return {
    session: {
      type: "realtime",
      model: "gpt-realtime",
      instructions,
      output_modalities: ["audio"],
      max_output_tokens: "inf",
      audio: {
        input: {
          noise_reduction: {
            type: "far_field",
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1200,
            create_response: false,
            interrupt_response: false,
          },
        },
        output: {
          voice: "marin",
        },
      },
    },
  };
}

function buildDurationRules(durationSec) {
  const d = Number(durationSec);
  if (!d || d <= 0) return "";
  if (d < 30) return "\nREGLES STRICTES — DUREE TRES COURTE (moins de 30s) : realisation_tache = 0 ou 1 max. Total plafonne a 5/20. Niveau max : A1.\n";
  if (d < 60) return "\nREGLES STRICTES — DUREE COURTE (moins de 60s) : Total plafonne a 7/20. Niveau max : A2.\n";
  if (d < 90) return "\nREGLES STRICTES — DUREE INSUFFISANTE (moins de 90s) : Total plafonne a 9/20. Niveau max : A2+.\n";
  return "";
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
  return `\nCONTEXTE SPECIFIQUE DU SCENARIO "${scenario}" :\n\nPoints cles que le candidat devait absolument aborder :\n${pts}\n\nErreurs typiques d'un candidat B1 sur ce scenario :\n${errs}\n\nExemple de formulation B2 :\n"${scenarioData.difference_b1_b2_bon || ""}"\n\nExpressions cles a maitriser :\n${exprs}\n\nINSTRUCTION CRITIQUE : Dans tes points_ameliorer, cite explicitement les points cles que le candidat n'a PAS abordes.\n`;
}

function buildAnalyzeInteractionPayload(conversation, scenario, scenarioData, durationSec) {
  const contextBlock = buildScenarioContext(scenario, scenarioData);
  const durationBlock = buildDurationRules(durationSec);
  return {
    model: "gpt-4o-mini",
    input: `Tu es un examinateur certifie TCF Canada, forme par France Education International.
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
- Sois STRICT et REALISTE. Un candidat avec tres peu de repliques ne peut pas avoir B2.
- NOTES DIFFERENCIEES OBLIGATOIRES : Ne mets PAS la meme note a tous les criteres. Chaque critere doit etre evalue INDEPENDAMMENT. Un candidat peut avoir 3/4 en fluidite mais 1/4 en lexique. Le score 2/4 sur tous les criteres est un signal que tu n'as pas assez analyse la transcription. Relis chaque critere separement et justifie avec des exemples DIFFERENTS tires de la transcription.
- Chaque justification doit citer un EXEMPLE CONCRET et DIFFERENT tire de la transcription (pas le meme exemple pour plusieurs criteres).
- "correction_simple" = les tours du CANDIDAT reformules avec les erreurs corrigees, meme niveau de complexite.
- "version_amelioree" = repliques modeles AU NIVEAU JUSTE AU-DESSUS du niveau estime.
- "conseil_prioritaire" = UN SEUL conseil concret et actionnable, le plus impactant.
- STYLE DU FEEDBACK : Tutoie le candidat (tu, ton, tes) dans tous les champs texte — resume_niveau, points_positifs, points_ameliorer, correction_simple, version_amelioree, conseil_prioritaire, objectif_prochain_essai.
- CITATIONS OBLIGATOIRES : Dans chaque point_ameliorer, cite les mots ou phrases EXACTES de la transcription entre guillemets, puis donne la version corrigee directement. Ex : Tu as dit 'je veux un voiture' -> dis plutot 'je voudrais une voiture'.
- CONSEIL PRIORITAIRE ULTRA CONCRET : Pas de generalites ('enrichir le vocabulaire'). Donne des formules de remplacement specifiques. Ex : 'Au lieu de repeter je voudrais, utilise : j'aurais aime, je souhaiterais, serait-il possible de...'

REGLES STRICTES DE NOTATION SELON LA DUREE :
- Moins de 30 secondes de parole candidat → realisation_tache = 0 ou 1 maximum, total plafonne a 5/20
- Moins de 60 secondes de parole candidat → total plafonne a 7/20
- Moins de 90 secondes de parole candidat → total plafonne a 9/20
- Une seule phrase du candidat dans toute la transcription → niveau maximum A2, jamais B1
\${durationBlock}
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
  "version_amelioree": { "niveau_cible": "", "texte": "" },
  "phrases_utiles": ["", "", "", ""],
  "conseil_prioritaire": "",
  "objectif_prochain_essai": ""
}`.trim(),
  };
}

function buildAnalyzeInterviewPayload(conversation, durationSec) {
  const dureeStr = Number.isFinite(Number(durationSec))
    ? `${Math.max(1, Number(durationSec))} secondes`
    : "inconnue";

  return {
    model: "gpt-4o-mini",
    input: `Tu es un examinateur certifie TCF Canada, forme par France Education International.
Tu evalues la production orale d'un candidat sur la TACHE 1 (entretien dirige, 2 minutes).

SPECIFICITES DE LA TACHE 1 :
- Le candidat repond a des questions personnelles simples posees par l'examinateur
- Il doit parler de lui de maniere naturelle : presentation, famille, travail, loisirs, projets
- Le niveau attendu est A2-B2 (pas besoin d'argumenter ou negocier)
- L'important : spontaneite, reponses completes et developpees, variete des sujets abordes

TRANSCRIPTION DU DIALOGUE :
${conversation}

DUREE REELLE DE L'ENTRETIEN : ${dureeStr}

Evalue UNIQUEMENT les repliques du CANDIDAT (lignes [CANDIDAT]). Les repliques [EXAMINATEUR] sont du contexte.

Evalue selon ces 5 criteres, chacun note de 0 a 4 :

1. REALISATION DE LA TACHE (0-4)
Le candidat a-t-il repondu avec des phrases COMPLETES et DEVELOPPEES ? A-t-il couvert plusieurs aspects de sa vie ?
- 0 = reponses d'un seul mot, questions eludees
- 1 = reponses minimales, souvent un seul mot (A2-)
- 2 = reponses courtes mais completes, peu de details (A2/B1 faible)
- 3 = reponses developpees avec details sur plusieurs sujets (B1/B2)
- 4 = reponses riches, detaillees, naturelles (B2+/C1)
ATTENTION : Si la duree est inferieure a 90 secondes, ce critere est plafonne a 2/4.

2. LEXIQUE (0-4)
- 1 = vocabulaire tres limite, memes mots repetes (A2)
- 2 = vocabulaire suffisant pour parler de sa vie (B1)
- 3 = vocabulaire varie, peut nuancer et decrire avec precision (B2)
- 4 = vocabulaire riche, expressions variees (C1)

3. GRAMMAIRE (0-4)
- 1 = erreurs frequentes dans les accords, conjugaisons, articles (A2)
- 2 = present et passe compose corrects, quelques erreurs complexes (B1)
- 3 = bon controle general, structures variees (B2)
- 4 = excellent controle, variete syntaxique (C1)

4. FLUIDITE ET PRONONCIATION (0-4)
- 1 = hesitations tres longues, prononciation difficile (A2)
- 2 = debit assez regulier, globalement intelligible (B1)
- 3 = discours fluide, prononciation claire (B2)
- 4 = naturel, debit spontane (C1)

5. INTERACTION ET SPONTANEITE (0-4)
Capacite a reagir naturellement aux questions, sans reciter un texte appris.
- 0 = ne repond pas aux questions ou recite un texte prepare
- 1 = peu de spontaneite, reponses hors-contexte (A2)
- 2 = repond simplement, ecoute la question (B1)
- 3 = repond naturellement, fait des liens entre sujets (B2)
- 4 = spontaneite totale, reactions naturelles (C1)
ATTENTION : Si reponses en UN SEUL MOT repetees, plafonne a 1/4.

BAREME TOTAL : 0-4 A1 | 5-7 A2 | 8-11 B1 | 12-15 B2 | 16-18 C1 | 19-20 C2
NCLC : A1=1-2 | A2=3-4 | B1=5-6 | B2=7-8 | C1=9-10 | C2=11-12

EXEMPLES DE CALIBRATION :
A2 (5-7) : reponses d'un mot ('Oui', 'Trois enfants', 'Ingenieur'), aucun developpement, vocabulaire tres basique
B1 (8-11) : phrases completes mais courtes, connecteurs simples (et, mais, parce que), debit irregulier
B2 (12-15) : reponses developpees avec details, vocabulaire varie, discours fluide, structures complexes

IMPORTANT :
- NOTES DIFFERENCIEES OBLIGATOIRES : au moins 2 notes DIFFERENTES parmi les 5 criteres.
- Chaque justification DOIT citer un exemple CONCRET tire de la transcription.
- STYLE : Tutoie le candidat (tu, ton, tes) dans tous les champs texte.
- CITATIONS : Dans points_ameliorer, cite les mots EXACTS entre guillemets puis donne la version amelioree.
- CONSEIL PRIORITAIRE : ultra concret avec formules de remplacement specifiques.
- VERSION AMELIOREE : prends une reponse reelle et montre la reformulation au niveau superieur.

REGLE ABSOLUE : au moins 2 notes DIFFERENTES. Distributions INVALIDES : 2-2-2-2-2, 3-3-3-3-3.

Reponds UNIQUEMENT en JSON valide, sans markdown, sans backticks :
{
  "scores": {
    "realisation_tache": { "note": 0, "justification": "" },
    "lexique": { "note": 0, "justification": "" },
    "grammaire": { "note": 0, "justification": "" },
    "fluidite_prononciation": { "note": 0, "justification": "" },
    "interaction_spontaneite": { "note": 0, "justification": "" }
  },
  "total": 0,
  "niveau_cecrl": "",
  "niveau_nclc": "",
  "resume_niveau": "",
  "points_positifs": ["", "", ""],
  "points_ameliorer": ["", "", ""],
  "correction_simple": "",
  "version_amelioree": { "niveau_cible": "", "texte": "" },
  "phrases_utiles": ["", "", "", ""],
  "conseil_prioritaire": "",
  "objectif_prochain_essai": ""
}`.trim(),
  };
}

function buildAnalyzeTextPayload(prompt, durationSec) {
  const dureeStr = Number.isFinite(Number(durationSec))
    ? `${Math.max(1, Number(durationSec))} secondes`
    : "inconnue";

  return {
    model: "gpt-4o-mini",
    input: `Tu es un examinateur certifie TCF Canada, forme par France Education International.
Tu evalues la production orale d'un candidat.

TACHE : 3 — Exprimer un point de vue
DUREE DE LA PRODUCTION : ${dureeStr}

TRANSCRIPTION DU MONOLOGUE :
${prompt}

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
- 3 = bon controle, structures variees, erreurs non systematiques (B2)
- 4 = excellent controle, variete syntaxique, rares erreurs ponctuelles (C1)

4. FLUIDITE & PRONONCIATION (0-4)
- 0 = incomprehensible
- 1 = hesitations longues et frequentes, prononciation souvent peu claire (A2)
- 2 = debit assez regulier malgre pauses de recherche, globalement intelligible (B1)
- 3 = discours fluide, peu d'hesitations, bonne prononciation et intonation (B2)
- 4 = discours naturel et spontane, intonation maitrisee, autocorrection efficace (C1)

5. INTERACTION & COHERENCE (0-4)
Structure du discours (intro, developpement, conclusion), connecteurs logiques, registre adapte
- 0 = discours entierement decousu
- 1 = pas de structure, connecteurs absents, registre inadapte (A2)
- 2 = structure basique, connecteurs simples (et, mais, parce que) (B1)
- 3 = structure claire, connecteurs varies (cependant, en revanche, par consequent) (B2)
- 4 = argumentation brillante, registre parfaitement maitrise (C1)

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
- Sois STRICT et REALISTE. Moins de 30s = realisation_tache note 1 max. Moins de 60s = total 10 max. Moins de 120s = total 13 max.
- Chaque justification doit citer un EXEMPLE CONCRET tire de la transcription.
- "correction_simple" = le monologue reformule avec les erreurs corrigees, meme niveau de complexite.
- "version_amelioree" = modele AU NIVEAU JUSTE AU-DESSUS du niveau estime.
- "conseil_prioritaire" = UN SEUL conseil concret et actionnable, le plus impactant.
- STYLE DU FEEDBACK : Tutoie le candidat (tu, ton, tes) dans tous les champs texte — resume_niveau, points_positifs, points_ameliorer, correction_simple, version_amelioree, conseil_prioritaire, objectif_prochain_essai.
- CITATIONS OBLIGATOIRES : Dans chaque point_ameliorer, cite les mots ou phrases EXACTES de la transcription entre guillemets, puis donne la version corrigee directement. Ex : Tu as dit 'je veux un voiture' -> dis plutot 'je voudrais une voiture'.
- CONSEIL PRIORITAIRE ULTRA CONCRET : Pas de generalites ('enrichir le vocabulaire'). Donne des formules de remplacement specifiques. Ex : 'Au lieu de repeter je voudrais, utilise : j'aurais aime, je souhaiterais, serait-il possible de...'

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
  "version_amelioree": { "niveau_cible": "", "texte": "" },
  "phrases_utiles": ["", "", "", ""],
  "conseil_prioritaire": "",
  "objectif_prochain_essai": ""
}`.trim(),
  };
}

function localApiDevPlugin(env) {
  return {
    name: "local-api-dev-routes",
    configureServer(server) {
      server.middlewares.use("/api/realtime-session", async (req, res) => {
        if (req.method !== "GET" && req.method !== "POST") {
          json(
            res,
            405,
            {
              error: "Method not allowed",
              message: "Use GET or POST to create a Realtime session.",
            },
            { Allow: "GET, POST" }
          );
          return;
        }

        const apiKey = ensureApiKey(env, res);
        if (!apiKey) return;

        try {
          const openaiResponse = await fetch(OPENAI_REALTIME_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(buildRealtimeSessionPayload()),
          });

          const { raw, data } = await readOpenAiJson(openaiResponse);

          json(res, openaiResponse.status, data || { raw });
        } catch (error) {
          json(res, 500, {
            error: "Unexpected server error",
            message: error?.message || "Unknown error",
          });
        }
      });

      server.middlewares.use("/api/realtime-session-task1", async (req, res) => {
        if (req.method !== "GET" && req.method !== "POST") {
          json(res, 405, { error: "Method not allowed", message: "Use GET or POST." }, { Allow: "GET, POST" });
          return;
        }
        const apiKey = ensureApiKey(env, res);
        if (!apiKey) return;
        try {
          const openaiResponse = await fetch(OPENAI_REALTIME_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(buildRealtimeSessionPayload(SESSION_INSTRUCTIONS_TASK1)),
          });
          const { raw, data } = await readOpenAiJson(openaiResponse);
          json(res, openaiResponse.status, data || { raw });
        } catch (error) {
          json(res, 500, { error: "Unexpected server error", message: error?.message || "Unknown error" });
        }
      });

      server.middlewares.use("/api/analyze-text", async (req, res) => {
        if (req.method !== "POST") {
          json(
            res,
            405,
            { error: "Method not allowed" },
            { Allow: "POST" }
          );
          return;
        }

        const apiKey = ensureApiKey(env, res);
        if (!apiKey) return;

        try {
          const body = await readJsonBody(req);
          const prompt = typeof body?.prompt === "string" ? body.prompt : "";
          const durationSec = Number(body?.durationSec);

          if (!prompt.trim()) {
            json(res, 400, { error: "Prompt is required" });
            return;
          }

          const openaiResponse = await fetch(OPENAI_RESPONSES_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(
              buildAnalyzeTextPayload(
                prompt,
                Number.isFinite(durationSec) ? durationSec : null
              )
            ),
          });

          const { raw, data } = await readOpenAiJson(openaiResponse);

          if (!openaiResponse.ok) {
            json(res, openaiResponse.status, {
              error: data?.error?.message || raw || "OpenAI request failed",
            });
            return;
          }

          if (!data) {
            json(res, 502, {
              error: "OpenAI returned an empty response",
            });
            return;
          }

          json(res, 200, {
            analysis: extractAnalysisText(data),
          });
        } catch (error) {
          json(res, 500, {
            error: "Server error",
            details: error?.message || "Unknown error",
          });
        }
      });

      server.middlewares.use("/api/analyze-interaction", async (req, res) => {
        if (req.method !== "POST") {
          json(res, 405, { error: "Method not allowed" }, { Allow: "POST" });
          return;
        }

        const apiKey = ensureApiKey(env, res);
        if (!apiKey) return;

        try {
          const body = await readJsonBody(req);
          const conversation = typeof body?.conversation === "string" ? body.conversation : "";
          const scenario = typeof body?.scenario === "string" ? body.scenario : "";
          const scenarioData = body?.scenarioData ?? null;
          const durationSec = Number(body?.durationSec) || 0;

          if (!conversation.trim()) {
            json(res, 400, { error: "conversation is required" });
            return;
          }

          const openaiResponse = await fetch(OPENAI_RESPONSES_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(buildAnalyzeInteractionPayload(conversation, scenario, scenarioData, durationSec)),
          });

          const { raw, data } = await readOpenAiJson(openaiResponse);

          if (!openaiResponse.ok) {
            json(res, openaiResponse.status, {
              error: data?.error?.message || raw || "OpenAI request failed",
            });
            return;
          }

          if (!data) {
            json(res, 502, { error: "OpenAI returned an empty response" });
            return;
          }

          json(res, 200, { analysis: extractAnalysisText(data) });
        } catch (error) {
          json(res, 500, { error: "Server error", details: error?.message || "Unknown error" });
        }
      });

      server.middlewares.use("/api/analyze-interview", async (req, res) => {
        if (req.method !== "POST") {
          json(res, 405, { error: "Method not allowed" }, { Allow: "POST" });
          return;
        }
        const apiKey = ensureApiKey(env, res);
        if (!apiKey) return;
        try {
          const body = await readJsonBody(req);
          const conversation = typeof body?.conversation === "string" ? body.conversation : "";
          const durationSec = Number(body?.durationSec);

          if (!conversation.trim()) {
            json(res, 400, { error: "conversation is required" });
            return;
          }

          const openaiResponse = await fetch(OPENAI_RESPONSES_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify(buildAnalyzeInterviewPayload(conversation, Number.isFinite(durationSec) ? durationSec : null)),
          });

          const { raw, data } = await readOpenAiJson(openaiResponse);

          if (!openaiResponse.ok) {
            json(res, openaiResponse.status, { error: data?.error?.message || raw || "OpenAI request failed" });
            return;
          }

          if (!data) {
            json(res, 502, { error: "OpenAI returned an empty response" });
            return;
          }

          json(res, 200, { analysis: extractAnalysisText(data) });
        } catch (error) {
          json(res, 500, { error: "Server error", details: error?.message || "Unknown error" });
        }
      });

      server.middlewares.use("/api/transcribe", async (req, res) => {
        if (req.method !== "POST") {
          json(
            res,
            405,
            { error: "Method not allowed" },
            { Allow: "POST" }
          );
          return;
        }

        const apiKey = ensureApiKey(env, res);
        if (!apiKey) return;

        try {
          const { fields, files } = await parseForm(req);
          const uploadedFile = files.file;

          if (!uploadedFile) {
            json(res, 400, { error: "File is required" });
            return;
          }

          const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
          const modelField = Array.isArray(fields.model)
            ? fields.model[0]
            : fields.model;
          const model = modelField || "gpt-4o-mini-transcribe";
          const fileBuffer = fs.readFileSync(file.filepath);

          const formData = new FormData();
          formData.append(
            "file",
            new Blob([fileBuffer], { type: file.mimetype || "audio/webm" }),
            file.originalFilename || "audio.webm"
          );
          formData.append("model", model);

          const openaiResponse = await fetch(OPENAI_TRANSCRIPTIONS_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
          });

          const { raw, data } = await readOpenAiJson(openaiResponse);

          if (!openaiResponse.ok) {
            json(res, openaiResponse.status, {
              error: data?.error?.message || raw || "Transcription failed",
            });
            return;
          }

          if (!data) {
            json(res, 502, {
              error: "OpenAI returned an empty transcription response",
            });
            return;
          }

          json(res, 200, {
            text: data.text || "",
          });
        } catch (error) {
          json(res, 500, {
            error: "Server error",
            details: error?.message || "Unknown error",
          });
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), localApiDevPlugin(env)],
  };
});

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
  "Ne conclus JAMAIS la conversation avant 3 minutes. Si le candidat tente de conclure, relance avec un detail supplementaire.",
  "Au debut, ouvre avec une salutation courte et laisse le candidat exposer sa situation.",
  "Chaque reponse : 2 a 3 phrases maximum. Laisse toujours la place a une reaction du candidat.",
  "Ne corrige pas les fautes de francais. N'agis pas comme un professeur. Ne note pas le candidat.",
  "Reste dans le scenario. Reponds uniquement en francais naturel.",
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

function buildRealtimeSessionPayload() {
  return {
    session: {
      type: "realtime",
      model: "gpt-realtime",
      instructions: SESSION_INSTRUCTIONS,
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

function buildAnalyzeInteractionPayload(conversation, scenario) {
  return {
    model: "gpt-4o-mini",
    input: `Tu es un examinateur certifie TCF Canada, forme par France Education International.
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
- Sois STRICT et REALISTE. Un candidat avec tres peu de repliques ne peut pas avoir B2.
- Chaque justification doit citer un EXEMPLE CONCRET tire de la transcription.
- "correction_simple" = les tours du CANDIDAT reformules avec les erreurs corrigees, meme niveau de complexite.
- "version_amelioree" = repliques modeles AU NIVEAU JUSTE AU-DESSUS du niveau estime.
- "conseil_prioritaire" = UN SEUL conseil concret et actionnable, le plus impactant.

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

IMPORTANT :
- Sois STRICT et REALISTE. Moins de 30s = realisation_tache note 1 max. Moins de 60s = total 10 max. Moins de 120s = total 13 max.
- Chaque justification doit citer un EXEMPLE CONCRET tire de la transcription.
- "correction_simple" = le monologue reformule avec les erreurs corrigees, meme niveau de complexite.
- "version_amelioree" = modele AU NIVEAU JUSTE AU-DESSUS du niveau estime.
- "conseil_prioritaire" = UN SEUL conseil concret et actionnable, le plus impactant.

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
            body: JSON.stringify(buildAnalyzeInteractionPayload(conversation, scenario)),
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

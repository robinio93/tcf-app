const OPENAI_REALTIME_URL = "https://api.openai.com/v1/realtime/client_secrets";

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

function buildSessionPayload() {
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

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({
      error: "Method not allowed",
      message: "Use GET or POST to create a Realtime session.",
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "Missing OPENAI_API_KEY",
      message: "Set OPENAI_API_KEY in the Vercel environment before calling this endpoint.",
    });
  }

  try {
    const openaiResponse = await fetch(OPENAI_REALTIME_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildSessionPayload()),
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return res.status(openaiResponse.status).json({
        error: "OpenAI session creation failed",
        details: data,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected server error",
      message:
        error && error.message ? error.message : "Unknown error",
    });
  }
};

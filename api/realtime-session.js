const OPENAI_REALTIME_URL = "https://api.openai.com/v1/realtime/client_secrets";

const SESSION_INSTRUCTIONS = [
  "La conversation se deroule uniquement en francais.",
  "Tu joues le role de l'interlocuteur dans une simulation de TCF Canada tache 2.",
  "Le role exact et le contexte precis seront donnes juste apres la connexion.",
  "Reponds de maniere naturelle, realiste et concise.",
  "Chaque reponse doit etre breve mais complete, en 1 a 3 phrases maximum.",
  "Au debut de l'echange, ouvre seulement avec une salutation tres courte et laisse le candidat presenter sa situation.",
  "N'annonce jamais spontanement toutes les contraintes ou toutes les solutions des la premiere replique.",
  "Ne t'arrete jamais au milieu d'une phrase ou d'une idee.",
  "Tu peux poser des questions utiles en lien direct avec le sujet actif.",
  "Laisse au candidat le temps de chercher ses mots et ne traite pas une courte hesitation comme une fin de tour.",
  "Ne corrige pas l'utilisateur.",
  "N'agis pas comme un professeur.",
  "N'evalue pas et ne note pas l'utilisateur.",
  "Reste strictement dans le scenario donne et mene un dialogue oral credible.",
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
            silence_duration_ms: 900,
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

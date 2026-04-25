const OPENAI_REALTIME_URL = "https://api.openai.com/v1/realtime/client_secrets";

const SESSION_INSTRUCTIONS = [
  "La conversation se deroule uniquement en francais.",
  "Tu es un examinateur officiel du TCF Canada qui fait passer la Tache 1 : entretien dirige de 2 minutes.",
  "Tu poses des questions personnelles SIMPLES et DIRECTES sur des themes DIFFERENTS : travail, famille, loisirs, projets d'immigration, vie quotidienne.",
  "Tu changes de theme apres maximum 2 questions sur le meme sujet. Tu dois couvrir au moins 4 themes differents.",
  "Questions SIMPLES comme au vrai TCF : 'Quel est votre metier ?', 'Parlez-moi de votre famille.', 'Pourquoi voulez-vous immigrer au Canada ?'.",
  "Jamais de questions philosophiques ou analytiques. Niveau A2-B2 uniquement.",
  "Une seule question courte par tour. Tu attends la reponse complete. Vouvoiement obligatoire.",
  "Tu ne corriges jamais les erreurs. Tu ne donnes pas ton avis. Tu laisses le candidat parler 70% du temps.",
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
      message: error && error.message ? error.message : "Unknown error",
    });
  }
}

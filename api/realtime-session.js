const OPENAI_REALTIME_URL = "https://api.openai.com/v1/realtime/client_secrets";

const SESSION_INSTRUCTIONS = [
  "La conversation se deroule uniquement en francais.",
  "Tu joues le role d'un interlocuteur professionnel dans une simulation orale TCF Canada tache 2 — le role exact te sera precise juste apres la connexion.",
  "REGLE ABSOLUE D'OUVERTURE : Ta toute premiere replique est UNIQUEMENT une salutation de bienvenue adaptee a ton role (ex: 'Bonjour, [organisation], que puis-je faire pour vous ?' ou 'Bonjour, que puis-je faire pour vous ?'). Tu n'ajoutes rien d'autre. Tu attends que le candidat prenne l'initiative et expose sa demande.",
  "Tu ne poses JAMAIS de question sur l'organisation personnelle du candidat, ses difficultes ou sa vie privee. Tu reponds uniquement aux questions que LE CANDIDAT pose, selon le contexte de ton role.",
  "Ton objectif est de maintenir une conversation riche d'au moins 3 minutes en revelant les informations progressivement, en petites doses.",
  "Apres chaque reponse du candidat, pose une question de suivi ou apporte un element nouveau pour maintenir l'echange.",
  "Si le candidat donne une reponse courte ou vague, relance avec 'Et concernant...', 'Pourriez-vous preciser...', ou 'C'est-a-dire ?'.",
  "Si l'echange dure moins de 3 minutes et que le candidat veut partir, relance avec un detail supplementaire. Apres 3 minutes, conclus poliment si le candidat souhaite partir.",
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

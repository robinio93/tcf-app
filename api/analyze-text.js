export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;

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
        model: "gpt-5.4-mini",
        input: `
Rôle : examinateur-coach expert TCF Canada, focalisé sur la TÂCHE 3 : exprimer un point de vue.

IMPORTANT :
- Retourne UNIQUEMENT un JSON valide.
- Aucun texte autour.
- Scores = entiers 0 à 10.

Format JSON :
{
  "meta": {
    "niveau_cecr_cible": "",
    "confiance": 0.8,
    "resume_une_phrase": ""
  },
  "score": {
    "structure": 0,
    "argumentation": 0,
    "langue": 0,
    "fluidite": 0,
    "communication": 0
  },
  "diagnostic": {
    "points_positifs": ["", "", ""],
    "points_a_ameliorer": ["", "", ""]
  },
  "corrections": {
    "correction_simple": "",
    "version_amelioree_b2": ""
  },
  "coaching": {
    "plan_amelioration": ["", "", ""],
    "phrases_a_utiliser": ["", "", "", "", "", ""],
    "objectif_prochain_essai": ""
  },
  "flags": {
    "duree_trop_courte": false,
    "contradiction_opinion": false,
    "exemple_absent": false,
    "hors_sujet": false,
    "hesitations_fortes": false
  }
}

Transcription :
${prompt}
        `.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI request failed",
      });
    }

    const analysis =
      data.output_text ||
      data.output?.map((item) =>
        item.content?.map((c) => c.text || "").join("")
      ).join("") ||
      "";

    return res.status(200).json({ analysis });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message,
    });
  }
}
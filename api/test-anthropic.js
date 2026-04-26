import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: "Réponds simplement : 'Connexion Anthropic OK'",
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: response.content[0].text,
      model_used: "claude-sonnet-4-6",
    });
  } catch (err) {
    console.error("[test-anthropic] Erreur:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("multipart/form-data")) {
      return res.status(400).json({ error: "Invalid content type" });
    }

    const bodyBuffer = await readRequestBody(req);

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": contentType,
      },
      body: bodyBuffer,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Transcription failed",
      });
    }

    return res.status(200).json({
      text: data.text || "",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message,
    });
  }
}
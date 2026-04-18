import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fields, files } = await parseForm(req);

    const uploadedFile = files.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: "File is required" });
    }

    const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
    const modelField = Array.isArray(fields.model) ? fields.model[0] : fields.model;
    const model = modelField || "gpt-4o-mini-transcribe";

    const fileBuffer = fs.readFileSync(file.filepath);

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([fileBuffer], { type: file.mimetype || "audio/webm" }),
      file.originalFilename || "audio.webm"
    );
    formData.append("model", model);

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
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
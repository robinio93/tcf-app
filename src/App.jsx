import { useRef, useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

function App() {
  const sujets = [
    "Pensez-vous que les jeunes devraient commencer à travailler pendant leurs études ?",
    "Pensez-vous qu’il est important d’avoir une activité physique régulière dans la vie quotidienne ?",
    "À votre avis, est-il préférable de vivre dans une grande ville ou dans une petite ville ?",
    "Est-il préférable de faire ses achats en ligne ou dans un magasin physique ?",
  ];

  const MIN_TIME = 120; // 2 minutes
  const MAX_TIME = 270; // 4 min 30

  const [sujet, setSujet] = useState(sujets[0]);
  const [feedback, setFeedback] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [time, setTime] = useState(0);
  const [niveau, setNiveau] = useState("");
  const [showTranscription, setShowTranscription] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | recording | processing | result

  const [showDevMode, setShowDevMode] = useState(false);
  const [devText, setDevText] = useState("");
  const [devDuration, setDevDuration] = useState(150);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const isRecording = status === "recording";
  const isProcessing = status === "processing";
  const hasResult = status === "result";

  const testSave = async () => {
    const { data, error } = await supabase.from("attempts").insert([
      {
        transcript: "test",
        score: 10,
        level: "B1",
        feedback: { ok: true },
      },
    ]);

    console.log("DATA:", data);
    console.log("ERROR:", error);
  };

  useEffect(() => {
    testSave();
  }, []);

  function changerSujet() {
    if (isRecording || isProcessing) return;
    const index = Math.floor(Math.random() * sujets.length);
    setSujet(sujets[index]);
    resetSession();
  }

  function resetSession() {
    if (isProcessing) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setFeedback(null);
    setTranscription("");
    setTime(0);
    setNiveau("");
    setShowTranscription(false);
    setStatus("idle");
  }

  function resetVisualResultOnly() {
    setFeedback(null);
    setTranscription("");
    setTime(0);
    setNiveau("");
    setShowTranscription(false);
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Number(seconds) || 0);
    const min = Math.floor(safe / 60);
    const sec = safe % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }

  function getTimerColor() {
    return time < MIN_TIME ? "#fb7185" : "#22c55e";
  }

  function getTimerLabel() {
    if (time === 0) return "Prêt à commencer";
    return time < MIN_TIME
      ? "Minimum conseillé non atteint"
      : "Minimum conseillé atteint";
  }

  function getStatusConfig() {
    if (status === "recording") {
      return {
        label: "Enregistrement en cours",
        emoji: "🎙️",
        color: "#fda4af",
        bg: "rgba(239, 68, 68, 0.12)",
        border: "1px solid rgba(239, 68, 68, 0.25)",
      };
    }

    if (status === "processing") {
      return {
        label: "Analyse IA en cours",
        emoji: "⏳",
        color: "#93c5fd",
        bg: "rgba(59, 130, 246, 0.12)",
        border: "1px solid rgba(59, 130, 246, 0.25)",
      };
    }

    if (status === "result") {
      return {
        label: "Résultat disponible",
        emoji: "✅",
        color: "#86efac",
        bg: "rgba(34, 197, 94, 0.12)",
        border: "1px solid rgba(34, 197, 94, 0.25)",
      };
    }

    return {
      label: "Prêt",
      emoji: "🟢",
      color: "#cbd5e1",
      bg: "rgba(148, 163, 184, 0.08)",
      border: "1px solid rgba(148, 163, 184, 0.18)",
    };
  }

  function getTimerProgress() {
    return Math.min((time / MAX_TIME) * 100, 100);
  }

  function getCardStyle() {
    return {
      background: "rgba(15, 23, 42, 0.72)",
      border: "1px solid rgba(148, 163, 184, 0.14)",
      borderRadius: "24px",
      padding: "28px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
      backdropFilter: "blur(10px)",
    };
  }

  function getButtonStyle(type = "secondary", disabled = false) {
    const base = {
      border: "none",
      borderRadius: "16px",
      padding: "14px 22px",
      fontSize: "16px",
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.2s ease",
      color: "white",
      minWidth: "170px",
      boxShadow: disabled ? "none" : "0 10px 25px rgba(0,0,0,0.2)",
      opacity: disabled ? 0.45 : 1,
    };

    if (type === "green") {
      return {
        ...base,
        background: "linear-gradient(135deg, #22c55e, #16a34a)",
      };
    }

    if (type === "red") {
      return {
        ...base,
        background: "linear-gradient(135deg, #ef4444, #dc2626)",
      };
    }

    if (type === "blue") {
      return {
        ...base,
        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
      };
    }

    if (type === "violet") {
      return {
        ...base,
        background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
      };
    }

    if (type === "dark") {
      return {
        ...base,
        background: "linear-gradient(135deg, #334155, #1e293b)",
      };
    }

    return {
      ...base,
      background: "linear-gradient(135deg, #475569, #334155)",
    };
  }

  function getInputStyle() {
    return {
      width: "100%",
      background: "rgba(255,255,255,0.06)",
      color: "white",
      border: "1px solid rgba(148, 163, 184, 0.18)",
      borderRadius: "16px",
      padding: "14px 16px",
      fontSize: "15px",
      outline: "none",
      boxSizing: "border-box",
    };
  }

  function safeJsonParse(str) {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  function extractJsonFromText(text) {
    if (!text || typeof text !== "string") return null;

    const direct = safeJsonParse(text);
    if (direct) return direct;

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    return safeJsonParse(match[0]);
  }

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeArray(value, expectedLength) {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, expectedLength);
  }

  function normalizeBoolean(value) {
    return Boolean(value);
  }

  function normalizeScoreValue(value) {
    const n = Number(value);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(10, Math.round(n)));
  }

  function normalizeConfidence(value) {
    if (typeof value !== "number" || Number.isNaN(value)) return null;
    return Math.max(0.5, Math.min(0.95, value));
  }

  function levelFromTotal50(total) {
    if (total <= 7) return "A1 non atteint";
    if (total <= 14) return "A1";
    if (total <= 23) return "A2";
    if (total <= 31) return "B1";
    return "B2";
  }

  function durationCapMaxTotal(durationSec) {
    if (durationSec < 20) return 14;
    if (durationSec < 45) return 20;
    if (durationSec < 60) return 22;
    if (durationSec < 90) return 26;
    if (durationSec < 120) return 31;
    return 39;
  }

  function applyCapWithPriority(scores, maxTotal, order = null) {
    const keys =
      order ||
      ["argumentation", "structure", "fluidite", "communication", "langue"];

    const s = {
      structure: normalizeScoreValue(scores.structure),
      argumentation: normalizeScoreValue(scores.argumentation),
      langue: normalizeScoreValue(scores.langue),
      fluidite: normalizeScoreValue(scores.fluidite),
      communication: normalizeScoreValue(scores.communication),
    };

    let total =
      s.structure +
      s.argumentation +
      s.langue +
      s.fluidite +
      s.communication;

    if (total <= maxTotal) {
      return { ...s, total };
    }

    while (total > maxTotal) {
      let changed = false;

      for (const key of keys) {
        if (s[key] > 0 && total > maxTotal) {
          s[key] -= 1;
          total -= 1;
          changed = true;
        }
      }

      if (!changed) break;
    }

    return { ...s, total };
  }

  function computeTranscriptFeatures(transcript, durationSec) {
    const text = String(transcript || "").toLowerCase().trim();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const fillerMatches =
      text.match(/\b(euh|bah|ben|hein|du coup|genre|en fait)\b/g) || [];
    const fillerCount = fillerMatches.length;
    const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 0;

    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const sentenceWordCounts = sentences.map(
      (s) => s.split(/\s+/).filter(Boolean).length
    );

    const avgSentenceWords =
      sentenceWordCounts.length > 0
        ? sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length
        : 0;

    const uniqueWords = new Set(words);
    const uniqueRatio = wordCount > 0 ? uniqueWords.size / wordCount : 0;

    const advancedConnectorMatches =
      text.match(
        /\b(cependant|toutefois|néanmoins|neanmoins|en revanche|à condition que|a condition que|d'une part|d’autre part|d'autre part|par conséquent|par consequent|en effet|de plus|or|pourtant)\b/g
      ) || [];

    const simpleConnectorMatches =
      text.match(
        /\b(et|mais|parce que|donc|ensuite|d'abord|d’abord|puis|alors)\b/g
      ) || [];

    const argumentMarkers =
      text.match(
        /\b(parce que|car|donc|par exemple|d'abord|d’abord|ensuite|cependant|en revanche|mais|en conclusion)\b/g
      ) || [];

    const hasExampleMarker =
      /\b(par exemple|par ex|prenons l'exemple|prenons l’exemple)\b/.test(text);

    const hasConclusionMarker =
      /\b(en conclusion|pour conclure|pour finir|en résumé|en resume)\b/.test(
        text
      );

    const hasNuanceMarker =
      /\b(cependant|toutefois|néanmoins|neanmoins|en revanche|à condition|a condition|mais)\b/.test(
        text
      );

    const wpm = durationSec > 0 ? (wordCount / durationSec) * 60 : 0;

    return {
      durationSec,
      wordCount,
      wpm,
      fillerCount,
      fillerRatio,
      hasExampleMarker,
      hasConclusionMarker,
      hasNuanceMarker,
      avgSentenceWords,
      uniqueRatio,
      advancedConnectorCount: advancedConnectorMatches.length,
      simpleConnectorCount: simpleConnectorMatches.length,
      argumentMarkerCount: argumentMarkers.length,
      sentenceCount: sentences.length,
    };
  }

  function detectProfileLevel(transcript, durationSec) {
    const f = computeTranscriptFeatures(transcript, durationSec);

    const a2Likely =
      f.wordCount <= 150 &&
      f.avgSentenceWords <= 14 &&
      f.advancedConnectorCount <= 1 &&
      f.uniqueRatio <= 0.72 &&
      f.argumentMarkerCount <= 8;

    const b2Likely =
      durationSec >= 120 &&
      f.wordCount >= 170 &&
      f.avgSentenceWords >= 11 &&
      f.advancedConnectorCount >= 2 &&
      f.hasExampleMarker &&
      f.hasNuanceMarker &&
      f.hasConclusionMarker &&
      f.argumentMarkerCount >= 7;

    if (b2Likely) return "B2";
    if (a2Likely) return "A2";
    return "B1";
  }

  function finalizeScore({ aiScores, transcript, durationSec, flags = {} }) {
    const features = computeTranscriptFeatures(transcript, durationSec);

    const local = {
      structure: normalizeScoreValue(aiScores.structure),
      argumentation: normalizeScoreValue(aiScores.argumentation),
      langue: normalizeScoreValue(aiScores.langue),
      fluidite: normalizeScoreValue(aiScores.fluidite),
      communication: normalizeScoreValue(aiScores.communication),
    };

    const exampleAbsent =
      Boolean(flags.exemple_absent) || !features.hasExampleMarker;

    if (exampleAbsent) {
      local.argumentation = Math.max(0, local.argumentation - 2);
    }

    const hesitationsFortes =
      Boolean(flags.hesitations_fortes) ||
      (features.fillerRatio >= 0.1 && features.wordCount >= 40);

    if (hesitationsFortes) {
      local.fluidite = Math.max(0, local.fluidite - 2);
    }

    if (Boolean(flags.contradiction_opinion)) {
      local.structure = Math.max(0, local.structure - 2);
      local.argumentation = Math.max(0, local.argumentation - 2);
    }

    if (Boolean(flags.hors_sujet)) {
      local.communication = Math.max(0, local.communication - 2);
    }

    if (durationSec < 75) {
      local.argumentation = Math.max(0, local.argumentation - 1);
      local.structure = Math.max(0, local.structure - 1);
    } else if (durationSec < 120) {
      local.argumentation = Math.max(0, local.argumentation - 1);
    }

    const maxTotal = durationCapMaxTotal(durationSec);
    const capped = applyCapWithPriority(local, maxTotal);
    const level = levelFromTotal50(capped.total);

    return {
      cappedScores: capped,
      level,
      features,
      exampleAbsent,
      hesitationsFortes,
    };
  }

  function applyProfileCaps(scores, profileLevel) {
    const base = {
      structure: normalizeScoreValue(scores.structure),
      argumentation: normalizeScoreValue(scores.argumentation),
      langue: normalizeScoreValue(scores.langue),
      fluidite: normalizeScoreValue(scores.fluidite),
      communication: normalizeScoreValue(scores.communication),
    };

    if (profileLevel === "A2") {
      const capped = {
        structure: Math.min(base.structure, 5),
        argumentation: Math.min(base.argumentation, 5),
        langue: Math.min(base.langue, 5),
        fluidite: Math.min(base.fluidite, 6),
        communication: Math.min(base.communication, 5),
      };
      const total =
        capped.structure +
        capped.argumentation +
        capped.langue +
        capped.fluidite +
        capped.communication;

      return { ...capped, total: Math.min(total, 23) };
    }

    if (profileLevel === "B1") {
      const capped = {
        structure: Math.min(Math.max(base.structure, 5), 7),
        argumentation: Math.min(Math.max(base.argumentation, 5), 7),
        langue: Math.min(Math.max(base.langue, 5), 7),
        fluidite: Math.min(Math.max(base.fluidite, 5), 7),
        communication: Math.min(Math.max(base.communication, 5), 7),
      };
      const total =
        capped.structure +
        capped.argumentation +
        capped.langue +
        capped.fluidite +
        capped.communication;

      if (total < 24) {
        const raised = { ...capped };
        const order = [
          "argumentation",
          "structure",
          "communication",
          "langue",
          "fluidite",
        ];
        let current = total;

        while (current < 24) {
          let changed = false;
          for (const key of order) {
            if (raised[key] < 7 && current < 24) {
              raised[key] += 1;
              current += 1;
              changed = true;
            }
          }
          if (!changed) break;
        }

        return { ...raised, total: current };
      }

      return { ...capped, total: Math.min(total, 31) };
    }

    const capped = {
      structure: Math.min(Math.max(base.structure, 6), 8),
      argumentation: Math.min(Math.max(base.argumentation, 7), 8),
      langue: Math.min(Math.max(base.langue, 6), 8),
      fluidite: Math.min(Math.max(base.fluidite, 6), 8),
      communication: Math.min(Math.max(base.communication, 6), 8),
    };

    const total =
      capped.structure +
      capped.argumentation +
      capped.langue +
      capped.fluidite +
      capped.communication;

    if (total < 32) {
      const raised = { ...capped };
      const order = [
        "argumentation",
        "structure",
        "communication",
        "langue",
        "fluidite",
      ];
      let current = total;

      while (current < 32) {
        let changed = false;
        for (const key of order) {
          if (raised[key] < 8 && current < 32) {
            raised[key] += 1;
            current += 1;
            changed = true;
          }
        }
        if (!changed) break;
      }

      return { ...raised, total: Math.min(current, 39) };
    }

    return { ...capped, total: Math.min(total, 39) };
  }

  function harmonizeWithAiAssessment(raw, profileLevel) {
    const summary = String(raw?.meta?.resume_une_phrase || "").toLowerCase();
    const positives = Array.isArray(raw?.diagnostic?.points_positifs)
      ? raw.diagnostic.points_positifs.join(" ").toLowerCase()
      : "";
    const text = `${summary} ${positives}`;

    if (profileLevel === "A2") {
      if (
        text.includes("niveau b2") ||
        text.includes("bon b2") ||
        text.includes("arguments développés") ||
        text.includes("arguments developpes")
      ) {
        return "B1";
      }
      return "A2";
    }

    if (profileLevel === "B1") {
      if (
        text.includes("niveau b2") &&
        text.includes("exemple") &&
        text.includes("nuance")
      ) {
        return "B2";
      }
      return "B1";
    }

    return "B2";
  }

  function normalizeAnalysis(raw, transcript, durationSec) {
    const base = {
      meta: {
        niveau_cecr_cible: normalizeText(raw?.meta?.niveau_cecr_cible),
        confiance: normalizeConfidence(raw?.meta?.confiance),
        resume_une_phrase: normalizeText(raw?.meta?.resume_une_phrase),
      },
      score: {
        structure: normalizeScoreValue(raw?.score?.structure),
        argumentation: normalizeScoreValue(raw?.score?.argumentation),
        langue: normalizeScoreValue(raw?.score?.langue),
        fluidite: normalizeScoreValue(raw?.score?.fluidite),
        communication: normalizeScoreValue(raw?.score?.communication),
      },
      diagnostic: {
        points_positifs: normalizeArray(raw?.diagnostic?.points_positifs, 3),
        points_a_ameliorer: normalizeArray(raw?.diagnostic?.points_a_ameliorer, 3),
      },
      corrections: {
        correction_simple: normalizeText(raw?.corrections?.correction_simple),
        version_amelioree_b2: normalizeText(raw?.corrections?.version_amelioree_b2),
      },
      coaching: {
        plan_amelioration: normalizeArray(raw?.coaching?.plan_amelioration, 3),
        phrases_a_utiliser: normalizeArray(raw?.coaching?.phrases_a_utiliser, 6),
        objectif_prochain_essai: normalizeText(
          raw?.coaching?.objectif_prochain_essai
        ),
      },
      flags: {
        duree_trop_courte: normalizeBoolean(raw?.flags?.duree_trop_courte),
        contradiction_opinion: normalizeBoolean(
          raw?.flags?.contradiction_opinion
        ),
        exemple_absent: normalizeBoolean(raw?.flags?.exemple_absent),
        hors_sujet: normalizeBoolean(raw?.flags?.hors_sujet),
        hesitations_fortes: normalizeBoolean(raw?.flags?.hesitations_fortes),
      },
    };

    const finalScore = finalizeScore({
      aiScores: base.score,
      transcript,
      durationSec,
      flags: base.flags,
    });

    const profileLevel = detectProfileLevel(transcript, durationSec);
    const aiAlignedLevel = harmonizeWithAiAssessment(raw, profileLevel);

    let mergedScores = { ...finalScore.cappedScores };

    if (aiAlignedLevel === "A2") {
      mergedScores.structure = Math.min(mergedScores.structure, 5);
      mergedScores.argumentation = Math.min(mergedScores.argumentation, 5);
      mergedScores.langue = Math.min(mergedScores.langue, 5);
      mergedScores.communication = Math.min(mergedScores.communication, 5);
    }

    if (aiAlignedLevel === "B2" && profileLevel !== "A2") {
      mergedScores.structure = Math.max(mergedScores.structure, 6);
      mergedScores.argumentation = Math.max(mergedScores.argumentation, 7);
      mergedScores.langue = Math.max(mergedScores.langue, 6);
      mergedScores.fluidite = Math.max(mergedScores.fluidite, 6);
      mergedScores.communication = Math.max(mergedScores.communication, 6);
    }

    const profileCapped = applyProfileCaps(mergedScores, profileLevel);

    const enforcedTotal =
      typeof profileCapped.total === "number"
        ? profileCapped.total
        : profileCapped.structure +
          profileCapped.argumentation +
          profileCapped.langue +
          profileCapped.fluidite +
          profileCapped.communication;

    return {
      ...base,
      score: {
        structure: profileCapped.structure,
        argumentation: profileCapped.argumentation,
        langue: profileCapped.langue,
        fluidite: profileCapped.fluidite,
        communication: profileCapped.communication,
      },
      total: enforcedTotal,
      niveau_estime: levelFromTotal50(enforcedTotal),
      niveau_profil_local: profileLevel,
      niveau_initial_apres_penalites: finalScore.level,
      features: finalScore.features,
      local_flags: {
        exemple_absent: finalScore.exampleAbsent,
        hesitations_fortes: finalScore.hesitationsFortes,
        reponse_tres_simple: profileLevel === "A2",
      },
    };
  }

  function parseFeedback(feedback) {
    if (!feedback || typeof feedback !== "object") return null;

    return {
      resume: feedback.meta?.resume_une_phrase || "",
      positif: Array.isArray(feedback.diagnostic?.points_positifs)
        ? feedback.diagnostic.points_positifs.join("\n")
        : "",
      amelioration: Array.isArray(feedback.diagnostic?.points_a_ameliorer)
        ? feedback.diagnostic.points_a_ameliorer.join("\n")
        : "",
      correction: feedback.corrections?.correction_simple || "",
      version: feedback.corrections?.version_amelioree_b2 || "",
      coaching: Array.isArray(feedback.coaching?.plan_amelioration)
        ? feedback.coaching.plan_amelioration.join("\n")
        : "",
      phrases: Array.isArray(feedback.coaching?.phrases_a_utiliser)
        ? feedback.coaching.phrases_a_utiliser.join("\n")
        : "",
      objectif: feedback.coaching?.objectif_prochain_essai || "",
    };
  }

  function parseScores(feedback) {
    if (!feedback || typeof feedback !== "object" || !feedback.score) return null;

    const scores = {
      structure:
        typeof feedback.score.structure === "number"
          ? feedback.score.structure
          : null,
      argumentation:
        typeof feedback.score.argumentation === "number"
          ? feedback.score.argumentation
          : null,
      langue:
        typeof feedback.score.langue === "number"
          ? feedback.score.langue
          : null,
      fluidite:
        typeof feedback.score.fluidite === "number"
          ? feedback.score.fluidite
          : null,
      communication:
        typeof feedback.score.communication === "number"
          ? feedback.score.communication
          : null,
    };

    const hasAnyScore = Object.values(scores).some((value) => value !== null);
    if (!hasAnyScore) return null;

    const total =
      typeof feedback.total === "number"
        ? feedback.total
        : Object.values(scores).reduce((sum, value) => sum + (value || 0), 0);

    return {
      ...scores,
      total,
    };
  }

  function getScoreColor(total) {
    if (total >= 32) return "#22c55e";
    if (total >= 24) return "#f59e0b";
    return "#fb7185";
  }

  function getScoreLabel(total) {
    if (total >= 36) return "B2 solide";
    if (total >= 32) return "Bon niveau pour viser B2";
    if (total >= 24) return "Base correcte, encore à renforcer";
    if (total >= 15) return "Niveau encore limité, travail ciblé utile";
    return "Réponse encore très fragile";
  }

  function formatConfidence(value) {
    if (typeof value !== "number") return null;
    return `${Math.round(value * 100)}%`;
  }

  async function analyserTexte(texte, duree) {
    try {
      const cleanText = String(texte || "").trim();
      const durationSec = Math.max(1, Number(duree) || 0);

      if (!cleanText) {
        setFeedback("Merci de coller un texte avant de lancer le test.");
        setStatus("result");
        return;
      }

      setTranscription(cleanText);
      setTime(durationSec);
      setStatus("processing");

      const response = await fetch("/api/analyze-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: cleanText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur analyse");
      }

      const parsedJson =
        typeof data.analysis === "object"
          ? data.analysis
          : extractJsonFromText(data.analysis || "");

      if (!parsedJson) {
        throw new Error("Le serveur n'a pas renvoyé un JSON exploitable.");
      }

      const normalized = normalizeAnalysis(parsedJson, cleanText, durationSec);

      setFeedback(normalized);
      setNiveau(normalized.niveau_estime);
      setStatus("result");
    } catch (e) {
      console.error(e);
      setFeedback(`Erreur API : ${e.message}`);
      setNiveau("");
      setStatus("result");
    }
  }

  async function demarrerEnregistrement() {
    if (isRecording || isProcessing) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus";
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setStatus("processing");

        try {
          const finalMimeType = mimeType || mediaRecorder.mimeType || "audio/webm";
          const extension = finalMimeType.includes("ogg") ? "ogg" : "webm";

          const audioBlob = new Blob(audioChunksRef.current, {
            type: finalMimeType,
          });
          const audioFile = new File([audioBlob], `reponse.${extension}`, {
            type: finalMimeType,
          });

          await transcrireEtAnalyser(audioFile);
        } catch (e) {
          console.error(e);
          setFeedback("Erreur audio");
          setStatus("result");
        } finally {
          stream.getTracks().forEach((t) => t.stop());
        }
      };

      resetVisualResultOnly();
      mediaRecorder.start();
      setStatus("recording");

      timerRef.current = setInterval(() => {
        setTime((t) => {
          if (t >= MAX_TIME) {
            mediaRecorder.stop();
            return t;
          }
          return t + 1;
        });
      }, 1000);
    } catch (e) {
      console.error(e);
      setFeedback("Erreur micro");
      setStatus("result");
    }
  }

  function arreterEnregistrement() {
    if (!mediaRecorderRef.current || !isRecording) return;
    mediaRecorderRef.current.stop();
  }

  async function transcrireEtAnalyser(audioFile) {
    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("model", "gpt-4o-mini-transcribe");

      const tRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const tData = await tRes.json();

      if (!tRes.ok) {
        throw new Error(tData.error || "Erreur transcription");
      }

      const texte = (tData.text || "").trim();
      setTranscription(texte);

      if (!texte) {
        setFeedback("⚠️ Aucun son détecté. Vérifiez votre micro et parlez clairement.");
        setStatus("result");
        return;
      }

      await analyserTexte(texte, time);
    } catch (e) {
      console.error(e);
      setFeedback(`Erreur API : ${e.message}`);
      setNiveau("");
      setStatus("result");
    }
  }

  const parsed =
    feedback && typeof feedback === "object" ? parseFeedback(feedback) : null;
  const scores =
    feedback && typeof feedback === "object" ? parseScores(feedback) : null;
  const statusConfig = getStatusConfig();

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",
        fontFamily: "Arial, sans-serif",
        background: `
          radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 28%),
          radial-gradient(circle at top right, rgba(34,197,94,0.12), transparent 24%),
          linear-gradient(180deg, #020817 0%, #081225 35%, #0f172a 100%)
        `,
        padding: "32px 18px 60px",
      }}
    >
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "10px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.35))",
              }}
            >
              🎤
            </div>
            <div
              style={{
                fontSize: "clamp(42px, 7vw, 82px)",
                fontWeight: 800,
                letterSpacing: "-2px",
                lineHeight: 1,
                textShadow: "0 14px 30px rgba(0,0,0,0.30)",
              }}
            >
              TCF Speaking AI
            </div>
          </div>

          <div
            style={{
              color: "#cbd5e1",
              fontSize: "clamp(18px, 2.5vw, 24px)",
              marginBottom: "18px",
            }}
          >
            Simulation orale — tâche 3 : exprimer une opinion
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 16px",
              borderRadius: "999px",
              background: statusConfig.bg,
              border: statusConfig.border,
              color: statusConfig.color,
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            <span>{statusConfig.emoji}</span>
            <span>{statusConfig.label}</span>
          </div>
        </div>

        <div
          style={{
            ...getCardStyle(),
            marginBottom: "22px",
            textAlign: "center",
            padding: "26px 30px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              letterSpacing: "1.8px",
              color: "#93c5fd",
              marginBottom: "14px",
              fontWeight: 700,
            }}
          >
            CONSIGNE
          </div>

          <div
            style={{
              fontSize: "clamp(24px, 3vw, 30px)",
              fontWeight: 700,
              marginBottom: "16px",
            }}
          >
            💬 Donnez votre opinion et justifiez votre réponse.
          </div>

          <div
            style={{
              display: "flex",
              gap: "14px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.06)",
                color: "#e2e8f0",
                fontWeight: 600,
              }}
            >
              ⏱ Minimum conseillé : 2 minutes
            </div>
            <div
              style={{
                padding: "10px 16px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.06)",
                color: "#e2e8f0",
                fontWeight: 600,
              }}
            >
              ⏱ Temps maximum : 4 min 30
            </div>
          </div>
        </div>

        <div
          style={{
            ...getCardStyle(),
            marginBottom: "22px",
            textAlign: "center",
            padding: "30px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              letterSpacing: "1.8px",
              color: "#93c5fd",
              marginBottom: "16px",
              fontWeight: 700,
            }}
          >
            SUJET
          </div>

          <div
            style={{
              fontSize: "clamp(28px, 4.2vw, 42px)",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-1px",
              maxWidth: "860px",
              margin: "0 auto",
            }}
          >
            {sujet}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "14px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={changerSujet}
            disabled={isRecording || isProcessing}
            style={getButtonStyle("dark", isRecording || isProcessing)}
          >
            🔄 Nouveau sujet
          </button>

          {!isRecording ? (
            <button
              onClick={demarrerEnregistrement}
              disabled={isProcessing}
              style={getButtonStyle("green", isProcessing)}
            >
              🎤 Démarrer
            </button>
          ) : (
            <button onClick={arreterEnregistrement} style={getButtonStyle("red")}>
              ⏹ Arrêter
            </button>
          )}

          <button
            onClick={resetSession}
            disabled={isProcessing}
            style={getButtonStyle("blue", isProcessing)}
          >
            🔁 Reset
          </button>

          <button
            onClick={() => setShowDevMode((prev) => !prev)}
            disabled={isRecording || isProcessing}
            style={getButtonStyle("violet", isRecording || isProcessing)}
          >
            {showDevMode ? "🙈 Masquer test texte" : "🧪 Mode test texte"}
          </button>

          {!!transcription && (
            <button
              onClick={() => setShowTranscription(!showTranscription)}
              disabled={isRecording || isProcessing}
              style={getButtonStyle("dark", isRecording || isProcessing)}
            >
              {showTranscription ? "🙈 Masquer transcription" : "📝 Voir transcription"}
            </button>
          )}
        </div>

        {showDevMode && (
          <div
            style={{
              ...getCardStyle(),
              marginBottom: "18px",
              border: "1px solid rgba(139, 92, 246, 0.35)",
              background:
                "linear-gradient(135deg, rgba(76,29,149,0.22), rgba(30,41,59,0.72))",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                letterSpacing: "1.8px",
                color: "#c4b5fd",
                marginBottom: "14px",
                fontWeight: 700,
              }}
            >
              MODE TEST TEXTE
            </div>

            <div
              style={{
                color: "#ddd6fe",
                marginBottom: "16px",
                lineHeight: 1.6,
              }}
            >
              Colle directement une réponse ici pour tester la notation sans audio.
            </div>

            <div style={{ marginBottom: "14px" }}>
              <textarea
                value={devText}
                onChange={(e) => setDevText(e.target.value)}
                placeholder="Colle ici une réponse complète pour tester le scoring..."
                rows={10}
                style={{
                  ...getInputStyle(),
                  resize: "vertical",
                  minHeight: "220px",
                  lineHeight: 1.6,
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "14px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={{ minWidth: "180px" }}>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#cbd5e1",
                    marginBottom: "8px",
                    fontWeight: 700,
                  }}
                >
                  Durée simulée (secondes)
                </div>
                <input
                  type="number"
                  min="1"
                  max="600"
                  value={devDuration}
                  onChange={(e) => setDevDuration(Number(e.target.value))}
                  style={getInputStyle()}
                />
              </div>

              <div
                style={{
                  paddingTop: "22px",
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => analyserTexte(devText, devDuration)}
                  disabled={isRecording || isProcessing}
                  style={getButtonStyle("violet", isRecording || isProcessing)}
                >
                  🚀 Tester sans audio
                </button>

                <button
                  onClick={() => {
                    setDevText("");
                    setDevDuration(150);
                  }}
                  disabled={isRecording || isProcessing}
                  style={getButtonStyle("dark", isRecording || isProcessing)}
                >
                  🧹 Vider
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: "14px",
                color: "#cbd5e1",
                fontSize: "14px",
              }}
            >
              Durée actuelle simulée : <strong>{formatTime(devDuration)}</strong>
            </div>
          </div>
        )}

        {(isRecording || time > 0) && (
          <div
            style={{
              ...getCardStyle(),
              marginBottom: "18px",
              textAlign: "center",
              padding: "22px 24px",
            }}
          >
            <div
              style={{
                fontSize: "clamp(30px, 4vw, 44px)",
                fontWeight: 800,
                color: getTimerColor(),
                marginBottom: "8px",
              }}
            >
              {isRecording ? "🔴" : "⏺️"} {formatTime(time)} / {formatTime(MAX_TIME)}
            </div>

            <div
              style={{
                color: getTimerColor(),
                fontWeight: 700,
                fontSize: "16px",
                marginBottom: "14px",
              }}
            >
              {getTimerLabel()}
            </div>

            <div
              style={{
                width: "100%",
                maxWidth: "640px",
                height: "12px",
                margin: "0 auto",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${getTimerProgress()}%`,
                  height: "100%",
                  background:
                    time < MIN_TIME
                      ? "linear-gradient(90deg, #fb7185, #ef4444)"
                      : "linear-gradient(90deg, #4ade80, #16a34a)",
                  borderRadius: "999px",
                  transition: "width 0.35s ease",
                }}
              />
            </div>
          </div>
        )}

        {isProcessing && (
          <div
            style={{
              ...getCardStyle(),
              marginBottom: "18px",
              textAlign: "center",
              padding: "24px",
            }}
          >
            <div
              style={{
                fontSize: "30px",
                fontWeight: 800,
                marginBottom: "8px",
              }}
            >
              ⏳ Analyse en cours...
            </div>
            <div
              style={{
                color: "#cbd5e1",
                fontSize: "16px",
              }}
            >
              Transcription, notation et coaching IA en cours.
            </div>
          </div>
        )}

        {showTranscription && transcription && (
          <div
            style={{
              ...getCardStyle(),
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                letterSpacing: "1.8px",
                color: "#93c5fd",
                marginBottom: "14px",
                fontWeight: 700,
              }}
            >
              TRANSCRIPTION
            </div>

            <div
              style={{
                color: "#e2e8f0",
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
                fontSize: "16px",
              }}
            >
              {transcription}
            </div>
          </div>
        )}

        {typeof feedback === "string" && (
          <div
            style={{
              ...getCardStyle(),
              marginBottom: "18px",
              border: "1px solid rgba(239,68,68,0.35)",
              background: "rgba(127,29,29,0.25)",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "8px" }}>
              ⚠️ Erreur
            </div>
            <div style={{ color: "#fecaca" }}>{feedback}</div>
          </div>
        )}

        {hasResult && feedback && typeof feedback === "object" && (
          <div
            style={{
              ...getCardStyle(),
              marginBottom: "18px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                letterSpacing: "1.8px",
                color: "#93c5fd",
                marginBottom: "14px",
                fontWeight: 700,
              }}
            >
              NIVEAU ESTIMÉ
            </div>

            <div
              style={{
                fontSize: "clamp(38px, 6vw, 64px)",
                fontWeight: 900,
                color:
                  niveau === "B2"
                    ? "#4ade80"
                    : niveau === "B1"
                    ? "#f59e0b"
                    : "#fb7185",
              }}
            >
              🎯 {niveau || "—"}
            </div>

            {parsed?.resume && (
              <div
                style={{
                  marginTop: "14px",
                  color: "#e2e8f0",
                  fontSize: "18px",
                  lineHeight: 1.6,
                  maxWidth: "760px",
                  marginInline: "auto",
                }}
              >
                {parsed.resume}
              </div>
            )}

            {feedback?.meta?.confiance !== null && (
              <div
                style={{
                  marginTop: "10px",
                  color: "#d1fae5",
                  fontWeight: 700,
                }}
              >
                Confiance du diagnostic : {formatConfidence(feedback.meta.confiance)}
              </div>
            )}
          </div>
        )}

        {scores && (
          <div
            style={{
              ...getCardStyle(),
              marginBottom: "18px",
              border: `1px solid ${getScoreColor(scores.total)}`,
              background:
                scores.total >= 32
                  ? "linear-gradient(135deg, rgba(22,163,74,0.18), rgba(6,78,59,0.22))"
                  : scores.total >= 24
                  ? "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(120,53,15,0.22))"
                  : "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(127,29,29,0.22))",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                letterSpacing: "1.8px",
                color: getScoreColor(scores.total),
                marginBottom: "14px",
                fontWeight: 700,
              }}
            >
              SCORE TCF SIMULÉ
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              {[
                ["Structure", scores.structure],
                ["Argumentation", scores.argumentation],
                ["Langue", scores.langue],
                ["Fluidité", scores.fluidite],
                ["Communication", scores.communication],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    padding: "14px",
                    borderRadius: "16px",
                    background: "rgba(255,255,255,0.05)",
                  }}
                >
                  <div style={{ color: "#cbd5e1", marginBottom: "6px" }}>{label}</div>
                  <div style={{ fontSize: "28px", fontWeight: 800 }}>{value}/10</div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(24px, 4vw, 36px)",
                  fontWeight: 900,
                  color: getScoreColor(scores.total),
                }}
              >
                Total : {scores.total}/50
              </div>

              <div
                style={{
                  color: "#e2e8f0",
                  fontWeight: 700,
                }}
              >
                {getScoreLabel(scores.total)}
              </div>
            </div>
          </div>
        )}

        {feedback && typeof feedback === "object" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "18px",
            }}
          >
            {parsed?.positif && (
              <div style={getCardStyle()}>
                <div
                  style={{
                    fontSize: "14px",
                    letterSpacing: "1.8px",
                    color: "#4ade80",
                    marginBottom: "14px",
                    fontWeight: 700,
                  }}
                >
                  POINTS POSITIFS
                </div>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.8,
                    color: "#e2e8f0",
                  }}
                >
                  {parsed.positif}
                </div>
              </div>
            )}

            {parsed?.amelioration && (
              <div style={getCardStyle()}>
                <div
                  style={{
                    fontSize: "14px",
                    letterSpacing: "1.8px",
                    color: "#f59e0b",
                    marginBottom: "14px",
                    fontWeight: 700,
                  }}
                >
                  POINTS À AMÉLIORER
                </div>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.8,
                    color: "#e2e8f0",
                  }}
                >
                  {parsed.amelioration}
                </div>
              </div>
            )}

            {parsed?.correction && (
              <div style={getCardStyle()}>
                <div
                  style={{
                    fontSize: "14px",
                    letterSpacing: "1.8px",
                    color: "#93c5fd",
                    marginBottom: "14px",
                    fontWeight: 700,
                  }}
                >
                  CORRECTION SIMPLE
                </div>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.8,
                    color: "#e2e8f0",
                  }}
                >
                  {parsed.correction}
                </div>
              </div>
            )}

            {parsed?.version && (
              <div style={getCardStyle()}>
                <div
                  style={{
                    fontSize: "14px",
                    letterSpacing: "1.8px",
                    color: "#c084fc",
                    marginBottom: "14px",
                    fontWeight: 700,
                  }}
                >
                  VERSION AMÉLIORÉE B2
                </div>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.8,
                    color: "#e2e8f0",
                  }}
                >
                  {parsed.version}
                </div>
              </div>
            )}

            {parsed?.coaching && (
              <div style={getCardStyle()}>
                <div
                  style={{
                    fontSize: "14px",
                    letterSpacing: "1.8px",
                    color: "#22d3ee",
                    marginBottom: "14px",
                    fontWeight: 700,
                  }}
                >
                  PLAN D’AMÉLIORATION
                </div>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.8,
                    color: "#e2e8f0",
                  }}
                >
                  {parsed.coaching}
                </div>
              </div>
            )}

            {parsed?.phrases && (
              <div style={getCardStyle()}>
                <div
                  style={{
                    fontSize: "14px",
                    letterSpacing: "1.8px",
                    color: "#f9a8d4",
                    marginBottom: "14px",
                    fontWeight: 700,
                  }}
                >
                  PHRASES À UTILISER
                </div>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.8,
                    color: "#e2e8f0",
                  }}
                >
                  {parsed.phrases}
                </div>
              </div>
            )}

            {parsed?.objectif && (
              <div style={getCardStyle()}>
                <div
                  style={{
                    fontSize: "14px",
                    letterSpacing: "1.8px",
                    color: "#fde68a",
                    marginBottom: "14px",
                    fontWeight: 700,
                  }}
                >
                  OBJECTIF PROCHAIN ESSAI
                </div>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.8,
                    color: "#e2e8f0",
                  }}
                >
                  {parsed.objectif}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
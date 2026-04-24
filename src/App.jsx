import { useEffect, useRef, useState } from "react";
import RealtimeCall from "./RealtimeCall";
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
  const [appMode, setAppMode] = useState("chooser");
  const [expandedScore, setExpandedScore] = useState(null);
  // null | "transcribing" | "analyzing"
  const [t3ProcessingStep, setT3ProcessingStep] = useState(null);

  const mediaRecorderRef = useRef(null);
  const resultRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const elapsedTimeRef = useRef(0);

  const isRecording = status === "recording";
  const isProcessing = status === "processing";
  const hasResult = status === "result";

  useEffect(() => {
    if (hasResult && resultRef.current) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }
  }, [hasResult]);

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
    elapsedTimeRef.current = 0;
    setNiveau("");
    setShowTranscription(false);
    setT3ProcessingStep(null);
    setStatus("idle");
  }

  function resetVisualResultOnly() {
    setFeedback(null);
    setTranscription("");
    setTime(0);
    elapsedTimeRef.current = 0;
    setNiveau("");
    setShowTranscription(false);
    setT3ProcessingStep(null);
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
      background: "rgba(15, 23, 42, 0.65)",
      border: "1px solid rgba(148, 163, 184, 0.12)",
      borderRadius: "20px",
      padding: "24px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
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

  async function readApiJson(response, endpointLabel) {
    const raw = await response.text();

    if (!raw) {
      return {
        data: null,
        raw: "",
      };
    }

    const data = safeJsonParse(raw);

    if (data === null) {
      throw new Error(`Réponse JSON invalide de ${endpointLabel}.`);
    }

    return {
      data,
      raw,
    };
  }

  function extractJsonFromText(text) {
    if (!text || typeof text !== "string") return null;

    const direct = safeJsonParse(text);
    if (direct) return direct;

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    return safeJsonParse(match[0]);
  }

  function getLevelColor(niveau) {
    if (niveau === "C2" || niveau === "C1") return "#60a5fa";
    if (niveau === "B2") return "#4ade80";
    if (niveau === "B1") return "#f59e0b";
    return "#fb7185";
  }

  function getScoreColor(total) {
    if (total >= 12) return "#4ade80";
    if (total >= 8) return "#f59e0b";
    return "#fb7185";
  }

  function getScoreLabel(total) {
    if (total >= 16) return "Niveau C1 — excellent";
    if (total >= 12) return "Niveau B2 atteint";
    if (total >= 8) return "Niveau B1 — bon socle";
    if (total >= 5) return "Niveau A2 — à renforcer";
    return "Niveau A1 — travail ciblé nécessaire";
  }

  async function saveAttempt({ transcript, normalizedFeedback }) {
    try {
      const totalScore =
        typeof normalizedFeedback?.total === "number"
          ? normalizedFeedback.total
          : null;

      const levelValue = normalizedFeedback?.niveau_cecrl || null;

      const { error } = await supabase.from("attempts").insert([
        {
          transcript,
          score: totalScore,
          level: levelValue,
          feedback: normalizedFeedback,
        },
      ]);

      if (error) {
        console.error("SUPABASE SAVE ERROR:", error);
      }
    } catch (error) {
      console.error("SUPABASE SAVE CATCH:", error);
    }
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
      // si appelé depuis le mode dev texte (pas d'audio), démarrer directement à "analyzing"
      setT3ProcessingStep((prev) => prev === null ? "analyzing" : prev);

      const response = await fetch("/api/analyze-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: cleanText,
          durationSec,
        }),
      });

      const { data } = await readApiJson(response, "/api/analyze-text");

      if (!response.ok) {
        throw new Error(
          data?.error || `Erreur analyse (HTTP ${response.status})`
        );
      }

      if (!data) {
        throw new Error("Réponse vide de /api/analyze-text.");
      }

      const parsedJson =
        typeof data.analysis === "object"
          ? data.analysis
          : extractJsonFromText(data.analysis || "");

      if (!parsedJson) {
        throw new Error("Le serveur n'a pas renvoyé un JSON exploitable.");
      }

      const normalized = {
        scores: parsedJson.scores || {},
        total: Number(parsedJson.total) || 0,
        niveau_cecrl: parsedJson.niveau_cecrl || "—",
        niveau_nclc: parsedJson.niveau_nclc || "—",
        resume_niveau: parsedJson.resume_niveau || "",
        points_positifs: Array.isArray(parsedJson.points_positifs) ? parsedJson.points_positifs : [],
        points_ameliorer: Array.isArray(parsedJson.points_ameliorer) ? parsedJson.points_ameliorer : [],
        correction_simple: parsedJson.correction_simple || "",
        version_amelioree: parsedJson.version_amelioree || null,
        phrases_utiles: Array.isArray(parsedJson.phrases_utiles) ? parsedJson.phrases_utiles : [],
        conseil_prioritaire: parsedJson.conseil_prioritaire || "",
        objectif_prochain_essai: parsedJson.objectif_prochain_essai || "",
      };

      setFeedback(normalized);
      setNiveau(normalized.niveau_cecrl);

      await saveAttempt({
        transcript: cleanText,
        normalizedFeedback: normalized,
      });

      setT3ProcessingStep(null);
      setStatus("result");
    } catch (e) {
      console.error(e);
      setFeedback(`Erreur API : ${e.message}`);
      setNiveau("");
      setT3ProcessingStep(null);
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
        setT3ProcessingStep("transcribing");

        try {
          const finalMimeType = mimeType || mediaRecorder.mimeType || "audio/webm";
          const extension = finalMimeType.includes("ogg") ? "ogg" : "webm";
          const recordedDuration = Math.max(
            1,
            elapsedTimeRef.current || Number(time) || 0
          );

          const audioBlob = new Blob(audioChunksRef.current, {
            type: finalMimeType,
          });
          const audioFile = new File([audioBlob], `reponse.${extension}`, {
            type: finalMimeType,
          });

          await transcrireEtAnalyser(audioFile, recordedDuration);
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
      elapsedTimeRef.current = 0;
      setStatus("recording");

      timerRef.current = setInterval(() => {
        setTime((t) => {
          if (t >= MAX_TIME) {
            elapsedTimeRef.current = t;
            mediaRecorder.stop();
            return t;
          }
          const nextTime = t + 1;
          elapsedTimeRef.current = nextTime;
          return nextTime;
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

  async function transcrireEtAnalyser(audioFile, durationSec = time) {
    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("model", "gpt-4o-mini-transcribe");

      const tRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const { data: tData } = await readApiJson(tRes, "/api/transcribe");

      if (!tRes.ok) {
        throw new Error(
          tData?.error || `Erreur transcription (HTTP ${tRes.status})`
        );
      }

      if (!tData) {
        throw new Error("Réponse vide de /api/transcribe.");
      }

      const texte = (tData.text || "").trim();
      setTranscription(texte);

      if (!texte) {
        setFeedback("⚠️ Aucun son détecté. Vérifiez votre micro et parlez clairement.");
        setStatus("result");
        setT3ProcessingStep(null);
        return;
      }

      setT3ProcessingStep("analyzing");
      await analyserTexte(texte, durationSec);
    } catch (e) {
      console.error(e);
      setFeedback(`Erreur API : ${e.message}`);
      setNiveau("");
      setStatus("result");
      setT3ProcessingStep(null);
    }
  }

  const statusConfig = getStatusConfig();
  const SHOW_REALTIME_TEST = true;

  if (SHOW_REALTIME_TEST && appMode === "chooser") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(32px, 6vw, 64px) 18px",
        }}
      >
        <div style={{ maxWidth: "840px", width: "100%" }}>

          {/* ── Branding ── */}
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "22px",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              <span>🇨🇦</span>
              Préparation TCF Canada
            </div>

            <div
              style={{
                fontSize: "clamp(42px, 8vw, 76px)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1.0,
                marginBottom: "18px",
                color: "#f1f5f9",
              }}
            >
              TCF Speaking AI
            </div>

            <div
              style={{
                fontSize: "clamp(16px, 2.2vw, 19px)",
                color: "#94a3b8",
                lineHeight: 1.65,
                maxWidth: "520px",
                margin: "0 auto",
              }}
            >
              Entraînez-vous à l'oral du TCF Canada avec l'IA
            </div>
          </div>

          {/* ── Task cards ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "18px",
              marginBottom: "44px",
            }}
          >
            {/* Tâche 2 */}
            <button className="task-card" onClick={() => setAppMode("realtime")}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "22px",
                }}
              >
                <span style={{ fontSize: "42px", lineHeight: 1 }}>🎙️</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#3b82f6",
                    background: "rgba(59,130,246,0.12)",
                    border: "1px solid rgba(59,130,246,0.25)",
                    borderRadius: "999px",
                    padding: "4px 11px",
                  }}
                >
                  Tâche 2
                </span>
              </div>

              <div
                style={{
                  fontSize: "clamp(20px, 2.5vw, 24px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  marginBottom: "10px",
                }}
              >
                Interaction orale
              </div>

              <div
                style={{
                  fontSize: "15px",
                  color: "#94a3b8",
                  lineHeight: 1.65,
                  marginBottom: "28px",
                }}
              >
                Conversation en temps réel avec l'IA — 5 min 30
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#3b82f6",
                }}
              >
                Commencer
                <span style={{ fontSize: "16px" }}>→</span>
              </div>
            </button>

            {/* Tâche 3 */}
            <button className="task-card" onClick={() => setAppMode("legacy")}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "22px",
                }}
              >
                <span style={{ fontSize: "42px", lineHeight: 1 }}>🎤</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#8b5cf6",
                    background: "rgba(139,92,246,0.12)",
                    border: "1px solid rgba(139,92,246,0.25)",
                    borderRadius: "999px",
                    padding: "4px 11px",
                  }}
                >
                  Tâche 3
                </span>
              </div>

              <div
                style={{
                  fontSize: "clamp(20px, 2.5vw, 24px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  marginBottom: "10px",
                }}
              >
                Expression d'un point de vue
              </div>

              <div
                style={{
                  fontSize: "15px",
                  color: "#94a3b8",
                  lineHeight: 1.65,
                  marginBottom: "28px",
                }}
              >
                Monologue argumenté — 4 min 30
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#8b5cf6",
                }}
              >
                Commencer
                <span style={{ fontSize: "16px" }}>→</span>
              </div>
            </button>
          </div>

          {/* ── Footer ── */}
          <div
            style={{
              textAlign: "center",
              fontSize: "13px",
              color: "#475569",
              letterSpacing: "0.02em",
            }}
          >
            Score /20 basé sur les critères CECRL&nbsp;&bull;&nbsp;Feedback personnalisé par IA
          </div>

          {/* ── Contact ── */}
          <div style={{ marginTop: "32px", textAlign: "center", fontSize: "13px" }}>
            <a
              href="mailto:pereirasilvarobin@yahoo.fr"
              style={{
                color: "#64748b",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#3b82f6")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              Une question ? Contactez-moi
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (SHOW_REALTIME_TEST && appMode === "realtime") {
    return <RealtimeCall onBack={() => setAppMode("chooser")} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px 18px 60px",
      }}
    >
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        {SHOW_REALTIME_TEST && (
          <div style={{ marginBottom: "16px" }}>
            <button
              className="btn-ghost"
              onClick={() => setAppMode("chooser")}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              ← Retour
            </button>
          </div>
        )}
        {/* ── Compact header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>TCF Speaking AI</span>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8b5cf6", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "999px", padding: "4px 11px" }}>
            Tâche 3
          </span>
        </div>

        {/* ══════════════════════════════════════════
            VUE ENREGISTREMENT EN COURS
        ══════════════════════════════════════════ */}
        {isRecording && (
          <div style={{ ...getCardStyle(), textAlign: "center", padding: "40px 28px", marginBottom: "20px" }}>
            <p style={{ margin: "0 0 28px", fontSize: "14px", color: "#64748b", fontStyle: "italic", maxWidth: "560px", marginInline: "auto", lineHeight: 1.6 }}>
              {sujet}
            </p>
            <div className="rec-indicator">
              <div className="rec-dot" />
            </div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "#fca5a5", marginBottom: "24px" }}>
              Enregistrement en cours
            </div>

            {/* Timer pendant l'enregistrement */}
            <div style={{ marginBottom: "28px" }}>
              <div style={{
                fontSize: "clamp(28px, 5vw, 42px)",
                fontWeight: 800,
                color: time >= MAX_TIME - 30
                  ? "#fb7185"
                  : time >= MIN_TIME
                  ? "#4ade80"
                  : "#f1f5f9",
                marginBottom: "8px",
                transition: "color 0.5s ease",
                fontVariantNumeric: "tabular-nums",
              }}>
                {formatTime(time)} / {formatTime(MAX_TIME)}
              </div>
              <div style={{
                fontSize: "13px",
                fontWeight: 600,
                color: time >= MAX_TIME - 30
                  ? "#fb7185"
                  : time >= MIN_TIME
                  ? "#4ade80"
                  : "#94a3b8",
                marginBottom: "12px",
                transition: "color 0.5s ease",
              }}>
                {time >= MAX_TIME - 30
                  ? `⚠️ ${MAX_TIME - time}s restantes`
                  : time >= MIN_TIME
                  ? "Minimum conseillé atteint ✓"
                  : "Minimum conseillé non atteint (2 min)"}
              </div>
              <div style={{
                width: "100%",
                maxWidth: "400px",
                height: "6px",
                margin: "0 auto",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "999px",
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${Math.min((time / MAX_TIME) * 100, 100)}%`,
                  height: "100%",
                  background: time >= MAX_TIME - 30
                    ? "linear-gradient(90deg, #fb7185, #ef4444)"
                    : time >= MIN_TIME
                    ? "linear-gradient(90deg, #4ade80, #22c55e)"
                    : "linear-gradient(90deg, #94a3b8, #64748b)",
                  borderRadius: "999px",
                  transition: "width 0.5s ease, background 0.5s ease",
                }} />
              </div>
            </div>

            <button
              onClick={arreterEnregistrement}
              style={{
                display: "inline-block",
                padding: "16px 36px",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
                background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                color: "white",
                border: "none",
                borderRadius: "16px",
                boxShadow: "0 8px 24px rgba(239,68,68,0.35)",
              }}
            >
              ⏹ Arrêter l'enregistrement
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════
            VUE TRAITEMENT POST-ENREGISTREMENT
        ══════════════════════════════════════════ */}
        {isProcessing && (
          <div style={{ ...getCardStyle(), textAlign: "center", padding: "36px 24px", marginBottom: "20px" }}>
            <div style={{ fontSize: "clamp(18px, 4vw, 24px)", fontWeight: 800, marginBottom: "6px", color: "#f1f5f9" }}>
              Traitement de votre enregistrement...
            </div>
            <div style={{ fontSize: "14px", color: "#475569", marginBottom: "32px" }}>
              Cela prend généralement 5 à 10 secondes
            </div>

            <div style={{ maxWidth: "300px", marginInline: "auto", textAlign: "left" }}>
              {[
                {
                  label: "Transcription de votre monologue",
                  done: t3ProcessingStep === "analyzing",
                  active: t3ProcessingStep === "transcribing",
                },
                {
                  label: "Évaluation de votre performance",
                  done: false,
                  active: t3ProcessingStep === "analyzing",
                },
                {
                  label: "Génération du feedback personnalisé",
                  done: false,
                  active: t3ProcessingStep === "analyzing",
                },
              ].map(({ label, done, active }, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "11px 0",
                    borderBottom: i < 2 ? "1px solid rgba(148,163,184,0.08)" : "none",
                    opacity: active || done ? 1 : 0.28,
                    transition: "opacity 0.4s ease",
                  }}
                >
                  <span style={{ fontSize: "20px", width: "24px", flexShrink: 0, textAlign: "center" }}>
                    {done ? "✅" : active ? "⏳" : "○"}
                  </span>
                  <span style={{
                    fontSize: "14px",
                    fontWeight: active ? 700 : 400,
                    color: done ? "#4ade80" : active ? "#f1f5f9" : "#64748b",
                    transition: "color 0.3s ease",
                  }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            VUE REPOS (idle / result)
        ══════════════════════════════════════════ */}
        {!isRecording && !isProcessing && (
          <div style={{ ...getCardStyle(), padding: "clamp(20px, 4vw, 32px)", marginBottom: "20px" }}>

            {/* Sujet focal */}
            <div
              style={{
                fontSize: "clamp(22px, 4vw, 36px)",
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                textAlign: "center",
                marginBottom: "14px",
                color: "#f1f5f9",
              }}
            >
              {sujet}
            </div>

            {/* Consigne compacte */}
            <div style={{ textAlign: "center", fontSize: "14px", color: "#64748b", marginBottom: "24px" }}>
              💬 Donnez votre opinion et justifiez &nbsp;·&nbsp; min 2 min &nbsp;·&nbsp; max 4:30
            </div>

            {/* Status badge si résultat */}
            {hasResult && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "999px", background: statusConfig.bg, border: statusConfig.border, color: statusConfig.color, fontWeight: 600, fontSize: "14px" }}>
                  <span>{statusConfig.emoji}</span>
                  <span>{statusConfig.label}</span>
                </div>
              </div>
            )}

            {/* Timer post-enregistrement */}
            {time > 0 && (
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 800, color: getTimerColor(), marginBottom: "6px" }}>
                  {isRecording ? "🔴" : "⏺️"} {formatTime(time)} / {formatTime(MAX_TIME)}
                </div>
                <div style={{ color: getTimerColor(), fontWeight: 600, fontSize: "14px", marginBottom: "10px" }}>
                  {getTimerLabel()}
                </div>
                <div style={{ width: "100%", maxWidth: "480px", height: "6px", margin: "0 auto", background: "rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{ width: `${getTimerProgress()}%`, height: "100%", background: time < MIN_TIME ? "linear-gradient(90deg, #fb7185, #ef4444)" : "linear-gradient(90deg, #4ade80, #22c55e)", borderRadius: "999px", transition: "width 0.35s ease" }} />
                </div>
              </div>
            )}

            {/* Boutons principaux */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                className="btn-start-call"
                onClick={demarrerEnregistrement}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  minWidth: "160px",
                  padding: "16px 20px",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  background: isProcessing ? "linear-gradient(135deg, #475569, #334155)" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "white",
                  border: "none",
                  borderRadius: "14px",
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                🎤 {time > 0 ? "Réessayer" : "Démarrer"}
              </button>
              <button
                className="btn-ghost"
                onClick={changerSujet}
                disabled={isProcessing}
                style={{ flex: "0 0 auto", padding: "16px 20px", fontSize: "15px" }}
              >
                🔄 Nouveau sujet
              </button>
            </div>

            {/* Outils discrets */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
              {!!transcription && (
                <button
                  className="btn-ghost"
                  onClick={() => setShowTranscription(!showTranscription)}
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  {showTranscription ? "Masquer transcript" : "📝 Transcript"}
                </button>
              )}
              <button
                className="btn-ghost"
                onClick={resetSession}
                disabled={isProcessing}
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                🔁 Reset
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowDevMode((prev) => !prev)}
                disabled={isProcessing}
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                {showDevMode ? "Masquer outils" : "⋯ Outils"}
              </button>
            </div>
          </div>
        )}


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

        <div ref={resultRef} />

        {hasResult && feedback && typeof feedback === "object" && (() => {
          const lc = getLevelColor(feedback.niveau_cecrl);
          const sc = getScoreColor(feedback.total);
          const sl = getScoreLabel(feedback.total);
          const bc = (n) => n >= 4 ? "#3b82f6" : n >= 3 ? "#22c55e" : n >= 2 ? "#f59e0b" : "#ef4444";
          const criteria = [
            ["Réalisation de la tâche", "realisation_tache"],
            ["Lexique", "lexique"],
            ["Grammaire", "grammaire"],
            ["Fluidité & Prononciation", "fluidite_prononciation"],
            ["Interaction & Cohérence", "interaction_coherence"],
          ];
          return (
            <>
              {/* ── 1. En-tête niveau ── */}
              <div style={{ ...getCardStyle(), textAlign: "center", padding: "32px 24px", marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569", marginBottom: "12px" }}>
                  Niveau estimé — Tâche 3
                </div>
                <div className="level-pop" style={{ fontSize: "clamp(64px, 12vw, 96px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em", color: lc, marginBottom: "6px" }}>
                  {feedback.niveau_cecrl || "—"}
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#a5b4fc", marginBottom: "4px" }}>
                  NCLC {feedback.niveau_nclc || "—"}
                </div>
                <div style={{ fontSize: "14px", color: "#64748b", fontWeight: 600, marginBottom: "16px" }}>
                  {sl} — {feedback.total ?? 0}/20
                </div>
                {feedback.resume_niveau && (
                  <div style={{ fontSize: "15px", color: "#94a3b8", lineHeight: 1.7, maxWidth: "560px", marginInline: "auto" }}>
                    {feedback.resume_niveau}
                  </div>
                )}
              </div>

              {/* ── 2. Barres de score ── */}
              <div style={{ ...getCardStyle(), marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569", marginBottom: "8px" }}>
                  Scores — 5 critères
                </div>
                {criteria.map(([label, key]) => {
                  const score = feedback.scores?.[key];
                  const note = typeof score?.note === "number" ? score.note : 0;
                  const color = bc(note);
                  const isOpen = expandedScore === key;
                  return (
                    <div key={key}>
                      <button className="score-bar-row" onClick={() => setExpandedScore(isOpen ? null : key)}>
                        <span className="score-bar-label">{label}</span>
                        <div className="score-bar-track">
                          <div className="score-bar-fill" style={{ width: `${(note / 4) * 100}%`, background: color }} />
                        </div>
                        <span className="score-bar-note" style={{ color }}>{note}/4</span>
                        <span className="score-bar-chevron">{isOpen ? "▲" : "▼"}</span>
                      </button>
                      {isOpen && score?.justification && (
                        <div className="score-justif" style={{ padding: "4px 10px 12px 167px", fontSize: "13px", color: "#94a3b8", lineHeight: 1.6, fontStyle: "italic" }}>
                          {score.justification}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(148,163,184,0.1)", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 900, color: sc }}>Total : {feedback.total ?? 0}/20</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#64748b" }}>{sl}</div>
                </div>
              </div>

              {/* ── 3. Points ── */}
              {(feedback.points_positifs?.length > 0 || feedback.points_ameliorer?.length > 0) && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px", marginBottom: "16px" }}>
                  {feedback.points_positifs?.length > 0 && (
                    <div style={{ ...getCardStyle(), borderColor: "rgba(34,197,94,0.2)" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#22c55e", marginBottom: "12px" }}>✅ Points positifs</div>
                      <ul style={{ margin: 0, padding: "0 0 0 16px", lineHeight: 1.9, color: "#e2e8f0", fontSize: "14px" }}>
                        {feedback.points_positifs.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                  {feedback.points_ameliorer?.length > 0 && (
                    <div style={{ ...getCardStyle(), borderColor: "rgba(245,158,11,0.2)" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f59e0b", marginBottom: "12px" }}>⚠️ Points à améliorer</div>
                      <ul style={{ margin: 0, padding: "0 0 0 16px", lineHeight: 1.9, color: "#e2e8f0", fontSize: "14px" }}>
                        {feedback.points_ameliorer.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* ── 4. Correction + Version côte à côte ── */}
              {(feedback.correction_simple || feedback.version_amelioree?.texte) && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px", marginBottom: "16px" }}>
                  {feedback.correction_simple && (
                    <div style={getCardStyle()}>
                      <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#93c5fd", marginBottom: "12px" }}>Votre réponse corrigée</div>
                      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75, color: "#e2e8f0", fontSize: "14px" }}>{feedback.correction_simple}</div>
                    </div>
                  )}
                  {feedback.version_amelioree?.texte && (
                    <div style={{ ...getCardStyle(), border: "1px solid rgba(139,92,246,0.28)", background: "rgba(76,29,149,0.12)" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c4b5fd", marginBottom: "12px" }}>
                        Modèle {feedback.version_amelioree.niveau_cible || "niveau supérieur"}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75, color: "#ddd6fe", fontSize: "14px" }}>{feedback.version_amelioree.texte}</div>
                    </div>
                  )}
                </div>
              )}

              {/* ── 5. Conseil prioritaire (mis en valeur) ── */}
              {feedback.conseil_prioritaire && (
                <div style={{ ...getCardStyle(), marginBottom: "16px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.28)" }}>
                  <div style={{ display: "flex", gap: "14px" }}>
                    <span style={{ fontSize: "22px", lineHeight: 1, flexShrink: 0, marginTop: "2px" }}>💡</span>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#60a5fa", marginBottom: "8px" }}>Conseil prioritaire</div>
                      <div style={{ color: "#e2e8f0", lineHeight: 1.7, fontSize: "15px" }}>{feedback.conseil_prioritaire}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 6. Phrases utiles ── */}
              {feedback.phrases_utiles?.length > 0 && (
                <div style={{ ...getCardStyle(), marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f9a8d4", marginBottom: "12px" }}>Phrases utiles à retenir</div>
                  <ul style={{ margin: 0, padding: "0 0 0 16px", lineHeight: 2, color: "#e2e8f0", fontSize: "14px" }}>
                    {feedback.phrases_utiles.map((p, i) => <li key={i} style={{ fontStyle: "italic" }}>{p}</li>)}
                  </ul>
                </div>
              )}

              {/* ── 7. Objectif prochain essai ── */}
              {feedback.objectif_prochain_essai && (
                <div style={{ ...getCardStyle(), marginBottom: "20px", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "20px", lineHeight: 1, flexShrink: 0 }}>🎯</span>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2dd4bf", marginBottom: "6px" }}>Objectif prochain essai</div>
                      <div style={{ color: "#e2e8f0", lineHeight: 1.7, fontSize: "15px" }}>{feedback.objectif_prochain_essai}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 8. Bouton Nouvel essai ── */}
              <button
                className="btn-ghost"
                onClick={resetVisualResultOnly}
                style={{ display: "block", width: "100%", padding: "14px", textAlign: "center", fontSize: "15px" }}
              >
                Nouvel essai
              </button>
            </>
          );
        })()}
      </div>
    </div>
  );
}

export default App;

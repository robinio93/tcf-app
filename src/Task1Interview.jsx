import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import ScoringLoader from "./components/ScoringLoader";
import EmailOptIn from "./components/EmailOptIn";
import AxesPrioritaires from "./components/AxesPrioritaires";
import PatternRecurrent from "./components/PatternRecurrent";
import {
  IconArrowLeft, IconChevronUp, IconChevronDown, IconPhone,
  IconCheck, IconAlert, IconLightbulb, IconTarget, IconBarChart, IconHourglass,
} from "./components/Icons";

const USER_ACTIVITY = "A vous de parler";
const EXAMINER_ACTIVITY = "L'examinateur parle...";

const TASK1_MAX_TIME = 120;       // cible affichée (2:00)
const TASK1_MIN_TIME = 90;
const TASK1_WARN_TIME = 105;      // amber à 1:45
const TASK1_CONCLUSION_SEND = 170; // envoyer instruction clôture forcée à 2:50
const TASK1_HARD_CUT = 180;       // hard cut à 3:00
const TASK1_ABSOLUTE_CUT = 210;   // hard cut absolu à 3:30
const PATTERNS_CLOTURE = [
  // Phrases de remerciement final
  /je vous remercie pour cet entretien/i,
  /merci pour cet entretien/i,
  /merci beaucoup pour cet entretien/i,
  // Phrases de souhaits de fin
  /je vous souhaite bonne chance pour votre projet/i,
  /je vous souhaite bonne chance/i,
  // Phrases de fin explicite
  /on va s'arrêter là/i,
  /nous allons (en )?rester là/i,
  /entretien (est )?terminé/i,
  /nous (avons )?terminé/i,
  // Au revoir final et formule variante 1
  /au revoir.{0,40}$/i,
  /bonne continuation à vous/i,
];


function extractClientSecret(payload) {
  if (!payload || typeof payload !== "object") return "";
  if (typeof payload.value === "string") return payload.value;
  if (typeof payload.client_secret === "string") return payload.client_secret;
  if (typeof payload.client_secret?.value === "string") return payload.client_secret.value;
  return "";
}

async function createRealtimeSession() {
  let response;
  try {
    response = await fetch("/api/realtime-session-task1", { method: "POST" });
  } catch {
    throw new Error(
      "Impossible de joindre /api/realtime-session-task1. En local, redemarrez le serveur npm run dev."
    );
  }

  const raw = await response.text();
  let data = {};
  if (raw) {
    try { data = JSON.parse(raw); } catch { data = { raw }; }
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("La route /api/realtime-session-task1 est introuvable. Redemarrez npm run dev.");
    }
    throw new Error(
      data?.message || data?.details?.error?.message || data?.error ||
      `Echec de /api/realtime-session-task1 (HTTP ${response.status}).`
    );
  }

  const clientSecret = extractClientSecret(data);
  if (!clientSecret) {
    throw new Error("La reponse de /api/realtime-session-task1 ne contient pas de client secret exploitable.");
  }
  return clientSecret;
}

function ConsigneTcfDeroulement() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{
      border: "1px solid rgba(245,158,11,0.28)",
      background: "rgba(245,158,11,0.08)",
      borderRadius: "12px",
      overflow: "hidden",
      marginBottom: "12px",
    }}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        style={{
          width: "100%", display: "flex", alignItems: "flex-start",
          gap: "12px", padding: "14px 16px", textAlign: "left",
          background: "none", border: "none", cursor: "pointer", color: "inherit",
        }}
      >
        <span style={{ fontSize: "20px", flexShrink: 0, lineHeight: 1.4 }}>⏱️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#fbbf24", marginBottom: "4px" }}>
            Comment se déroule la Tâche 1
          </div>
          <div style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: 1.55 }}>
            2 minutes — c'est à toi de parler en continu sur ta vie. L'examinateur intervient peu.
          </div>
        </div>
        <span style={{
          color: "#fbbf24", fontSize: "16px", flexShrink: 0, marginTop: "2px",
          display: "inline-block",
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
        }} aria-hidden="true">▾</span>
      </button>

      {isOpen && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(245,158,11,0.2)" }}>
          <div style={{ paddingTop: "12px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#cbd5e1", lineHeight: 1.65 }}>
            <div>
              <div style={{ fontWeight: 700, color: "#fde68a", marginBottom: "4px" }}>📌 Le format réel de l'examen</div>
              <p style={{ margin: 0 }}>
                À l'examen TCF Canada, la Tâche 1 dure <strong>exactement 2 minutes</strong>.
                L'examinateur pose une question d'ouverture (« Présentez-vous »), puis{" "}
                <strong>te laisse parler aussi longtemps que tu veux</strong>. Il n'intervient que si tu fais un silence prolongé.
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#fde68a", marginBottom: "4px" }}>🎯 Ta stratégie gagnante</div>
              <p style={{ margin: 0 }}>
                Plus tu parles en continu, mieux c'est. Pendant les 2 minutes, parle de toi naturellement :
                ton parcours, ta famille, ton métier ou tes études, tes loisirs, tes projets, ton envie
                d'immigrer au Canada. Tu n'as pas besoin d'attendre les questions — c'est à toi de t'auto-porter.
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#fde68a", marginBottom: "4px" }}>💡 Quand l'examinateur intervient</div>
              <p style={{ margin: 0 }}>
                Si tu t'arrêtes longtemps (5 secondes ou plus) sans avoir tout dit, l'examinateur te posera
                une relance courte pour te remettre en mouvement. Sinon, il restera silencieux pour te laisser briller.
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#fde68a", marginBottom: "4px" }}>⚠️ Le piège classique</div>
              <p style={{ margin: 0 }}>
                Beaucoup de candidats font des réponses courtes en attendant la prochaine question. C'est
                l'erreur la plus fréquente. Si tu réponds en 10 secondes et que tu attends qu'on te relance,
                tu n'auras pas le temps de démontrer ton vrai niveau dans les 2 minutes imparties.
              </p>
            </div>
            <div style={{ paddingTop: "8px", borderTop: "1px solid rgba(245,158,11,0.2)", fontSize: "12px", color: "rgba(253,230,138,0.6)", fontStyle: "italic" }}>
              Source : France Éducation International, méthodologie TCF Canada officielle.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Task1Interview({ onBack = null, betaCode = null }) {
  const [callState, setCallState] = useState("idle");
  const [activity, setActivity] = useState(USER_ACTIVITY);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusNote, setStatusNote] = useState(
    "Appuyez sur Commencer pour lancer l'entretien de la tache 1."
  );
  const [showTips, setShowTips] = useState(false);

  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const connectAttemptRef = useRef(0);
  const dataChannelReadyRef = useRef(false);
  const sessionReadyRef = useRef(false);
  const greetingSentRef = useRef(false);
  const activeResponseRef = useRef(false);
  const pendingExaminerTurnRef = useRef(false);
  const examinerAudioLockUntilRef = useRef(0);
  const returnToUserTimerRef = useRef(null);
  const conversationLogRef = useRef([]);
  const currentExaminerTranscriptRef = useRef("");
  const speechRecorderRef = useRef(null);
  const currentSpeechChunksRef = useRef([]);
  const speechBlobsRef = useRef([]);
  const callTimerRef = useRef(null);
  const callTimeAtHangUpRef = useRef(0);
  const hangupTriggeredRef = useRef(false);

  const [callTime, setCallTime] = useState(0);
  const [debriefState, setDebriefState] = useState("idle");
  const [debrief, setDebrief] = useState(null);
  const [conversationTranscript, setConversationTranscript] = useState([]);
  const debriefSectionRef = useRef(null);
  const processingSectionRef = useRef(null);
  const [expandedScore, setExpandedScore] = useState(null);
  const [processingStep, setProcessingStep] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const loadingMsgTimerRef = useRef(null);
  const tempsDebutRef = useRef(null);
  const phaseEntretienRef = useRef('idle');
  const momentClotureDetecteeRef = useRef(null);
  const examinerStartTimestampRef = useRef(null);
  const candidateStartTimestampRef = useRef(null);

  const [phaseEntretien, setPhaseEntretien] = useState('idle');
  const [candidatEnTrainDeParler, setCandidatEnTrainDeParler] = useState(false);
  const [examinateurEnTrainDeParler, setExaminateurEnTrainDeParler] = useState(false);
  const [dernierMomentParole, setDernierMomentParole] = useState(null);

  const isConnecting = callState === "connecting";
  const isConnected = callState === "connected";

  function formatCallTime(seconds) {
    const safe = Math.max(0, Number(seconds) || 0);
    const min = Math.floor(safe / 60);
    const sec = safe % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }

  function getCallTimerColor() {
    if (phaseEntretien === 'cloture_detectee') return "#4ade80";
    if (phaseEntretien === 'conclusion_attendue' || callTime >= TASK1_WARN_TIME) return "#f59e0b";
    return "#7dd3fc";
  }

  function getCallTimerLabel() {
    if (phaseEntretien === 'cloture_detectee') return "Conclusion en cours...";
    if (phaseEntretien === 'conclusion_attendue') return "Bientôt terminé...";
    if (callTime >= TASK1_WARN_TIME) return "Bientôt terminé...";
    if (callTime >= TASK1_MIN_TIME) return "Minimum atteint ✓";
    return "";
  }

  function getCallTimerProgress() {
    return Math.min((callTime / TASK1_MAX_TIME) * 100, 100);
  }

  function stopCallTimer() {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }

  function clearReturnToUserTimer() {
    if (returnToUserTimerRef.current) {
      clearTimeout(returnToUserTimerRef.current);
      returnToUserTimerRef.current = null;
    }
  }

  function setUserTurn(note) {
    setActivity(USER_ACTIVITY);
    if (note) setStatusNote(note);
  }

  function setExaminerTurn(note) {
    setActivity(EXAMINER_ACTIVITY);
    if (note) setStatusNote(note);
  }

  function lockExaminerTurn(ms = 1600) {
    examinerAudioLockUntilRef.current = Math.max(
      examinerAudioLockUntilRef.current,
      Date.now() + ms
    );
  }

  function markExaminerPending(note, lockMs = 1400) {
    clearReturnToUserTimer();
    pendingExaminerTurnRef.current = true;
    lockExaminerTurn(lockMs);
    setExaminerTurn(note);
  }

  function scheduleUserTurn(note) {
    clearReturnToUserTimer();
    const retry = () => {
      const remainingLock = examinerAudioLockUntilRef.current - Date.now();
      if (pendingExaminerTurnRef.current || remainingLock > 0) {
        returnToUserTimerRef.current = setTimeout(retry, Math.max(200, remainingLock));
        return;
      }
      setUserTurn(note);
    };
    returnToUserTimerRef.current = setTimeout(retry, 1200);
  }

  function resetRealtimeFlags() {
    clearReturnToUserTimer();
    dataChannelReadyRef.current = false;
    sessionReadyRef.current = false;
    greetingSentRef.current = false;
    activeResponseRef.current = false;
    pendingExaminerTurnRef.current = false;
    examinerAudioLockUntilRef.current = 0;
    currentExaminerTranscriptRef.current = "";
    stopCallTimer();
    if (speechRecorderRef.current && speechRecorderRef.current.state !== "inactive") {
      try { speechRecorderRef.current.stop(); } catch { /* no-op */ }
    }
    speechRecorderRef.current = null;
    currentSpeechChunksRef.current = [];
    phaseEntretienRef.current = 'idle';
    setPhaseEntretien('idle');
    setCandidatEnTrainDeParler(false);
    setExaminateurEnTrainDeParler(false);
    setDernierMomentParole(null);
    tempsDebutRef.current = null;
    momentClotureDetecteeRef.current = null;
    examinerStartTimestampRef.current = null;
    candidateStartTimestampRef.current = null;
  }

  function closeRealtimeResources() {
    if (dataChannelRef.current) {
      try { dataChannelRef.current.close(); } catch { /* no-op */ }
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      try { peerConnectionRef.current.close(); } catch { /* no-op */ }
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }
    resetRealtimeFlags();
  }

  function sendClientEvent(event) {
    const channel = dataChannelRef.current;
    if (!channel || channel.readyState !== "open") return;
    channel.send(JSON.stringify(event));
  }

  function envoyerInstructionCloture() {
    sendClientEvent({
      type: 'response.create',
      response: {
        instructions: "Conclus maintenant l'entretien immédiatement. Dis exactement : \"Très bien, je vous remercie pour cet entretien. Bonne continuation à vous.\" Ne pose plus aucune question.",
      },
    });
  }

  function setMicrophoneEnabled(enabled) {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => { track.enabled = enabled; });
  }

  function maybeStartAssistantGreeting() {
    if (
      greetingSentRef.current ||
      activeResponseRef.current ||
      !dataChannelReadyRef.current ||
      !sessionReadyRef.current
    ) return;

    greetingSentRef.current = true;
    markExaminerPending("Connexion etablie. L'examinateur vous accueille.");
    sendClientEvent({
      type: "response.create",
      response: {
        output_modalities: ["audio"],
      },
    });
  }

  function handleServerEvent(event) {
    if (!event || typeof event.type !== "string") return;

    if (event.type === "input_audio_buffer.timeout_triggered") {
      // Mode TCF strict : on ne déclenche AUCUNE relance.
      // L'event est juste un keepalive pour empêcher la fermeture WebRTC.
      // L'examinateur reste silencieux, le candidat reste maître du timing.
      return;
    }

    if (event.type === "session.created") {
      sessionReadyRef.current = true;
      maybeStartAssistantGreeting();
      return;
    }

    if (event.type === "input_audio_buffer.speech_started") {
      candidateStartTimestampRef.current = tempsDebutRef.current
        ? Math.floor((Date.now() - tempsDebutRef.current) / 1000)
        : 0;
      setCandidatEnTrainDeParler(true);
      setDernierMomentParole(Date.now());
      if (!localStreamRef.current?.getAudioTracks()?.some((track) => track.enabled)) return;
      if (pendingExaminerTurnRef.current || Date.now() < examinerAudioLockUntilRef.current) return;

      try {
        if (localStreamRef.current && !speechRecorderRef.current) {
          currentSpeechChunksRef.current = [];
          const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";
          const rec = mimeType
            ? new MediaRecorder(localStreamRef.current, { mimeType })
            : new MediaRecorder(localStreamRef.current);
          rec.ondataavailable = (e) => {
            if (e.data.size > 0) currentSpeechChunksRef.current.push(e.data);
          };
          rec.start();
          speechRecorderRef.current = rec;
        }
      } catch { /* enregistrement local non disponible */ }

      clearReturnToUserTimer();
      setUserTurn("Le micro est ouvert. Parlez naturellement.");
      return;
    }

    if (event.type === "input_audio_buffer.speech_stopped") {
      setCandidatEnTrainDeParler(false);
      setDernierMomentParole(Date.now());
      const rec = speechRecorderRef.current;
      if (rec && rec.state !== "inactive") {
        const slot = speechBlobsRef.current.length;
        speechBlobsRef.current.push(null);
        const tsCandidate = tempsDebutRef.current ? Math.floor((Date.now() - tempsDebutRef.current) / 1000) : 0;
        conversationLogRef.current.push({ role: "candidate", text: "__pending__", _slot: slot, timestampSec: candidateStartTimestampRef.current ?? tsCandidate, timestampEndSec: tsCandidate });
        candidateStartTimestampRef.current = null;
        rec.onstop = () => {
          const mime = rec.mimeType || "audio/webm";
          const blob = new Blob(currentSpeechChunksRef.current, { type: mime });
          if (blob.size > 200) speechBlobsRef.current[slot] = blob;
        };
        rec.stop();
        speechRecorderRef.current = null;
      }

      setMicrophoneEnabled(false);
      if (phaseEntretienRef.current === 'actif') {
        markExaminerPending("Vous avez termine. L'examinateur enchaine.");
        sendClientEvent({
          type: "response.create",
          response: { output_modalities: ["audio"] },
        });
      } else if (phaseEntretienRef.current === 'conclusion_attendue') {
        envoyerInstructionCloture();
      }
      // cloture_detectee ou termine : ne rien envoyer
      return;
    }

    if (event.type === "response.created") {
      activeResponseRef.current = true;
      markExaminerPending("L'examinateur prend la parole.");
      return;
    }

    if (event.type === "output_audio_buffer.started") {
      examinerStartTimestampRef.current = tempsDebutRef.current
        ? Math.floor((Date.now() - tempsDebutRef.current) / 1000)
        : 0;
      setExaminateurEnTrainDeParler(true);
      setDernierMomentParole(Date.now());
      activeResponseRef.current = true;
      pendingExaminerTurnRef.current = false;
      clearReturnToUserTimer();
      setMicrophoneEnabled(false);
      lockExaminerTurn(2200);
      setExaminerTurn("L'examinateur parle. Attendez qu'il ait fini avant de repondre.");
      return;
    }

    if (event.type === "response.output_audio_transcript.delta") {
      currentExaminerTranscriptRef.current += event.delta || "";
      pendingExaminerTurnRef.current = false;
      clearReturnToUserTimer();
      setMicrophoneEnabled(false);
      lockExaminerTurn(1800);
      setExaminerTurn("Ecoutez la question, puis repondez quand il a termine.");
      return;
    }

    if (event.type === "response.output_audio.delta") {
      pendingExaminerTurnRef.current = false;
      clearReturnToUserTimer();
      setMicrophoneEnabled(false);
      lockExaminerTurn(1800);
      setExaminerTurn("Ecoutez la question, puis repondez quand il a termine.");
      return;
    }

    if (event.type === "output_audio_buffer.stopped") {
      setExaminateurEnTrainDeParler(false);
      setDernierMomentParole(Date.now());
      activeResponseRef.current = false;
      pendingExaminerTurnRef.current = false;
      if (phaseEntretienRef.current === 'cloture_detectee') {
        // L'audio de la phrase de clôture vient de finir — démarre le délai de grâce de 2s
        // depuis ici plutôt que depuis response.done, pour éviter la coupure en cours de phrase.
        momentClotureDetecteeRef.current = Date.now();
      } else if (phaseEntretienRef.current === 'actif' || phaseEntretienRef.current === 'conclusion_attendue') {
        setMicrophoneEnabled(true);
        scheduleUserTurn("Votre tour. Repondez a la question.");
      }
      return;
    }

    if (event.type === "output_audio_buffer.cleared") {
      setExaminateurEnTrainDeParler(false);
      setDernierMomentParole(Date.now());
      activeResponseRef.current = false;
      pendingExaminerTurnRef.current = false;
      if (phaseEntretienRef.current === 'actif' || phaseEntretienRef.current === 'conclusion_attendue') {
        setMicrophoneEnabled(true);
        scheduleUserTurn("Votre tour. Repondez a la question.");
      }
      return;
    }

    if (event.type === "response.done") {
      activeResponseRef.current = false;
      const examinerText = currentExaminerTranscriptRef.current.trim();
      if (examinerText) {
        const tsExaminerEnd = tempsDebutRef.current ? Math.floor((Date.now() - tempsDebutRef.current) / 1000) : 0;
        conversationLogRef.current.push({
          role: "examiner",
          text: examinerText,
          timestampSec: examinerStartTimestampRef.current ?? tsExaminerEnd,
          timestampEndSec: tsExaminerEnd,
        });
        examinerStartTimestampRef.current = null;
        const phase = phaseEntretienRef.current;
        if (phase === 'actif' || phase === 'conclusion_attendue') {
          if (PATTERNS_CLOTURE.some(p => p.test(examinerText))) {
            momentClotureDetecteeRef.current = Date.now();
            phaseEntretienRef.current = 'cloture_detectee';
            setPhaseEntretien('cloture_detectee');
          }
        }
        currentExaminerTranscriptRef.current = "";
      }
      return;
    }

    if (event.type === "error") {
      const message = event.error?.message || "Erreur inconnue recue depuis le canal Realtime.";
      if (message.includes("active response in progress")) return;
      setErrorMessage(message);
      setStatusNote("La session a renvoye une erreur.");
    }
  }

  async function startCall() {
    if (isConnecting || isConnected) return;

    hangupTriggeredRef.current = false;
    const attemptId = connectAttemptRef.current + 1;
    connectAttemptRef.current = attemptId;

    stopCallTimer();
    setCallTime(0);
    setProcessingStep(null);
    closeRealtimeResources();
    conversationLogRef.current = [];
    currentExaminerTranscriptRef.current = "";
    speechBlobsRef.current = [];
    currentSpeechChunksRef.current = [];
    setDebrief(null);
    setDebriefState("idle");
    setConversationTranscript([]);
    setShowTranscript(false);
    setErrorMessage("");
    setCallState("connecting");
    setUserTurn();
    setStatusNote("Activation du micro et connexion WebRTC en cours...");

    try {
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
        throw new Error("Ce navigateur ne prend pas en charge l'acces micro.");
      }

      const clientSecret = await createRealtimeSession();
      if (connectAttemptRef.current !== attemptId) return;

      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (connectAttemptRef.current !== attemptId) {
        localStream.getTracks().forEach((track) => track.stop());
        return;
      }

      localStreamRef.current = localStream;
      localStream.getAudioTracks().forEach((track) => { track.enabled = false; });

      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      peerConnection.ontrack = (event) => {
        if (!remoteAudioRef.current) return;
        remoteAudioRef.current.srcObject = event.streams[0];
        void remoteAudioRef.current.play().catch(() => {});
      };

      peerConnection.onconnectionstatechange = () => {
        const nextState = peerConnection.connectionState;

        if (nextState === "connected") {
          setCallState("connected");
          setStatusNote("Connexion active. L'entretien est en cours.");

          setCallTime(0);
          tempsDebutRef.current = Date.now();
          phaseEntretienRef.current = 'actif';
          setPhaseEntretien('actif');
          setDernierMomentParole(Date.now());
          return;
        }

        if (nextState === "failed") {
          if ((phaseEntretienRef.current === 'actif' || phaseEntretienRef.current === 'conclusion_attendue') && conversationLogRef.current.length > 0 && !hangupTriggeredRef.current) {
            hangupTriggeredRef.current = true;
            hangUp();
          } else {
            setErrorMessage("La connexion WebRTC a echoue.");
            setCallState("error");
            setStatusNote("La connexion a echoue. Vous pouvez relancer un entretien.");
            stopCallTimer();
            closeRealtimeResources();
          }
          return;
        }

        if (nextState === "disconnected" || nextState === "closed") {
          if ((phaseEntretienRef.current === 'actif' || phaseEntretienRef.current === 'conclusion_attendue') && conversationLogRef.current.length > 0 && !hangupTriggeredRef.current) {
            hangupTriggeredRef.current = true;
            hangUp();
          } else {
            setCallState("idle");
            setUserTurn("Entretien termine.");
            setStatusNote("Entretien termine.");
            stopCallTimer();
            closeRealtimeResources();
          }
        }
      };

      localStream.getTracks().forEach((track) => { peerConnection.addTrack(track, localStream); });

      const dataChannel = peerConnection.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;

      dataChannel.addEventListener("open", () => {
        dataChannelReadyRef.current = true;
        maybeStartAssistantGreeting();
      });

      dataChannel.addEventListener("close", () => {
        dataChannelReadyRef.current = false;
      });

      dataChannel.addEventListener("message", (messageEvent) => {
        try {
          const evt = JSON.parse(messageEvent.data);
          handleServerEvent(evt);
        } catch { /* ignore malformed events */ }
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: peerConnection.localDescription?.sdp || offer.sdp,
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
      });

      const answerSdp = await sdpResponse.text();
      if (!sdpResponse.ok) {
        throw new Error(answerSdp || "OpenAI a refuse la negociation SDP pour la session Realtime.");
      }

      if (connectAttemptRef.current !== attemptId) return;

      await peerConnection.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (error) {
      closeRealtimeResources();
      setCallState("error");
      setUserTurn("L'entretien n'a pas pu demarrer.");
      setStatusNote("L'entretien n'a pas pu demarrer.");
      setErrorMessage(error instanceof Error ? error.message : "Erreur inconnue pendant l'appel.");
    }
  }

  async function hangUp() {
    connectAttemptRef.current += 1;
    const hangUpAttemptId = connectAttemptRef.current;
    callTimeAtHangUpRef.current = tempsDebutRef.current
      ? Math.floor((Date.now() - tempsDebutRef.current) / 1000)
      : callTime;

    setProcessingStep("transcribing");
    setCallState("idle");
    setErrorMessage("");

    if (speechRecorderRef.current && speechRecorderRef.current.state !== "inactive") {
      const rec = speechRecorderRef.current;
      const slot = speechBlobsRef.current.length;
      speechBlobsRef.current.push(null);
      const tsHangUp = tempsDebutRef.current ? Math.floor((Date.now() - tempsDebutRef.current) / 1000) : 0;
      conversationLogRef.current.push({ role: "candidate", text: "__pending__", _slot: slot, timestampSec: tsHangUp });
      rec.onstop = () => {
        const mime = rec.mimeType || "audio/webm";
        const blob = new Blob(currentSpeechChunksRef.current, { type: mime });
        if (blob.size > 200) speechBlobsRef.current[slot] = blob;
      };
      rec.stop();
      speechRecorderRef.current = null;
    }

    setMicrophoneEnabled(false);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (connectAttemptRef.current !== hangUpAttemptId) return;

    const rawLog = [...conversationLogRef.current];
    const blobs = [...speechBlobsRef.current];
    closeRealtimeResources();

    const pendingSlots = rawLog.filter((e) => e._slot !== undefined);
    if (pendingSlots.length > 0) {
      for (const entry of pendingSlots) {
        const blob = blobs[entry._slot];
        if (!blob) continue;
        try {
          const ext = blob.type.includes("ogg") ? "ogg" : "webm";
          const file = new File([blob], `tour_${entry._slot}.${ext}`, { type: blob.type });
          const formData = new FormData();
          formData.append("file", file);
          formData.append("model", "gpt-4o-transcribe");
          const res = await fetch("/api/transcribe", { method: "POST", body: formData });
          if (res.ok) {
            const data = await res.json();
            entry.text = (data.text || "").trim();
          }
        } catch {
          entry.text = "";
        }
      }
    }

    if (connectAttemptRef.current !== hangUpAttemptId) return;

    const cleanLog = rawLog
      .map(({ _slot, ...rest }) => rest)
      .filter((e) => e.text && e.text !== "__pending__");

    if (cleanLog.length > 0) {
      setConversationTranscript(cleanLog);
      setShowTranscript(false);
    }

    if (cleanLog.length >= 2) {
      setProcessingStep("analyzing");
      analyzeInterview(cleanLog, callTimeAtHangUpRef.current);
    } else {
      setProcessingStep(null);
    }
  }

  async function analyzeInterview(log, duration) {
    setDebriefState("analyzing");
    setDebrief(null);

    const conversationText = log
      .map((turn) => `[${turn.role === "examiner" ? "EXAMINATEUR" : "CANDIDAT"}] ${turn.text}`)
      .join("\n");

    try {
      const response = await fetch("/api/analyze-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: conversationText, durationSec: duration, betaCode: localStorage.getItem('tcf_beta_code') }),
      });

      const raw = await response.text();
      if (!raw) throw new Error("Reponse vide.");
      const data = JSON.parse(raw);

      if (!response.ok) throw new Error(data?.error || "Erreur API");

      const analysisRaw = data.analysis || "";
      const analysisText = analysisRaw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();

      let parsed = null;
      try {
        parsed = JSON.parse(analysisText);
      } catch {
        const match = analysisText.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch { parsed = null; }
        }
      }

      if (!parsed) throw new Error("JSON inexploitable.");
      if (!parsed.scores || typeof parsed.total !== "number") {
        throw new Error("Structure inattendue. Cles recues : " + Object.keys(parsed).join(", "));
      }

      setDebrief(parsed);
      setDebriefState("done");
      setProcessingStep(null);

      const isValidSession = (parsed.total > 0) && (duration >= 30);
      const shouldPersist = betaCode && betaCode !== "DEV-MODE" && isValidSession;

      if (shouldPersist) {
        supabase.from("sessions").insert([{
          tache: 1,
          sujet: "Entretien dirige — Tache 1",
          transcription: conversationText,
          scores: parsed.scores,
          total: parsed.total,
          niveau_cecrl: parsed.niveau_cecrl,
          niveau_nclc: parsed.niveau_nclc,
          feedback_complet: parsed,
          raw_analysis: parsed,
          prompt_version: parsed._meta?.prompt_version || 'T1.v1',
          model_used: parsed._meta?.model_used || 'claude-sonnet-4-6',
          audit_status: 'pending',
          duree_secondes: duration > 0 ? duration : null,
          beta_code: betaCode,
        }]).then(({ error }) => {
          if (error) console.error("Supabase sessions insert error:", error);
        });
        supabase.rpc("increment_beta_sessions", { p_code: betaCode }).then(() => {});
      } else {
        console.log("[Session non sauvegardée]", {
          reason: !betaCode ? "no_betaCode"
                : betaCode === "DEV-MODE" ? "dev_mode"
                : !isValidSession ? `invalid (total=${parsed.total}, duree=${duration}s)`
                : "unknown",
          total: parsed.total,
          duree_secondes: duration,
        });
      }
    } catch (e) {
      console.error("Debrief error:", e);
      setDebriefState("idle");
      setProcessingStep(null);
    }
  }

  useEffect(() => {
    if (processingStep === "transcribing" && processingSectionRef.current) {
      processingSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [processingStep]);

  // Rotation des messages de chargement toutes les 2 secondes
  useEffect(() => {
    if (processingStep !== null) {
      setLoadingMsgIndex(0);
      loadingMsgTimerRef.current = setInterval(() => {
        setLoadingMsgIndex((prev) => prev + 1);
      }, 2000);
    } else {
      if (loadingMsgTimerRef.current) {
        clearInterval(loadingMsgTimerRef.current);
        loadingMsgTimerRef.current = null;
      }
    }
    return () => {
      if (loadingMsgTimerRef.current) clearInterval(loadingMsgTimerRef.current);
    };
  }, [processingStep]);

  useEffect(() => {
    if (debriefState === "done" && debriefSectionRef.current) {
      setTimeout(() => {
        debriefSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [debriefState]);

  useEffect(() => {
    return () => {
      connectAttemptRef.current += 1;
      stopCallTimer();
      closeRealtimeResources();
    };
  }, []);

  useEffect(() => {
    if (phaseEntretien === 'idle' || phaseEntretien === 'termine') return;
    if (!tempsDebutRef.current) return;

    const intervalle = setInterval(() => {
      const elapsed = Math.floor((Date.now() - tempsDebutRef.current) / 1000);

      if (phaseEntretien === 'actif') {
        setCallTime(elapsed);
        if (elapsed >= TASK1_CONCLUSION_SEND) {
          phaseEntretienRef.current = 'conclusion_attendue';
          setPhaseEntretien('conclusion_attendue');
          envoyerInstructionCloture();
        }
        return;
      }

      if (phaseEntretien === 'conclusion_attendue') {
        setCallTime(elapsed);
        if (elapsed >= TASK1_HARD_CUT) {
          phaseEntretienRef.current = 'termine';
          setPhaseEntretien('termine');
          hangUp();
        }
        return;
      }

      if (phaseEntretien === 'cloture_detectee') {
        setCallTime(elapsed);

        // FERMETURE NETTE — 500ms après détection, on ferme.
        // Fidèle à l'examen TCF réel : l'examinateur conclut une fois, basta.
        // Pas d'attente de silence (l'IA peut enchaîner d'autres phrases qu'on ignore).
        const tempsDepuisCloture = momentClotureDetecteeRef.current
          ? (Date.now() - momentClotureDetecteeRef.current) / 1000
          : 0;
        if (tempsDepuisCloture >= 2) {
          console.log(`[T1] Fermeture nette ${Math.floor(tempsDepuisCloture * 1000)}ms après détection clôture`);
          phaseEntretienRef.current = 'termine';
          setPhaseEntretien('termine');
          hangUp();
          return;
        }

        // Hard cut absolu (filet ultime si la ref momentClotureDetectee est null)
        if (elapsed >= TASK1_ABSOLUTE_CUT) {
          phaseEntretienRef.current = 'termine';
          setPhaseEntretien('termine');
          hangUp();
          return;
        }
      }
    }, 200);

    return () => clearInterval(intervalle);
  }, [phaseEntretien, candidatEnTrainDeParler, examinateurEnTrainDeParler, dernierMomentParole]);

  const card = {
    borderRadius: "20px",
    border: "1px solid rgba(148,163,184,0.12)",
    background: "rgba(15,23,42,0.65)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
  };

  const bc = (n) => n >= 4 ? "#3b82f6" : n >= 3 ? "#22c55e" : n >= 2 ? "#f59e0b" : "#ef4444";

  const criteria = [
    ["Réalisation de la tâche", "realisation_tache"],
    ["Lexique", "lexique"],
    ["Grammaire", "grammaire"],
    ["Fluidité & Prononciation", "fluidite_prononciation"],
    ["Interaction & Spontanéité", "interaction_spontaneite"],
  ];

  return (
    <div style={{ minHeight: "100vh", padding: "32px 18px 48px", boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: "960px", margin: "0 auto" }}>

        {/* ── Header hors cadre — ligne 1 : Retour ── */}
        {typeof onBack === "function" && (
          <div style={{ marginBottom: "16px" }}>
            <button className="btn-ghost" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <IconArrowLeft size={14} /> Retour
            </button>
          </div>
        )}

        {/* ── Header hors cadre — ligne 2 : TCF Speaking AI + badge ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>TCF Speaking AI</span>
          <span style={{
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "#10b981", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: "999px", padding: "4px 11px",
          }}>
            Tâche 1
          </span>
        </div>

        <div
          className="t1-precall-wrapper"
          style={{
            ...card,
            border: processingStep !== null
              ? "1px solid rgba(59,130,246,0.45)"
              : "1px solid rgba(148,163,184,0.12)",
            boxShadow: processingStep !== null
              ? "0 0 0 3px rgba(59,130,246,0.12), 0 8px 32px rgba(0,0,0,0.24)"
              : "0 8px 32px rgba(0,0,0,0.24)",
            padding: "clamp(20px, 4vw, 32px)",
            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          }}
        >
          {/* ══ VUE TRAITEMENT POST-APPEL ══ */}
          {!isConnecting && !isConnected && processingStep === "analyzing" && (
            <div ref={processingSectionRef}><ScoringLoader /></div>
          )}
          {!isConnecting && !isConnected && processingStep === "transcribing" && (() => {
            const msgPools = {
              transcribing: [
                "📝 Transcription en cours...",
                "🎙️ Conversion de votre voix en texte...",
                "📋 On note tout ce que vous avez dit...",
              ],
            };
            const pool = msgPools[processingStep] || msgPools.transcribing;
            const currentMsg = pool[loadingMsgIndex % pool.length];
            return (
              <div ref={processingSectionRef} style={{ textAlign: "center", padding: "36px 16px" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px", animation: "spin-slow 3s linear infinite", display: "inline-block" }}>
                  🍁
                </div>
                <div style={{ fontSize: "clamp(18px, 4vw, 24px)", fontWeight: 800, marginBottom: "6px", color: "#f1f5f9" }}>
                  Traitement de votre entretien...
                </div>
                <div style={{ fontSize: "14px", color: "#10b981", marginBottom: "32px", minHeight: "22px", transition: "opacity 0.3s ease" }}>
                  {currentMsg}
                </div>
                <div style={{ maxWidth: "300px", marginInline: "auto", textAlign: "left" }}>
                  {[
                    { label: "Transcription du dialogue", done: processingStep === "analyzing", active: processingStep === "transcribing" },
                    { label: "Évaluation de votre performance", done: false, active: processingStep === "analyzing" },
                    { label: "Génération du feedback personnalisé", done: false, active: processingStep === "analyzing" },
                  ].map(({ label, done, active }, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "11px 0", borderBottom: i < 2 ? "1px solid rgba(148,163,184,0.08)" : "none", opacity: active || done ? 1 : 0.28, transition: "opacity 0.4s ease" }}>
                      <span style={{ width: "24px", flexShrink: 0, display: "inline-flex", justifyContent: "center", color: done ? "#4ade80" : active ? "#93c5fd" : "#334155" }}>
                        {done ? <IconCheck size={18} /> : active ? <IconHourglass size={18} /> : <span style={{ opacity: 0.3 }}>○</span>}
                      </span>
                      <span style={{ fontSize: "14px", fontWeight: active ? 700 : 400, color: done ? "#4ade80" : active ? "#f1f5f9" : "#64748b", transition: "color 0.3s ease" }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ══ VUE PRÉ-APPEL ══ */}
          {!isConnecting && !isConnected && processingStep === null && (
            <div className="t1-precall">

              {/* Titre */}
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h2 style={{
                  margin: "0 0 8px",
                  fontSize: "clamp(24px, 4vw, 34px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "#f1f5f9",
                }}>
                  Entretien dirigé
                </h2>
                <p style={{ margin: 0, fontSize: "15px", color: "#94a3b8", lineHeight: 1.65 }}>
                  L'examinateur va vous poser quelques questions personnelles pendant 2 minutes.
                </p>
              </div>

              {/* Objectif */}
              <div style={{
                background: "rgba(16,185,129,0.05)",
                border: "none",
                borderLeft: "3px solid #10b981",
                borderRadius: "0 10px 10px 0",
                padding: "14px 18px",
                marginBottom: "12px",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6ee7b7", marginBottom: "6px" }}>
                  Votre objectif
                </div>
                <div style={{ fontSize: "15px", color: "#e2e8f0", lineHeight: 1.65 }}>
                  Présentez-vous naturellement et répondez aux questions de l'examinateur. Parlez de votre parcours, votre famille, vos loisirs, vos projets.
                </div>
              </div>

              <ConsigneTcfDeroulement />

              {/* Conseils dépliables */}
              <button
                className="btn-ghost"
                onClick={() => setShowTips((v) => !v)}
                style={{ marginBottom: "12px", fontSize: "13px" }}
              >
                {showTips ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><IconChevronUp size={13} /> Masquer les conseils</span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18h6" /><path d="M10 22h4" />
                      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3v1h6v-1c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" />
                    </svg>
                    Voir les conseils
                  </span>
                )}
              </button>

              {showTips && (
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(148,163,184,0.1)",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  marginBottom: "12px",
                }}>
                  <ul style={{ margin: 0, padding: "0 0 0 16px", lineHeight: 2, color: "#94a3b8", fontSize: "14px" }}>
                    <li>Répondez avec des phrases complètes (évitez "oui", "non")</li>
                    <li>Donnez des détails : âge, ville, loisirs, projets</li>
                    <li>Utilisez un vocabulaire simple mais varié</li>
                    <li>Soyez naturel, pas de texte appris par cœur</li>
                    <li>Laissez l'examinateur finir sa question avant de répondre</li>
                  </ul>
                </div>
              )}

              {/* Résultat précédent */}
              {callTime > 0 && (
                <div style={{
                  borderRadius: "14px", padding: "16px 18px",
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${callTime >= TASK1_WARN_TIME ? "rgba(245,158,11,0.22)" : "rgba(148,163,184,0.1)"}`,
                  marginBottom: "12px",
                }}>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: getCallTimerColor() }}>
                    ⏱ {formatCallTime(callTime)} / {formatCallTime(TASK1_MAX_TIME)}
                  </span>
                </div>
              )}

              {/* Erreur */}
              {errorMessage && (
                <div style={{ borderRadius: "14px", padding: "14px 18px", border: "1px solid rgba(248,113,113,0.3)", background: "rgba(127,29,29,0.22)", color: "#fecaca", fontSize: "14px", marginBottom: "16px" }}>
                  <strong style={{ display: "block", marginBottom: "4px" }}>Erreur</strong>
                  {errorMessage}
                </div>
              )}

              {/* Débrief disponible */}
              {debriefState === "done" && debrief && (
                <button
                  onClick={() => debriefSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  style={{
                    display: "block", width: "100%", padding: "14px", marginBottom: "12px",
                    background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.35)",
                    borderRadius: "14px", color: "#6ee7b7", fontSize: "14px", fontWeight: 600,
                    cursor: "pointer", textAlign: "center",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}><IconBarChart size={15} /> Débrief disponible — voir les résultats ↓</span>
                </button>
              )}

              {/* CTA */}
              <div className="t1-precall-cta">
                <button
                  className="btn-start-call"
                  onClick={startCall}
                  style={{
                    display: "block", width: "100%", padding: "18px 24px",
                    fontSize: "17px", fontWeight: 700, letterSpacing: "-0.01em",
                    cursor: "pointer", background: "linear-gradient(135deg, #0d9488, #0f766e)",
                    color: "white", border: "none", borderRadius: "16px",
                    touchAction: "manipulation",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="2" width="6" height="13" rx="3" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                    Commencer l'entretien
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ══ VUE EN-APPEL ══ */}
          {(isConnecting || isConnected) && (
            <>
              {/* Header compact */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "#34d399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.22)",
                  borderRadius: "999px", padding: "3px 10px",
                }}>
                  Tâche 1
                </span>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "#94a3b8", flex: 1, lineHeight: 1.4 }}>
                  Entretien dirigé
                </span>
                {isConnected && (
                  <span style={{
                    fontSize: "12px", fontWeight: 600, color: "#22c55e",
                    background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
                    borderRadius: "999px", padding: "3px 10px", flexShrink: 0,
                  }}>
                    ● EN DIRECT
                  </span>
                )}
              </div>

              {/* Indicateur qui parle */}
              <div style={{ textAlign: "center", padding: "20px 0 24px" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "14px",
                  padding: "16px 28px", borderRadius: "999px",
                  border: `1px solid ${activity === USER_ACTIVITY ? "rgba(34,197,94,0.55)" : "rgba(59,130,246,0.55)"}`,
                  background: activity === USER_ACTIVITY ? "rgba(34,197,94,0.18)" : "rgba(59,130,246,0.18)",
                  transition: "all 0.3s ease",
                }}>
                  <span className={`speaker-dot speaker-dot--${activity === USER_ACTIVITY ? "candidate" : "examiner"}`} />
                  <span style={{ fontSize: "18px", fontWeight: 700, color: activity === USER_ACTIVITY ? "#4ade80" : "#60a5fa" }}>
                    {activity}
                  </span>
                </div>
              </div>

              {/* Timer */}
              <div style={{
                borderRadius: "16px", padding: "18px 20px",
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${callTime >= TASK1_WARN_TIME ? "rgba(245,158,11,0.3)" : "rgba(148,163,184,0.1)"}`,
                marginBottom: "20px", textAlign: "center",
                transition: "border-color 0.5s ease",
              }}>
                <div style={{
                  fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800,
                  color: getCallTimerColor(), marginBottom: "8px", transition: "color 0.5s ease",
                }}>
                  {formatCallTime(callTime)} / {formatCallTime(TASK1_MAX_TIME)}
                </div>
                <div style={{ color: getCallTimerColor(), fontWeight: 600, fontSize: "14px", marginBottom: "12px", minHeight: "20px", transition: "color 0.5s ease" }}>
                  {getCallTimerLabel()}
                </div>
                <div style={{ width: "100%", maxWidth: "480px", height: "6px", margin: "0 auto", background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{
                    width: `${getCallTimerProgress()}%`, height: "100%",
                    background: phaseEntretien === 'cloture_detectee'
                      ? "linear-gradient(90deg, #4ade80, #22c55e)"
                      : callTime >= TASK1_WARN_TIME
                      ? "linear-gradient(90deg, #f59e0b, #d97706)"
                      : "linear-gradient(90deg, #60a5fa, #3b82f6)",
                    borderRadius: "999px", transition: "width 0.5s ease, background 0.5s ease",
                  }} />
                </div>
              </div>

              {/* Status note */}
              {statusNote && (
                <div style={{ fontSize: "14px", color: "#64748b", textAlign: "center", marginBottom: "20px", lineHeight: 1.5 }}>
                  {statusNote}
                </div>
              )}

              {/* Erreur */}
              {errorMessage && (
                <div style={{ borderRadius: "14px", padding: "14px 18px", border: "1px solid rgba(248,113,113,0.3)", background: "rgba(127,29,29,0.22)", color: "#fecaca", fontSize: "14px", marginBottom: "20px" }}>
                  {errorMessage}
                </div>
              )}

              {/* Raccrocher */}
              <button
                onClick={hangUp}
                style={{
                  display: "block", width: "100%", padding: "18px 24px",
                  fontSize: "17px", fontWeight: 700, cursor: "pointer",
                  background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                  color: "white", border: "none", borderRadius: "16px",
                  boxShadow: "0 8px 24px rgba(239,68,68,0.3)",
                  minHeight: "56px", touchAction: "manipulation",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}><IconPhone size={18} /> Terminer l'entretien</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ══ TRANSCRIPTION + DÉBRIEF ══ */}
      <div style={{ width: "100%", maxWidth: "960px", margin: "0 auto" }}>
        {conversationTranscript.length > 0 && (
          <div style={{ marginTop: "32px" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: "12px", marginBottom: "16px",
            }}>
              <div style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.24em", color: "#34d399", fontWeight: 700 }}>
                Transcription — Tâche 1
              </div>
              <button
                onClick={() => setShowTranscript((v) => !v)}
                style={{
                  border: "1px solid rgba(148,163,184,0.2)", borderRadius: "999px",
                  padding: "8px 16px", background: "rgba(255,255,255,0.05)",
                  color: "#94a3b8", fontSize: "14px", fontWeight: 700, cursor: "pointer",
                }}
              >
                {showTranscript ? "Masquer transcription" : "Voir transcription"}
              </button>
            </div>
            {showTranscript && (
              <div style={{
                borderRadius: "24px", border: "1px solid rgba(148,163,184,0.12)",
                background: "rgba(15,23,42,0.72)", backdropFilter: "blur(12px)", padding: "28px",
              }}>
                {(() => {
                  const fmtTs = (sec) => { const m = Math.floor(sec / 60); const s = sec % 60; return `${m}:${String(s).padStart(2, '0')}`; };
                  const last = conversationTranscript[conversationTranscript.length - 1];
                  return (
                    <>
                      <div style={{ padding: "8px 12px", background: "rgba(99,102,241,0.08)", borderRadius: "8px", fontSize: "12px", color: "#a5b4fc", marginBottom: "16px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        <span>⏱️ Durée : {last?.timestampSec != null ? fmtTs(last.timestampSec) : "—"}</span>
                        <span>🎙️ Examinateur : {conversationTranscript.filter(e => e.role === "examiner").length} interventions</span>
                        <span>🎓 Candidat : {conversationTranscript.filter(e => e.role === "candidate").length} réponses</span>
                      </div>
                      {conversationTranscript.map((turn, index) => (
                        <div key={index} style={{ marginBottom: index < conversationTranscript.length - 1 ? "18px" : 0, lineHeight: 1.7 }}>
                          <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#64748b", marginRight: "6px" }}>
                            [{turn.timestampSec != null ? fmtTs(turn.timestampSec) : "?:??"}]
                          </span>
                          <span style={{ fontWeight: 800, fontSize: "14px", color: turn.role === "candidate" ? "#86efac" : "#7dd3fc" }}>
                            {turn.role === "candidate" ? "🎓 Candidat" : "🎙️ Examinateur"}{" "}:
                          </span>
                          <span style={{ color: "#e2e8f0", marginLeft: "8px" }}>{turn.text}</span>
                        </div>
                      ))}

                      {/* PANNEAU STATS AVANCÉES — debug interne et préparation Phase B */}
                      {conversationTranscript.length > 0 && (
                        <details style={{ marginTop: "16px", padding: "12px", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", fontSize: "13px" }}>
                          <summary style={{ cursor: "pointer", fontWeight: 600, color: "#a5b4fc", userSelect: "none" }}>
                            📊 Stats avancées (debug)
                          </summary>
                          <div style={{ marginTop: "12px", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {(() => {
                              const turns = conversationTranscript;
                              const examinerTurns = turns.filter(t => t.role === "examiner");
                              const candidateTurns = turns.filter(t => t.role === "candidate");
                              const turnsWithDuration = turns.map((turn, i) => {
                                const next = turns[i + 1];
                                const duration = next ? (next.timestampSec - turn.timestampSec) :
                                  (turn.timestampEndSec ? turn.timestampEndSec - turn.timestampSec : 0);
                                return { ...turn, calculatedDuration: duration };
                              });
                              const pauses = turns.slice(1).map((turn, i) => {
                                const prev = turns[i];
                                const prevEnd = prev.timestampEndSec || prev.timestampSec;
                                return { from_role: prev.role, to_role: turn.role, pause_sec: turn.timestampSec - prevEnd, position: i + 1 };
                              });
                              const anomalies = [];
                              pauses.forEach(p => {
                                if (p.pause_sec >= 8) anomalies.push({ type: "silence_long", severity: p.pause_sec >= 15 ? "warning" : "info", detail: `Pause ${p.pause_sec}s ${p.from_role}→${p.to_role} (tour ${p.position})` });
                              });
                              const totalDuration = turns.length > 0 ? (turns[turns.length - 1].timestampEndSec || turns[turns.length - 1].timestampSec) : 0;
                              const candidateSpeakingTime = turnsWithDuration.filter(t => t.role === "candidate").reduce((s, t) => s + t.calculatedDuration, 0);
                              const examinerSpeakingTime = turnsWithDuration.filter(t => t.role === "examiner").reduce((s, t) => s + t.calculatedDuration, 0);
                              const candidateRatio = totalDuration > 0 ? Math.round((candidateSpeakingTime / totalDuration) * 100) : 0;
                              const examinerRatio = totalDuration > 0 ? Math.round((examinerSpeakingTime / totalDuration) * 100) : 0;
                              const pausesExamToCand = pauses.filter(p => p.from_role === "examiner" && p.to_role === "candidate");
                              const pausesCandToExam = pauses.filter(p => p.from_role === "candidate" && p.to_role === "examiner");
                              const avgExamToCand = pausesExamToCand.reduce((s, p) => s + p.pause_sec, 0) / Math.max(1, pausesExamToCand.length);
                              const avgCandToExam = pausesCandToExam.reduce((s, p) => s + p.pause_sec, 0) / Math.max(1, pausesCandToExam.length);
                              const maxPause = pauses.length > 0 ? Math.max(...pauses.map(p => p.pause_sec)) : 0;
                              const sessionStatsForDB = {
                                session_metadata: { duration_sec: totalDuration, turns_count: turns.length, examiner_turns: examinerTurns.length, candidate_turns: candidateTurns.length },
                                speaking_time: { candidate_sec: candidateSpeakingTime, examiner_sec: examinerSpeakingTime, candidate_ratio_percent: candidateRatio, examiner_ratio_percent: examinerRatio },
                                pauses: { avg_examiner_to_candidate_sec: Math.round(avgExamToCand * 10) / 10, avg_candidate_to_examiner_sec: Math.round(avgCandToExam * 10) / 10, longest_pause_sec: maxPause, all_pauses: pauses },
                                anomalies,
                                turns_detail: turnsWithDuration.map((t, i) => ({ order: i + 1, role: t.role, start_sec: t.timestampSec, end_sec: t.timestampEndSec || (t.timestampSec + t.calculatedDuration), duration_sec: t.calculatedDuration, text_preview: t.text ? t.text.substring(0, 80) + (t.text.length > 80 ? "..." : "") : "" })),
                              };
                              return (
                                <>
                                  <div>
                                    <div style={{ fontWeight: 700, color: "#a5b4fc", marginBottom: "6px" }}>📈 Vue d'ensemble</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", fontSize: "12px" }}>
                                      <div>⏱️ Durée totale : <strong>{totalDuration}s</strong></div>
                                      <div>🎤 Tours total : <strong>{turns.length}</strong></div>
                                      <div>🎓 Candidat : <strong>{candidateSpeakingTime}s ({candidateRatio}%)</strong></div>
                                      <div>🎙️ Examinateur : <strong>{examinerSpeakingTime}s ({examinerRatio}%)</strong></div>
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, color: "#a5b4fc", marginBottom: "6px" }}>⏸️ Pauses moyennes</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px" }}>
                                      <div>Examinateur → Candidat : <strong>{avgExamToCand.toFixed(1)}s</strong></div>
                                      <div>Candidat → Examinateur : <strong>{avgCandToExam.toFixed(1)}s</strong></div>
                                      <div>Pause la plus longue : <strong>{maxPause}s</strong></div>
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, color: "#a5b4fc", marginBottom: "6px" }}>🚨 Anomalies détectées ({anomalies.length})</div>
                                    {anomalies.length === 0 ? (
                                      <div style={{ fontSize: "12px", color: "#86efac" }}>✅ Aucune anomalie — session propre</div>
                                    ) : (
                                      <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                                        {anomalies.map((a, i) => (
                                          <div key={i} style={{ color: a.severity === "warning" ? "#fbbf24" : "#a5b4fc", padding: "4px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }}>
                                            [{a.severity}] {a.detail}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, color: "#a5b4fc", marginBottom: "6px" }}>📋 Détail des tours</div>
                                    <div style={{ fontSize: "11px", fontFamily: "monospace", background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "4px" }}>
                                      {turnsWithDuration.map((t, i) => (
                                        <div key={i}>[{i + 1}] {t.role === "examiner" ? "🎙️" : "🎓"} {t.timestampSec}s → durée ~{t.calculatedDuration}s</div>
                                      ))}
                                    </div>
                                  </div>
                                  <details style={{ fontSize: "11px" }}>
                                    <summary style={{ cursor: "pointer", color: "#94a3b8" }}>🗄️ Données prêtes pour Phase B (Supabase)</summary>
                                    <pre style={{ marginTop: "8px", padding: "8px", background: "rgba(0,0,0,0.3)", borderRadius: "4px", color: "#cbd5e1", fontSize: "10px", overflowX: "auto", maxHeight: "300px", overflowY: "auto" }}>
                                      {JSON.stringify(sessionStatsForDB, null, 2)}
                                    </pre>
                                  </details>
                                </>
                              );
                            })()}
                          </div>
                        </details>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {debriefState === "analyzing" && (
          <div style={{
            marginTop: "16px", ...card,
            padding: "28px", textAlign: "center",
          }}>
            <div style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>⏳ Génération du débrief...</div>
            <div style={{ color: "#94a3b8", fontSize: "15px" }}>Analyse de votre entretien en cours.</div>
          </div>
        )}

        {debriefState === "done" && debrief && (
          <div ref={debriefSectionRef} style={{ marginTop: "20px" }}>
            {(() => {
              const lc = debrief.niveau_cecrl === "C1" || debrief.niveau_cecrl === "C2" ? "#60a5fa" : debrief.niveau_cecrl === "B2" ? "#4ade80" : debrief.niveau_cecrl === "B1" ? "#f59e0b" : "#fb7185";
              const total = debrief.total ?? 0;
              const sc = total >= 12 ? "#4ade80" : total >= 8 ? "#f59e0b" : "#fb7185";
              const sl = total >= 16 ? "Niveau C1 — excellent"
                      : total >= 14 ? "Niveau C1 — solide"
                      : total >= 12 ? "Niveau B2 confirmé"
                      : total >= 10 ? "Niveau B2 — seuil Entrée Express"
                      : total >= 7  ? "Niveau B1 — bon socle"
                      : total === 6 ? "Niveau B1 — limite"
                      : total >= 4  ? "Niveau A2 — à renforcer"
                      :                "Niveau A1 — travail ciblé nécessaire";
              return (
                <>
                  {/* 1. En-tête niveau */}
                  <div style={{ ...card, textAlign: "center", padding: "32px 24px", marginBottom: "14px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569", marginBottom: "12px" }}>
                      Niveau estimé — Tâche 1
                    </div>
                    <div className="level-pop" style={{ fontSize: "clamp(64px, 12vw, 96px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em", color: lc, marginBottom: "6px" }}>
                      {debrief.niveau_cecrl || "—"}
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#a5b4fc", marginBottom: "4px" }}>
                      NCLC {debrief.niveau_nclc || "—"}
                    </div>
                    <div style={{ fontSize: "14px", color: "#64748b", fontWeight: 600, marginBottom: "16px" }}>
                      {sl} — {total}/20
                    </div>
                    {debrief.resume_niveau && (
                      <div style={{ fontSize: "15px", color: "#94a3b8", lineHeight: 1.7, maxWidth: "560px", marginInline: "auto" }}>
                        {debrief.resume_niveau}
                      </div>
                    )}
                  </div>

                  <PatternRecurrent patterns={debrief.patterns_recurrents} />

                  {/* 2. Barres de score */}
                  <div style={{ ...card, padding: "24px", marginBottom: "14px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569", marginBottom: "8px" }}>
                      Scores — 5 critères
                    </div>
                    {criteria.map(([label, key]) => {
                      const score = debrief.scores?.[key];
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
                            <span className="score-bar-chevron" style={{ display: "inline-flex" }}>{isOpen ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}</span>
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
                      <div style={{ fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 900, color: sc }}>Total : {total}/20</div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#64748b" }}>{sl}</div>
                    </div>
                  </div>

                  {/* 3. Points positifs / à améliorer */}
                  {Array.isArray(debrief.points_positifs) && debrief.points_positifs.length > 0 && (
                    <div style={{ ...card, padding: "20px", borderColor: "rgba(34,197,94,0.2)", marginBottom: "14px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#22c55e", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}><IconCheck size={13} /> Points positifs</div>
                      <ul style={{ margin: 0, padding: "0 0 0 16px", lineHeight: 1.9, color: "#e2e8f0", fontSize: "14px" }}>
                        {debrief.points_positifs.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                  <AxesPrioritaires
                    axes={debrief.axes_prioritaires}
                    fallbackPoints={debrief.points_ameliorer}
                  />

                  {/* 4. Correction + Version améliorée */}
                  {(debrief.correction_simple || debrief.version_amelioree?.texte) && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px", marginBottom: "14px" }}>
                      {debrief.correction_simple && (
                        <div style={{ ...card, padding: "20px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#93c5fd", marginBottom: "12px" }}>Votre réponse corrigée</div>
                          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75, color: "#e2e8f0", fontSize: "14px" }}>{debrief.correction_simple}</div>
                        </div>
                      )}
                      {debrief.version_amelioree?.texte && (
                        <div style={{ ...card, padding: "20px", border: "1px solid rgba(139,92,246,0.28)", background: "rgba(76,29,149,0.12)" }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c4b5fd", marginBottom: "12px" }}>
                            Modèle {debrief.version_amelioree.niveau_cible || "niveau supérieur"}
                          </div>
                          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75, color: "#ddd6fe", fontSize: "14px" }}>{debrief.version_amelioree.texte}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. Conseil prioritaire */}
                  {debrief.conseil_prioritaire && (
                    <div style={{ ...card, padding: "20px", marginBottom: "14px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.28)" }}>
                      <div style={{ display: "flex", gap: "14px" }}>
                        <span style={{ flexShrink: 0, marginTop: "2px", display: "inline-flex", color: "#60a5fa" }}><IconLightbulb size={20} /></span>
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#60a5fa", marginBottom: "8px" }}>Conseil prioritaire</div>
                          <div style={{ color: "#e2e8f0", lineHeight: 1.7, fontSize: "15px" }}>{debrief.conseil_prioritaire}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6. Phrases utiles */}
                  {Array.isArray(debrief.phrases_utiles) && debrief.phrases_utiles.length > 0 && (
                    <div style={{ ...card, padding: "20px", marginBottom: "14px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f9a8d4", marginBottom: "12px" }}>Phrases utiles à retenir</div>
                      <ul style={{ margin: 0, padding: "0 0 0 16px", lineHeight: 2, color: "#e2e8f0", fontSize: "14px" }}>
                        {debrief.phrases_utiles.map((p, i) => <li key={i} style={{ fontStyle: "italic" }}>{p}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* 7. Objectif prochain essai */}
                  {debrief.objectif_prochain_essai && (
                    <div style={{ ...card, padding: "20px", marginBottom: "20px", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)" }}>
                      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                        <span style={{ flexShrink: 0, display: "inline-flex", color: "#2dd4bf" }}><IconTarget size={18} /></span>
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2dd4bf", marginBottom: "6px" }}>Objectif prochain essai</div>
                          <div style={{ color: "#e2e8f0", lineHeight: 1.7, fontSize: "15px" }}>{debrief.objectif_prochain_essai}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 8. Email opt-in après 1ère session */}
                  <EmailOptIn code={betaCode} />

                  {/* 9. Nouvel essai */}
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      setDebrief(null);
                      setDebriefState("idle");
                      setConversationTranscript([]);
                      setShowTranscript(false);
                      setExpandedScore(null);
                    }}
                    style={{ display: "block", width: "100%", padding: "14px", textAlign: "center", fontSize: "15px" }}
                  >
                    Nouvel essai
                  </button>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />
    </div>
  );
}

export default Task1Interview;

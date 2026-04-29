import { useState, useEffect } from "react";

// Verbes humoristiques aléatoires par étape (style Claude Code)
const STEP_VERBS = {
  step1: [
    "Récupération de votre échange",
    "Castorisation des mots",
    "Empilage des bûches verbales",
    "Compilation de votre interaction",
  ],
  step2: [
    "Évaluation des critères",
    "Décorticage par le jury virtuel",
    "Castorisation pédagogique",
    "Pesée de vos arguments",
  ],
  step3: [
    "Génération du feedback",
    "Sirupage de votre correction",
    "Coulage de sirop sur vos forces",
    "Préparation du retour personnalisé",
  ],
  step4: [
    "Mise en forme du débrief",
    "Polissage final",
    "Déneigement des conclusions",
    "Emballage cadeau",
  ],
};

const SUBTEXT_PHRASES = [
  "Le castor pédagogique analyse votre discours",
  "Le sirop d'érable adoucit votre correction",
  "On retire la neige autour de vos idées",
  "Le caribou relit vos arguments avec attention",
  "Votre réponse prend la route vers le niveau supérieur",
  "Le jury virtuel prépare votre estimation",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function ScoringLoader() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [subtextIndex, setSubtextIndex] = useState(0);

  const [stepLabels] = useState(() => ({
    step1: pickRandom(STEP_VERBS.step1),
    step2: pickRandom(STEP_VERBS.step2),
    step3: pickRandom(STEP_VERBS.step3),
    step4: pickRandom(STEP_VERBS.step4),
  }));

  const steps = [
    { id: 1, label: stepLabels.step1, threshold: 25 },
    { id: 2, label: stepLabels.step2, threshold: 55 },
    { id: 3, label: stepLabels.step3, threshold: 80 },
    { id: 4, label: stepLabels.step4, threshold: 95 },
  ];

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newProgress = Math.min(95, 100 * (1 - Math.exp(-elapsed / 25)));
      setProgress(newProgress);
      const stepIndex = steps.findIndex(s => newProgress < s.threshold);
      setCurrentStep(stepIndex === -1 ? steps.length - 1 : stepIndex);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtextIndex(i => (i + 1) % SUBTEXT_PHRASES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes subtextFade {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column", gap: "24px",
        padding: "40px 32px", maxWidth: "480px", margin: "0 auto",
      }}>

        {/* HEADER : 3 dots + titre */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            {[0, 0.2, 0.4].map((delay, i) => (
              <span key={i} style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#dc2626",
                animation: "dotPulse 1.4s ease-in-out infinite",
                animationDelay: `${delay}s`,
                display: "inline-block",
              }} />
            ))}
          </div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#e2e8f0", letterSpacing: "-0.01em" }}>
            Analyse en cours
          </div>
        </div>

        {/* BARRE DE PROGRESSION */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ position: "relative", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{
              position: "absolute", top: 0, left: 0,
              width: `${progress}%`, height: "100%",
              background: "linear-gradient(90deg, #dc2626, #ef4444)",
              borderRadius: "2px", transition: "width 0.3s ease-out",
            }} />
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "ui-monospace, monospace", letterSpacing: "0.05em" }}>
            {Math.round(progress)}%
          </div>
        </div>

        {/* LISTE DES ÉTAPES */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {steps.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            const isPending = idx > currentStep;
            return (
              <div key={step.id} style={{
                display: "flex", alignItems: "center", gap: "10px",
                fontSize: "13px", color: isPending ? "#475569" : "#cbd5e1",
                transition: "color 0.3s ease",
              }}>
                <span style={{ width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0 }}>
                  {isDone && <span style={{ color: "#4ade80" }}>✓</span>}
                  {isCurrent && (
                    <span style={{
                      display: "inline-block", width: "12px", height: "12px",
                      border: "1.5px solid #dc2626", borderTopColor: "transparent",
                      borderRadius: "50%", animation: "spin 0.8s linear infinite",
                    }} />
                  )}
                  {isPending && <span style={{ color: "#475569" }}>○</span>}
                </span>
                <span style={{ fontWeight: isCurrent ? 500 : 400, ...(isCurrent && { color: "#f1f5f9" }) }}>
                  {step.label}{isCurrent && "..."}
                </span>
              </div>
            );
          })}
        </div>

        {/* SÉPARATEUR */}
        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />

        {/* SUBTEXT */}
        <div style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", textAlign: "center", minHeight: "20px" }}>
          <span key={subtextIndex} style={{ animation: "subtextFade 0.6s ease-out" }}>
            💭 {SUBTEXT_PHRASES[subtextIndex]}...
          </span>
        </div>

        {/* PIED */}
        <div style={{ fontSize: "11px", color: "#64748b", textAlign: "center" }}>
          Cela peut prendre jusqu'à une minute. Merci de ne pas fermer la fenêtre.
        </div>

      </div>
    </>
  );
}

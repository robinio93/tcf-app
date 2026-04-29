import { useEffect, useState } from "react";

const LOADING_PHRASES = [
  "Le castor pédagogique analyse votre discours...",
  "Évaluation selon les critères officiels FEI...",
  "Détection de vos points forts et axes de progression...",
  "Le sirop d'érable adoucit votre correction...",
  "Votre discours passe au contrôle qualité canadien...",
  "On retire la neige autour de vos idées pour mieux les voir...",
  "La feuille d'érable vérifie la clarté de votre message...",
  "Analyse de la fluidité, de la structure et du lexique...",
  "Le caribou relit vos arguments avec attention...",
  "Votre réponse prend la route vers le niveau supérieur...",
  "Le jury virtuel prépare votre estimation de niveau...",
  "Votre feedback personnalisé est presque prêt...",
];

function MapleLeafLoader({ progress }) {
  return (
    <div style={{ position: "relative", width: "120px", height: "120px" }}>
      <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
        <defs>
          <clipPath id="leafClip">
            <path d="M50 8 L54 22 L62 18 L58 30 L72 26 L68 38 L82 42 L70 50 L78 62 L62 58 L58 74 L50 66 L42 74 L38 58 L22 62 L30 50 L18 42 L32 38 L28 26 L42 30 L38 18 L46 22 Z" />
          </clipPath>
        </defs>
        <path
          d="M50 8 L54 22 L62 18 L58 30 L72 26 L68 38 L82 42 L70 50 L78 62 L62 58 L58 74 L50 66 L42 74 L38 58 L22 62 L30 50 L18 42 L32 38 L28 26 L42 30 L38 18 L46 22 Z"
          fill="rgba(220,38,38,0.12)"
          stroke="rgba(220,38,38,0.35)"
          strokeWidth="0.8"
        />
        <rect
          x="0"
          y={100 - progress}
          width="100"
          height={progress}
          fill="#dc2626"
          clipPath="url(#leafClip)"
          style={{ transition: "y 0.4s ease, height 0.4s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: "18px", fontWeight: 700, color: "#fff",
        textShadow: "0 1px 4px rgba(0,0,0,0.6)",
      }}>
        {Math.round(progress)}%
      </div>
    </div>
  );
}

export default function ScoringLoader() {
  const [progress, setProgress] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const id = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setProgress(Math.min(95, 100 * (1 - Math.exp(-elapsed / 25))));
    }, 200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIndex(i => (i + 1) % LOADING_PHRASES.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: "32px", minHeight: "360px" }}>
      <MapleLeafLoader progress={progress} />
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        <div style={{ fontSize: "16px", color: "#cbd5e1", fontWeight: 500, marginBottom: "12px", minHeight: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {LOADING_PHRASES[phraseIndex]}
        </div>
        <div style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>
          Cela peut prendre jusqu'à une minute. Merci de ne pas fermer la fenêtre.
        </div>
      </div>
    </div>
  );
}

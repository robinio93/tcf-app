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

// Path SVG feuille d'érable canadienne 11 pointes + tige centrale
const MAPLE_PATH = "M 50,90 L 47,72 L 32,75 L 35,62 L 18,58 L 25,50 L 12,42 L 22,38 L 18,25 L 32,28 L 38,18 L 45,28 L 50,12 L 55,28 L 62,18 L 68,28 L 82,25 L 78,38 L 88,42 L 75,50 L 82,58 L 65,62 L 68,75 L 53,72 Z";

function MapleLeafLoader({ progress }) {
  return (
    <div style={{ position: "relative", width: "120px", height: "120px" }}>
      <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="leafClip">
            <path d={MAPLE_PATH} />
          </clipPath>
        </defs>
        <path
          d={MAPLE_PATH}
          fill="rgba(220,38,38,0.12)"
          stroke="rgba(220,38,38,0.35)"
          strokeWidth="0.8"
        />
        <rect
          x="0"
          y="0"
          width="100"
          height={progress}
          fill="#dc2626"
          clipPath="url(#leafClip)"
          style={{ transition: "height 0.3s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: "18px", fontWeight: 700, color: "#fff",
        textShadow: "0 1px 4px rgba(0,0,0,0.8)",
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

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

// Option B — feuille 11 pointes + tige séparée (caractéristique du drapeau canadien)
const LEAF_PATH = "M50 14 L55 28 L62 19 L67 31 L81 27 L76 40 L87 46 L73 54 L80 64 L64 68 L67 78 L53 75 L50 88 L47 75 L33 78 L36 68 L20 64 L27 54 L13 46 L24 40 L19 27 L33 31 L38 19 L45 28 Z";
const STEM_PATH = "M47 88 L47 95 L53 95 L53 88 Z";

const CSS_ANIMATIONS = `
  @keyframes dotPulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.1); }
  }
  @keyframes phraseFadeIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;

function MapleLeafLoader({ progress }) {
  return (
    <div style={{ position: "relative", width: "120px", height: "120px" }}>
      <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="leafClip">
            <path d={LEAF_PATH} />
            <path d={STEM_PATH} />
          </clipPath>
        </defs>

        {/* Fond — feuille + tige avec léger contour rouge */}
        <path d={LEAF_PATH} fill="rgba(220,38,38,0.12)" stroke="rgba(220,38,38,0.35)" strokeWidth="0.8" />
        <path d={STEM_PATH} fill="rgba(220,38,38,0.12)" stroke="rgba(220,38,38,0.35)" strokeWidth="0.8" />

        {/* Remplissage rouge progressif — descend de haut en bas */}
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

      {/* Pourcentage centré */}
      <div style={{
        position: "absolute", top: "46%", left: "50%",
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
      <style>{CSS_ANIMATIONS}</style>
      <MapleLeafLoader progress={progress} />
      <div style={{ textAlign: "center", maxWidth: "420px" }}>
        {/* Phrases avec 3 points pulsants à gauche */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "12px", minHeight: "48px" }}>
          <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0 }}>
            {[0, 0.2, 0.4].map((delay, i) => (
              <span key={i} style={{
                display: "inline-block", width: "6px", height: "6px", borderRadius: "50%",
                background: "#dc2626",
                animation: "dotPulse 1.4s ease-in-out infinite",
                animationDelay: `${delay}s`,
              }} />
            ))}
          </div>
          <div
            key={phraseIndex}
            style={{ fontSize: "15px", color: "#cbd5e1", fontWeight: 500, animation: "phraseFadeIn 0.4s ease-out" }}
          >
            {LOADING_PHRASES[phraseIndex]}
          </div>
        </div>
        <div style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>
          Cela peut prendre jusqu'à une minute. Merci de ne pas fermer la fenêtre.
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function BetaAccess({ onSuccess }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError("");

    const { data, error: dbErr } = await supabase
      .from("beta_testers")
      .select("code, onboarding_completed_at, objectif, familiarite, timeline")
      .eq("code", trimmed)
      .maybeSingle();

    if (dbErr || !data) {
      setError("Code invalide. Vérifie ton message d'invitation.");
      setLoading(false);
      return;
    }

    localStorage.setItem("tcf_beta_code", trimmed);
    localStorage.setItem("tcf_beta_profile", JSON.stringify({
      objectif: data.objectif,
      familiarite: data.familiarite,
      timeline: data.timeline,
      onboarding_completed_at: data.onboarding_completed_at,
    }));

    const now = new Date().toISOString();
    supabase.from("beta_testers").update({ last_used_at: now }).eq("code", trimmed).then(() => {});
    supabase.from("beta_testers").update({ first_used_at: now }).eq("code", trimmed).is("first_used_at", null).then(() => {});

    setLoading(false);
    onSuccess(trimmed, data);
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 18px",
    }}>
      <div style={{ maxWidth: "480px", width: "100%" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{
            fontSize: "13px", fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#64748b", marginBottom: "24px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}>
            <span>🇨🇦</span> TCF Speaking AI
          </div>
          <div style={{
            fontSize: "clamp(28px, 5vw, 38px)", fontWeight: 800,
            letterSpacing: "-0.03em", color: "#f1f5f9",
            marginBottom: "8px", lineHeight: 1.1,
          }}>
            Programme bêta
          </div>
          <div style={{
            fontSize: "12px", fontWeight: 700, color: "#8b5cf6",
            letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "24px",
          }}>
            Accès limité
          </div>
          <div style={{ fontSize: "15px", color: "#94a3b8", lineHeight: 1.7, maxWidth: "360px", margin: "0 auto" }}>
            La seule IA calibrée comme un vrai correcteur France Éducation International.
            Pas de flatterie.
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(15,23,42,0.65)",
          border: "1px solid rgba(148,163,184,0.12)",
          borderRadius: "20px", padding: "32px",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
        }}>
          <div style={{ fontSize: "15px", color: "#cbd5e1", marginBottom: "6px", fontWeight: 500 }}>
            Bienvenue parmi nos premiers testeurs.
          </div>
          <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "22px" }}>
            Entre ton code d'accès personnel :
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
              placeholder="TCF-XXXX"
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="characters"
              style={{
                width: "100%", boxSizing: "border-box",
                background: "rgba(255,255,255,0.06)", color: "#f1f5f9",
                border: error ? "1px solid rgba(239,68,68,0.55)" : "1px solid rgba(148,163,184,0.22)",
                borderRadius: "12px", padding: "14px 16px",
                fontSize: "20px", fontWeight: 700, letterSpacing: "0.1em",
                outline: "none", fontFamily: "'Courier New', monospace",
                marginBottom: "6px", transition: "border-color 0.2s",
              }}
            />
            <div style={{ minHeight: "22px", marginBottom: "14px" }}>
              {error && (
                <div style={{ fontSize: "13px", color: "#f87171" }}>{error}</div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              style={{
                width: "100%", padding: "15px", fontSize: "16px", fontWeight: 700,
                cursor: loading || !code.trim() ? "not-allowed" : "pointer",
                background: loading || !code.trim()
                  ? "rgba(139,92,246,0.3)"
                  : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                color: "white", border: "none", borderRadius: "12px",
                opacity: !code.trim() ? 0.5 : 1,
                transition: "all 0.2s", boxShadow: code.trim() && !loading ? "0 8px 20px rgba(139,92,246,0.3)" : "none",
              }}
            >
              {loading ? "Vérification..." : "Démarrer ma préparation →"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "28px" }}>
          <div style={{ fontSize: "13px", color: "#475569", marginBottom: "10px" }}>
            Pas encore de code ? Demande l'accès :
          </div>
          <a
            href="mailto:contact@tcfspeakingai.com"
            style={{ fontSize: "13px", color: "#8b5cf6", textDecoration: "none" }}
          >
            contact@tcfspeakingai.com
          </a>
          <div style={{ fontSize: "12px", color: "#334155", marginTop: "20px" }}>
            💡 App optimisée pour Chrome ou Edge
          </div>
        </div>
      </div>
    </div>
  );
}

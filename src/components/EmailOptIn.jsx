import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function EmailOptIn({ code }) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!code || code === "DEV-MODE") return;
    supabase
      .from("beta_testers")
      .select("total_sessions, email_optionnel")
      .eq("code", code)
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.total_sessions === 1 && !data.email_optionnel) {
          setVisible(true);
        }
      });
  }, [code]);

  if (!visible || submitted) return null;

  async function handleSubmit() {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) return;
    setSending(true);
    await supabase.from("beta_testers").update({
      email_optionnel: trimmed,
      email_donne_at: new Date().toISOString(),
    }).eq("code", code);
    setSending(false);
    setSubmitted(true);
  }

  return (
    <div style={{
      background: "rgba(139,92,246,0.06)",
      border: "1px solid rgba(139,92,246,0.22)",
      borderRadius: "16px",
      padding: "20px 22px",
      marginBottom: "16px",
    }}>
      <div style={{
        fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "#c4b5fd", marginBottom: "8px",
      }}>
        Rester dans la boucle
      </div>
      <div style={{ fontSize: "14px", color: "#cbd5e1", marginBottom: "16px", lineHeight: 1.6 }}>
        Tu veux recevoir les mises à jour de l'app et donner ton avis ?
        Laisse ton email — c'est facultatif.
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="exemple@email.com"
          style={{
            flex: 1, minWidth: "200px",
            background: "rgba(255,255,255,0.06)", color: "#f1f5f9",
            border: "1px solid rgba(148,163,184,0.2)", borderRadius: "10px",
            padding: "11px 14px", fontSize: "14px", outline: "none",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={sending || !email.includes("@")}
          style={{
            padding: "11px 18px", borderRadius: "10px", border: "none",
            background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", color: "white",
            fontSize: "14px", fontWeight: 600, cursor: "pointer",
            opacity: !email.includes("@") ? 0.4 : 1,
          }}
        >
          {sending ? "..." : "Envoyer"}
        </button>
        <button
          onClick={() => setSubmitted(true)}
          style={{
            padding: "11px 16px", borderRadius: "10px",
            border: "1px solid rgba(148,163,184,0.15)", background: "transparent",
            color: "#64748b", fontSize: "13px", cursor: "pointer",
          }}
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}

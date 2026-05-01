import { useState } from "react";
import { supabase } from "./lib/supabase";

const QUESTIONS = [
  {
    id: "objectif",
    label: "Pourquoi tu prépares le TCF ?",
    options: [
      { value: "immigration_canada", icon: "🇨🇦", label: "Immigration Canada", desc: "Entrée Express, citoyenneté" },
      { value: "demarches_france",  icon: "🇫🇷", label: "Démarches France",   desc: "Naturalisation, carte résident, études" },
      { value: "evaluer_niveau",    icon: "📚", label: "Évaluer mon niveau",  desc: "Savoir où j'en suis" },
      { value: "test_app",          icon: "🧑‍🏫", label: "Je teste l'app",    desc: "Prof FLE / curieux" },
    ],
  },
  {
    id: "familiarite",
    label: "Où en es-tu avec le TCF ?",
    options: [
      { value: "connait_format",  icon: "📖", label: "Je connais le format",         desc: "" },
      { value: "prepa_serieuse",  icon: "🎯", label: "Je me prépare sérieusement",   desc: "" },
      { value: "deja_passe",      icon: "✅", label: "J'ai déjà passé le TCF",       desc: "" },
    ],
  },
  {
    id: "timeline",
    label: "Quand passes-tu le TCF ?",
    options: [
      { value: "moins_1_mois", icon: "📅", label: "Moins d'1 mois",   desc: "" },
      { value: "1_3_mois",     icon: "📅", label: "1 à 3 mois",       desc: "" },
      { value: "plus_3_mois",  icon: "📅", label: "Plus de 3 mois",   desc: "" },
      { value: "pas_de_date",  icon: "🤷", label: "Pas de date prévue", desc: "" },
    ],
  },
];

export default function Onboarding({ code, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ objectif: null, familiarite: null, timeline: null });
  const [saving, setSaving] = useState(false);

  const q = QUESTIONS[step];
  const selected = answers[q.id];
  const isLast = step === QUESTIONS.length - 1;

  function selectOption(value) {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  }

  async function handleNext() {
    if (!selected) return;
    if (!isLast) { setStep((s) => s + 1); return; }

    setSaving(true);
    const now = new Date().toISOString();
    await supabase.from("beta_testers").update({
      objectif:                answers.objectif,
      familiarite:             answers.familiarite,
      timeline:                answers.timeline,
      onboarding_completed_at: now,
    }).eq("code", code);

    localStorage.setItem("tcf_beta_profile", JSON.stringify({
      objectif:                answers.objectif,
      familiarite:             answers.familiarite,
      timeline:                answers.timeline,
      onboarding_completed_at: now,
    }));
    setSaving(false);
    onComplete();
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 18px",
    }}>
      <div style={{ maxWidth: "520px", width: "100%" }}>

        {/* Barre de progression */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "36px" }}>
          {QUESTIONS.map((_, i) => (
            <div key={i} style={{
              height: "4px", borderRadius: "999px", flex: 1, maxWidth: "80px",
              transition: "background 0.3s",
              background: i <= step ? "#8b5cf6" : "rgba(148,163,184,0.18)",
            }} />
          ))}
        </div>

        <div style={{ textAlign: "center", marginBottom: "8px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b" }}>
          {step + 1} / {QUESTIONS.length}
        </div>

        <div style={{
          fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800,
          color: "#f1f5f9", marginBottom: "28px",
          textAlign: "center", letterSpacing: "-0.02em", lineHeight: 1.2,
        }}>
          {q.label}
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
          {q.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => selectOption(opt.value)}
              style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "16px 18px", borderRadius: "14px", textAlign: "left",
                cursor: "pointer", color: "inherit",
                border: selected === opt.value
                  ? "2px solid rgba(139,92,246,0.65)"
                  : "1px solid rgba(148,163,184,0.15)",
                background: selected === opt.value
                  ? "rgba(139,92,246,0.1)"
                  : "rgba(15,23,42,0.5)",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: "22px", flexShrink: 0, lineHeight: 1 }}>{opt.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "15px", fontWeight: 600,
                  color: selected === opt.value ? "#c4b5fd" : "#e2e8f0",
                }}>
                  {opt.label}
                </div>
                {opt.desc && (
                  <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>{opt.desc}</div>
                )}
              </div>
              {selected === opt.value && (
                <div style={{
                  flexShrink: 0, width: "20px", height: "20px", borderRadius: "50%",
                  background: "#8b5cf6", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "11px", color: "white", fontWeight: 700,
                }}>✓</div>
              )}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: "10px" }}>
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                flex: "0 0 auto", padding: "14px 20px", borderRadius: "12px",
                border: "1px solid rgba(148,163,184,0.2)", background: "transparent",
                color: "#94a3b8", fontSize: "14px", cursor: "pointer",
              }}
            >
              ← Précédent
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!selected || saving}
            style={{
              flex: 1, padding: "15px", borderRadius: "12px", border: "none",
              fontSize: "15px", fontWeight: 700,
              cursor: !selected || saving ? "not-allowed" : "pointer",
              background: !selected
                ? "rgba(139,92,246,0.3)"
                : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
              color: "white", opacity: !selected ? 0.5 : 1, transition: "all 0.2s",
              boxShadow: selected && !saving ? "0 8px 20px rgba(139,92,246,0.3)" : "none",
            }}
          >
            {saving ? "Enregistrement..." : isLast ? "Commencer →" : "Suivant →"}
          </button>
        </div>

      </div>
    </div>
  );
}

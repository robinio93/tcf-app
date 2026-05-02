import { useState } from "react";
import { supabase } from "./lib/supabase";
import { useUser } from "./contexts/UserContext";

// ── Questions 1-3 (onboarding existant) ─────────────────────────────────────

const Q1_OPTIONS = [
  { value: "immigration_canada", icon: "🇨🇦", label: "Immigration Canada",  desc: "Entrée Express, citoyenneté" },
  { value: "demarches_france",   icon: "🇫🇷", label: "Démarches France",    desc: "Naturalisation, carte résident, études" },
  { value: "evaluer_niveau",     icon: "📚",  label: "Évaluer mon niveau",  desc: "Savoir où j'en suis" },
  { value: "test_app",           icon: "🧑‍🏫", label: "Je teste l'app",     desc: "Prof FLE / curieux" },
];

const Q2_OPTIONS = [
  { value: "connait_format", icon: "📖", label: "Je connais le format",       desc: "" },
  { value: "prepa_serieuse",  icon: "🎯", label: "Je me prépare sérieusement", desc: "" },
  { value: "deja_passe",      icon: "✅", label: "J'ai déjà passé le TCF",    desc: "" },
];

const Q3_OPTIONS = [
  { value: "moins_1_mois", icon: "📅", label: "Moins d'1 mois",    desc: "" },
  { value: "1_3_mois",     icon: "📅", label: "1 à 3 mois",        desc: "" },
  { value: "plus_3_mois",  icon: "📅", label: "Plus de 3 mois",    desc: "" },
  { value: "pas_de_date",  icon: "🤷", label: "Pas de date prévue", desc: "" },
];

// ── Questions 4-6 (nouvelles) ─────────────────────────────────────────────

const NCLC_OPTIONS = [
  { value: 5,  label: "NCLC 5",  desc: "Niveau valide minimum" },
  { value: 6,  label: "NCLC 6",  desc: "Bon niveau intermédiaire" },
  { value: 7,  label: "NCLC 7",  desc: "Seuil Entrée Express ✓" },
  { value: 8,  label: "NCLC 8",  desc: "Au-dessus du seuil" },
  { value: 9,  label: "NCLC 9",  desc: "Score élevé" },
  { value: 10, label: "NCLC 10", desc: "Score maximal" },
];

const LANGUES_OPTIONS = [
  { value: "fr",          icon: "🇫🇷", label: "Français (natif)" },
  { value: "vi",          icon: "🇻🇳", label: "Vietnamien" },
  { value: "ar_maghreb",  icon: "🇲🇦", label: "Arabe (Maghreb)" },
  { value: "ar_mo",       icon: "🇸🇦", label: "Arabe (Moyen-Orient)" },
  { value: "en",          icon: "🇬🇧", label: "Anglais" },
  { value: "es",          icon: "🇪🇸", label: "Espagnol" },
  { value: "zh",          icon: "🇨🇳", label: "Mandarin" },
  { value: "pt_br",       icon: "🇧🇷", label: "Portugais (Brésil)" },
  { value: "ru_uk",       icon: "🇷🇺", label: "Russe / Ukrainien" },
  { value: "autre",       icon: "🌍",  label: "Autre" },
  { value: "prefer_not_say", icon: "🔒", label: "Préfère ne pas dire" },
];

// ── Helpers de style ──────────────────────────────────────────────────────────

const optionStyle = (selected) => ({
  display: "flex", alignItems: "center", gap: "14px",
  padding: "16px 18px", borderRadius: "14px", textAlign: "left",
  cursor: "pointer", color: "inherit",
  border: selected ? "2px solid rgba(139,92,246,0.65)" : "1px solid rgba(148,163,184,0.15)",
  background: selected ? "rgba(139,92,246,0.1)" : "rgba(15,23,42,0.5)",
  transition: "all 0.15s",
});

const labelStyle = (selected) => ({
  fontSize: "15px", fontWeight: 600,
  color: selected ? "#c4b5fd" : "#e2e8f0",
});

const checkBadge = {
  flexShrink: 0, width: "20px", height: "20px", borderRadius: "50%",
  background: "#8b5cf6", display: "flex", alignItems: "center",
  justifyContent: "center", fontSize: "11px", color: "white", fontWeight: 700,
};

// ── Composant principal ───────────────────────────────────────────────────────

export default function Onboarding({ mode = "complet", onComplete }) {
  const { betaCode, refreshProfile } = useUser();

  const startStep = mode === "reonboarding" ? 4 : 1;
  const [step, setStep] = useState(startStep);
  const [answers, setAnswers] = useState({
    objectif: null,
    familiarite: null,
    timeline: null,
    date_examen_prevu: null,
    nclc_cible: null,
    langue_maternelle: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const totalBarSteps = mode === "reonboarding" ? 3 : 6;
  const currentBarStep = mode === "reonboarding" ? step - 3 : step;
  const displayStep = currentBarStep;
  const displayTotal = totalBarSteps;

  const set = (key, value) => setAnswers(prev => ({ ...prev, [key]: value }));

  // Q1 : pré-remplissage NCLC 7 si immigration Canada (complet seulement, sans écraser un choix existant)
  function handleQ1Select(value) {
    setAnswers(prev => {
      const next = { ...prev, objectif: value };
      if (mode === "complet" && value === "immigration_canada" && prev.nclc_cible === null) {
        next.nclc_cible = 7;
      }
      return next;
    });
  }

  const isStepValid = () => {
    if (step === 1) return answers.objectif !== null;
    if (step === 2) return answers.familiarite !== null;
    if (step === 3) return answers.timeline !== null;
    if (step === 4) return true; // optionnelle
    if (step === 5) return answers.nclc_cible !== null;
    if (step === 6) return true; // optionnelle
    return false;
  };

  const goNext = () => setStep(s => s + 1);
  const goPrev = () => {
    const minStep = mode === "reonboarding" ? 4 : 1;
    setStep(s => Math.max(minStep, s - 1));
  };
  const canGoPrev = mode === "reonboarding" ? step > 4 : step > 1;

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    const now = new Date().toISOString();
    const updateData = {
      onboarding_completed_at: now,
      date_examen_prevu: answers.date_examen_prevu || null,
      nclc_cible: answers.nclc_cible,
      langue_maternelle: answers.langue_maternelle || null,
    };

    if (mode === "complet") {
      updateData.objectif = answers.objectif;
      updateData.familiarite = answers.familiarite;
      updateData.timeline = answers.timeline;
    }

    const { error: dbError } = await supabase
      .from("beta_testers")
      .update(updateData)
      .eq("code", betaCode);

    if (dbError) {
      console.error("[Onboarding] UPDATE failed:", dbError);
      setError("Une erreur est survenue. Réessaye dans un instant.");
      setSaving(false);
      return;
    }

    await refreshProfile();
    setSaving(false);
    if (onComplete) onComplete();
  }

  // ── Rendu des questions ────────────────────────────────────────────────────

  function renderOptions(options, answerKey) {
    const selected = answers[answerKey];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
        {options.map(opt => (
          <button key={opt.value} onClick={() => set(answerKey, opt.value)} style={optionStyle(selected === opt.value)}>
            <span style={{ fontSize: "22px", flexShrink: 0, lineHeight: 1 }}>{opt.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={labelStyle(selected === opt.value)}>{opt.label}</div>
              {opt.desc && <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>{opt.desc}</div>}
            </div>
            {selected === opt.value && <div style={checkBadge}>✓</div>}
          </button>
        ))}
      </div>
    );
  }

  function renderQ1() {
    const selected = answers.objectif;
    return (
      <>
        <div style={titleStyle}>Pourquoi tu prépares le TCF ?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
          {Q1_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => handleQ1Select(opt.value)} style={optionStyle(selected === opt.value)}>
              <span style={{ fontSize: "22px", flexShrink: 0, lineHeight: 1 }}>{opt.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={labelStyle(selected === opt.value)}>{opt.label}</div>
                {opt.desc && <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>{opt.desc}</div>}
              </div>
              {selected === opt.value && <div style={checkBadge}>✓</div>}
            </button>
          ))}
        </div>
      </>
    );
  }

  function renderQ2() {
    return (
      <>
        <div style={titleStyle}>Où en es-tu avec le TCF ?</div>
        {renderOptions(Q2_OPTIONS, "familiarite")}
      </>
    );
  }

  function renderQ3() {
    return (
      <>
        <div style={titleStyle}>Quand passes-tu le TCF ?</div>
        {renderOptions(Q3_OPTIONS, "timeline")}
      </>
    );
  }

  function renderQ4() {
    const today = new Date().toISOString().split("T")[0];
    return (
      <>
        <div style={titleStyle}>
          As-tu une date d&rsquo;examen prévue ?{" "}
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#64748b" }}>(facultatif)</span>
        </div>
        <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px", textAlign: "center" }}>
          Permet d&rsquo;afficher un compte à rebours sur ton dashboard.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
          <input
            type="date"
            min={today}
            value={answers.date_examen_prevu || ""}
            onChange={e => set("date_examen_prevu", e.target.value || null)}
            style={{
              background: "rgba(255,255,255,0.06)", color: "#f1f5f9",
              border: "1px solid rgba(148,163,184,0.22)", borderRadius: "12px",
              padding: "14px 16px", fontSize: "16px", outline: "none",
              cursor: "pointer", width: "100%", boxSizing: "border-box",
              colorScheme: "dark",
            }}
          />
          <button
            onClick={() => { set("date_examen_prevu", null); goNext(); }}
            style={{
              padding: "14px", borderRadius: "12px",
              border: "1px solid rgba(148,163,184,0.15)",
              background: "rgba(15,23,42,0.5)", color: "#94a3b8",
              fontSize: "14px", cursor: "pointer",
            }}
          >
            Pas encore de date prévue →
          </button>
        </div>
      </>
    );
  }

  function renderQ5() {
    const selected = answers.nclc_cible;
    return (
      <>
        <div style={titleStyle}>Quel niveau NCLC vises-tu ?</div>
        <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px", textAlign: "center" }}>
          NCLC 7 = seuil minimum Entrée Express. NCLC 9-10 = score d&rsquo;immigration plus élevé.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
          {NCLC_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => set("nclc_cible", opt.value)} style={optionStyle(selected === opt.value)}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle(selected === opt.value)}>{opt.label}</div>
                <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>{opt.desc}</div>
              </div>
              {selected === opt.value && <div style={checkBadge}>✓</div>}
            </button>
          ))}
        </div>
      </>
    );
  }

  function renderQ6() {
    const selected = answers.langue_maternelle;
    return (
      <>
        <div style={titleStyle}>
          Quelle est ta langue maternelle ?{" "}
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#64748b" }}>(facultatif)</span>
        </div>
        <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px", textAlign: "center" }}>
          Aide à personnaliser tes recommandations.
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "8px", marginBottom: "28px",
        }}>
          {LANGUES_OPTIONS.map(lang => (
            <button
              key={lang.value}
              onClick={() => set("langue_maternelle", selected === lang.value ? null : lang.value)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 14px", borderRadius: "12px", textAlign: "left",
                cursor: "pointer", color: "inherit",
                border: selected === lang.value ? "2px solid rgba(139,92,246,0.65)" : "1px solid rgba(148,163,184,0.15)",
                background: selected === lang.value ? "rgba(139,92,246,0.1)" : "rgba(15,23,42,0.5)",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: "18px", flexShrink: 0 }}>{lang.icon}</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: selected === lang.value ? "#c4b5fd" : "#e2e8f0" }}>
                {lang.label}
              </span>
            </button>
          ))}
        </div>
      </>
    );
  }

  function renderStep() {
    if (step === 1) return renderQ1();
    if (step === 2) return renderQ2();
    if (step === 3) return renderQ3();
    if (step === 4) return renderQ4();
    if (step === 5) return renderQ5();
    if (step === 6) return renderQ6();
    return null;
  }

  const isLast = step === 6;

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      padding: "32px 18px",
    }}>
      <div style={{ maxWidth: "520px", width: "100%" }}>

        {/* Barre de progression */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "36px" }}>
          {Array.from({ length: totalBarSteps }, (_, i) => (
            <div key={i} style={{
              height: "4px", borderRadius: "999px", flex: 1, maxWidth: "80px",
              transition: "background 0.3s",
              background: i < currentBarStep ? "#8b5cf6" : "rgba(148,163,184,0.18)",
            }} />
          ))}
        </div>

        <div style={{
          textAlign: "center", marginBottom: "8px",
          fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "#64748b",
        }}>
          {displayStep} / {displayTotal}
          {mode === "reonboarding" && (
            <span style={{ marginLeft: "10px", color: "#8b5cf6" }}>Quelques nouvelles questions</span>
          )}
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "10px", padding: "12px 16px", marginBottom: "16px",
            fontSize: "14px", color: "#fca5a5", textAlign: "center",
          }}>
            {error}
          </div>
        )}

        {renderStep()}

        {/* Navigation */}
        <div style={{ display: "flex", gap: "10px" }}>
          {canGoPrev && (
            <button onClick={goPrev} style={{
              flex: "0 0 auto", padding: "14px 20px", borderRadius: "12px",
              border: "1px solid rgba(148,163,184,0.2)", background: "transparent",
              color: "#94a3b8", fontSize: "14px", cursor: "pointer",
            }}>
              ← Précédent
            </button>
          )}
          {!isLast ? (
            <button
              onClick={goNext}
              disabled={!isStepValid()}
              style={{
                flex: 1, padding: "15px", borderRadius: "12px", border: "none",
                fontSize: "15px", fontWeight: 700,
                cursor: !isStepValid() ? "not-allowed" : "pointer",
                background: !isStepValid() ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                color: "white", opacity: !isStepValid() ? 0.5 : 1, transition: "all 0.2s",
                boxShadow: isStepValid() ? "0 8px 20px rgba(139,92,246,0.3)" : "none",
              }}
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isStepValid() || saving}
              style={{
                flex: 1, padding: "15px", borderRadius: "12px", border: "none",
                fontSize: "15px", fontWeight: 700,
                cursor: !isStepValid() || saving ? "not-allowed" : "pointer",
                background: !isStepValid() ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                color: "white", opacity: !isStepValid() ? 0.5 : 1, transition: "all 0.2s",
                boxShadow: isStepValid() && !saving ? "0 8px 20px rgba(139,92,246,0.3)" : "none",
              }}
            >
              {saving ? "Enregistrement..." : "Commencer →"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Style helper ──────────────────────────────────────────────────────────────
const titleStyle = {
  fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800,
  color: "#f1f5f9", marginBottom: "28px",
  textAlign: "center", letterSpacing: "-0.02em", lineHeight: 1.2,
};

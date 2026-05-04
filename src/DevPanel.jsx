import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import {
  IconChevronUp, IconChevronDown, IconCheck, IconAlert, IconLightbulb, IconHourglass, IconX,
} from "./components/Icons";

const CRITERIA_LABELS = {
  realisation_tache: "Réalisation de la tâche",
  lexique: "Lexique",
  grammaire: "Grammaire",
  fluidite_prononciation: "Fluidité & Prononciation",
  interaction_coherence: "Interaction & Cohérence",
  interaction_spontaneite: "Interaction & Spontanéité",
};

function safeParseAnalysis(raw) {
  const text = (raw || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try { return JSON.parse(text); } catch { /* */ }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) try { return JSON.parse(m[0]); } catch { /* */ }
  return null;
}

export default function DevPanel() {
  const [open, setOpen] = useState(true);
  const [task, setTask] = useState(2);
  const [scenarios, setScenarios] = useState([]);
  const [t3Subjects, setT3Subjects] = useState([]);
  const [scenarioId, setScenarioId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState(180);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    supabase.from("scenario_references")
      .select("id, numero, titre, consigne, role_examinateur, points_cles_attendus, erreurs_typiques_b1, difference_b1_b2_bon, expressions_cles, dialogue_a2, dialogue_b1, dialogue_b2")
      .order("numero")
      .then(({ data }) => { if (data) setScenarios(data); });

    supabase.from("task3_references")
      .select("id, numero, sujet, arguments_pour, arguments_contre, erreurs_typiques_b1, difference_b1_b2, expressions_cles, connecteurs_utiles, monologue_a2, monologue_b1, monologue_b2")
      .order("numero")
      .then(({ data }) => { if (data) setT3Subjects(data); });
  }, []);

  // Auto-set first item when task changes, always clear transcript
  useEffect(() => {
    if (task === 2 && scenarios.length > 0 && !scenarioId) setScenarioId(scenarios[0].id);
    if (task === 3 && t3Subjects.length > 0 && !subjectId) setSubjectId(t3Subjects[0].id);
    setTranscript("");
  }, [task, scenarios, t3Subjects]);

  // Clear transcript when scenario/subject changes
  useEffect(() => { setTranscript(""); }, [scenarioId, subjectId]);

  async function analyze() {
    if (!transcript.trim()) return;
    setLoading(true);
    setResult(null);
    setErrMsg("");

    try {
      let endpoint, body;

      if (task === 2) {
        const sc = scenarios.find((s) => s.id === scenarioId);
        endpoint = "/api/analyze-interaction";
        body = {
          conversation: transcript,
          scenario: sc?.titre || "Scénario test",
          durationSec: duration,
          isDev: true,
          scenarioData: sc ? {
            points_cles_attendus: sc.points_cles_attendus,
            erreurs_typiques_b1: sc.erreurs_typiques_b1,
            difference_b1_b2_bon: sc.difference_b1_b2_bon,
            expressions_cles: sc.expressions_cles,
            titre: sc.titre,
            dialogue_a2: sc.dialogue_a2,
            dialogue_b1: sc.dialogue_b1,
            dialogue_b2: sc.dialogue_b2,
          } : null,
        };
      } else if (task === 3) {
        const sj = t3Subjects.find((s) => s.id === subjectId);
        endpoint = "/api/analyze-text";
        body = {
          prompt: transcript,
          durationSec: duration,
          isDev: true,
          sujetData: sj ? {
            sujet: sj.sujet,
            arguments_pour: sj.arguments_pour,
            arguments_contre: sj.arguments_contre,
            erreurs_typiques_b1: sj.erreurs_typiques_b1,
            difference_b1_b2: sj.difference_b1_b2,
            expressions_cles: sj.expressions_cles,
            connecteurs_utiles: sj.connecteurs_utiles,
            monologue_a2: sj.monologue_a2,
            monologue_b1: sj.monologue_b1,
            monologue_b2: sj.monologue_b2,
          } : null,
        };
      } else {
        endpoint = "/api/analyze-interview";
        body = { conversation: transcript, durationSec: duration, isDev: true };
      }

      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const raw = await res.text();
      const data = JSON.parse(raw);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const parsed = safeParseAnalysis(data.analysis);
      if (!parsed?.scores) throw new Error("Réponse JSON invalide");
      setResult(parsed);
    } catch (e) {
      setErrMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  const card = { borderRadius: "14px", border: "1px solid rgba(148,163,184,0.12)", background: "rgba(15,23,42,0.7)", backdropFilter: "blur(12px)", padding: "16px" };
  const btn = (active) => ({
    padding: "7px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer", border: "none",
    background: active ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.06)",
    color: active ? "#fbbf24" : "#94a3b8",
    outline: active ? "1px solid rgba(251,191,36,0.5)" : "1px solid transparent",
  });

  const levelColor = result ? (result.niveau_cecrl === "B2" || result.niveau_cecrl === "C1" || result.niveau_cecrl === "C2" ? "#4ade80" : result.niveau_cecrl === "B1" ? "#f59e0b" : "#fb7185") : "#94a3b8";
  const barColor = (n) => n >= 4 ? "#3b82f6" : n >= 3 ? "#22c55e" : n >= 2 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{
      background: "rgba(30, 20, 0, 0.92)",
      borderBottom: "2px solid rgba(251,191,36,0.6)",
      backdropFilter: "blur(12px)",
      position: "relative",
      zIndex: 100,
    }}>
      {/* Banner header */}
      <div
        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 18px", cursor: "pointer", userSelect: "none" }}
        onClick={() => setOpen((v) => !v)}
      >
        <span style={{ fontSize: "16px" }}>🧪</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#fbbf24", letterSpacing: "0.05em" }}>
          MODE DÉVELOPPEUR — Test sans Realtime/Whisper
        </span>
        <span style={{ marginLeft: "auto", color: "#f59e0b", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>{open ? <><IconChevronUp size={12} /> Réduire</> : <><IconChevronDown size={12} /> Ouvrir</>}</span>
      </div>

      {open && (
        <div style={{ padding: "0 18px 18px", display: "grid", gap: "14px" }}>
          {/* Row 1: Task selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "#78716c", fontWeight: 600, minWidth: "80px" }}>Tâche</span>
            {[1, 2, 3].map((t) => (
              <button key={t} style={btn(task === t)} onClick={() => { setTask(t); setResult(null); setErrMsg(""); }}>
                Tâche {t}
              </button>
            ))}
          </div>

          {/* Row 2: Scenario/Subject selector */}
          {task === 2 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "#78716c", fontWeight: 600, minWidth: "80px" }}>Scénario</span>
              <select
                value={scenarioId}
                onChange={(e) => setScenarioId(e.target.value)}
                style={{ background: "rgba(255,255,255,0.07)", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "8px", padding: "6px 10px", fontSize: "13px", flex: 1, minWidth: "200px", maxWidth: "480px" }}
              >
                {scenarios.map((s) => <option key={s.id} value={s.id}>{s.numero}. {s.titre}</option>)}
              </select>
            </div>
          )}
          {task === 3 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "#78716c", fontWeight: 600, minWidth: "80px" }}>Sujet</span>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                style={{ background: "rgba(255,255,255,0.07)", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "8px", padding: "6px 10px", fontSize: "13px", flex: 1, minWidth: "200px", maxWidth: "480px" }}
              >
                {t3Subjects.map((s) => <option key={s.id} value={s.id}>{s.numero}. {s.sujet.substring(0, 60)}…</option>)}
              </select>
            </div>
          )}


          {/* Row 4: Transcript */}
          <div>
            <div style={{ fontSize: "12px", color: "#78716c", fontWeight: 600, marginBottom: "6px" }}>
              Transcription {task === 2 ? "(dialogue candidat/examinateur)" : task === 3 ? "(monologue candidat)" : "(entretien candidat/examinateur)"}
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={8}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "rgba(255,255,255,0.05)", color: "#e2e8f0",
                border: "1px solid rgba(148,163,184,0.18)", borderRadius: "10px",
                padding: "10px 12px", fontSize: "13px", lineHeight: 1.6,
                resize: "vertical", outline: "none", fontFamily: "inherit",
              }}
              placeholder={task === 1 ? "Collez ici la transcription de l'entretien (format [EXAMINATEUR] ... / [CANDIDAT] ...)" : ""}
            />
          </div>

          {/* Row 5: Duration + Submit */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "#78716c", fontWeight: 600 }}>Durée simulée (s)</span>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={10}
              max={400}
              style={{
                width: "80px", background: "rgba(255,255,255,0.07)", color: "#e2e8f0",
                border: "1px solid rgba(148,163,184,0.2)", borderRadius: "8px",
                padding: "6px 10px", fontSize: "13px", outline: "none",
              }}
            />
            <button
              onClick={analyze}
              disabled={loading || !transcript.trim()}
              style={{
                padding: "9px 22px", borderRadius: "10px", border: "none", cursor: loading ? "wait" : "pointer",
                background: loading ? "rgba(251,191,36,0.12)" : "linear-gradient(135deg, #d97706, #92400e)",
                color: "#fef3c7", fontSize: "14px", fontWeight: 700,
                opacity: !transcript.trim() ? 0.4 : 1,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>{loading && <IconHourglass size={15} />}{loading ? "Analyse en cours..." : "Analyser sans consommer Realtime"}</span>
            </button>
          </div>

          {errMsg && (
            <div style={{ color: "#fca5a5", fontSize: "13px", background: "rgba(127,29,29,0.3)", borderRadius: "8px", padding: "10px 14px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><IconX size={14} /> {errMsg}</span>
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{ display: "grid", gap: "12px" }}>
              {/* Level header */}
              <div style={{ ...card, textAlign: "center", padding: "20px" }}>
                <div style={{ fontSize: "11px", color: "#78716c", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Résultat — Tâche {task}
                </div>
                <div style={{ fontSize: "clamp(48px, 10vw, 72px)", fontWeight: 900, color: levelColor, lineHeight: 1, marginBottom: "4px" }}>
                  {result.niveau_cecrl || "—"}
                </div>
                <div style={{ fontSize: "14px", color: "#a5b4fc", marginBottom: "4px" }}>NCLC {result.niveau_nclc || "—"}</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: result.total >= 12 ? "#4ade80" : result.total >= 8 ? "#f59e0b" : "#fb7185" }}>
                  {result.total ?? 0}/20
                </div>
                {result.resume_niveau && (
                  <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "8px", lineHeight: 1.6 }}>{result.resume_niveau}</div>
                )}
              </div>

              {/* Score bars */}
              <div style={card}>
                {Object.entries(result.scores || {}).map(([key, val]) => {
                  const note = typeof val?.note === "number" ? val.note : 0;
                  const color = barColor(note);
                  return (
                    <div key={key} style={{ marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "#94a3b8", flex: 1 }}>{CRITERIA_LABELS[key] || key}</span>
                        <div style={{ width: "120px", height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden" }}>
                          <div style={{ width: `${(note / 4) * 100}%`, height: "100%", background: color, borderRadius: "999px" }} />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color, minWidth: "28px", textAlign: "right" }}>{note}/4</span>
                      </div>
                      {val?.justification && (
                        <div style={{ fontSize: "11px", color: "#64748b", paddingLeft: "4px", marginTop: "2px", fontStyle: "italic", lineHeight: 1.5 }}>
                          {val.justification}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Points / Conseil */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                {result.points_positifs?.length > 0 && (
                  <div style={{ ...card, borderColor: "rgba(34,197,94,0.2)" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#22c55e", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}><IconCheck size={12} /> Points positifs</div>
                    <ul style={{ margin: 0, padding: "0 0 0 14px", color: "#e2e8f0", fontSize: "12px", lineHeight: 1.8 }}>
                      {result.points_positifs.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}
                {result.points_ameliorer?.length > 0 && (
                  <div style={{ ...card, borderColor: "rgba(245,158,11,0.2)" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#f59e0b", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}><IconAlert size={12} /> À améliorer</div>
                    <ul style={{ margin: 0, padding: "0 0 0 14px", color: "#e2e8f0", fontSize: "12px", lineHeight: 1.8 }}>
                      {result.points_ameliorer.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              {result.conseil_prioritaire && (
                <div style={{ ...card, background: "rgba(59,130,246,0.08)", borderColor: "rgba(59,130,246,0.25)" }}>
                  <span style={{ display: "inline-flex", color: "#60a5fa", marginRight: "4px" }}><IconLightbulb size={14} /></span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#60a5fa" }}>Conseil : </span>
                  <span style={{ fontSize: "13px", color: "#e2e8f0" }}>{result.conseil_prioritaire}</span>
                </div>
              )}

              {/* correction_simple + version_amelioree (T2 spécifique) */}
              {(result.correction_simple || result.version_amelioree?.texte) && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                  {result.correction_simple && (
                    <div style={{ ...card }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#93c5fd", marginBottom: "8px" }}>Réponse corrigée</div>
                      <div style={{ fontSize: "12px", color: "#e2e8f0", whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{result.correction_simple}</div>
                    </div>
                  )}
                  {result.version_amelioree?.texte && (
                    <div style={{ ...card, borderColor: "rgba(139,92,246,0.3)" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#c4b5fd", marginBottom: "8px" }}>
                        Modèle {result.version_amelioree.niveau_cible || "niveau supérieur"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#ddd6fe", whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{result.version_amelioree.texte}</div>
                    </div>
                  )}
                </div>
              )}

              {/* phrases_utiles (T2 spécifique) */}
              {Array.isArray(result.phrases_utiles) && result.phrases_utiles.length > 0 && (
                <div style={{ ...card }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#f9a8d4", marginBottom: "8px" }}>Phrases utiles</div>
                  <ul style={{ margin: 0, padding: "0 0 0 14px", color: "#e2e8f0", fontSize: "12px", lineHeight: 1.9, fontStyle: "italic" }}>
                    {result.phrases_utiles.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}

              {/* profil_detecte + seuil_entree_express_atteint */}
              {(result.profil_detecte || result.seuil_entree_express_atteint != null) && (
                <div style={{ fontSize: "12px", color: "#78716c", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {result.profil_detecte && <span>Profil : <strong style={{ color: "#a5b4fc" }}>{result.profil_detecte}</strong></span>}
                  {result.seuil_entree_express_atteint != null && (
                    <span>Seuil Entrée Express : <strong style={{ color: result.seuil_entree_express_atteint ? "#4ade80" : "#fb7185" }}>{result.seuil_entree_express_atteint ? "✅ Atteint" : "❌ Non atteint"}</strong></span>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: "11px", color: "#78716c", paddingTop: "4px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><IconAlert size={12} /> Les sessions en mode dev ne sont PAS enregistrées dans Supabase</span>
          </div>
        </div>
      )}
    </div>
  );
}

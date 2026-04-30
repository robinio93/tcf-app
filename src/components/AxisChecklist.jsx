import { useState } from "react";

export default function AxisChecklist({ axesScoring, axesSuggestions }) {
  const [openIndices, setOpenIndices] = useState(new Set());

  const toggle = (idx) => {
    setOpenIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (!axesScoring || axesScoring.length === 0) return null;

  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{
        fontSize: "13px",
        color: "#94a3b8",
        marginBottom: "10px",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}>
        🎯 Axes à couvrir
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {axesScoring.map((axisTitle, idx) => {
          const suggestion = axesSuggestions?.[idx] || null;
          const isOpen = openIndices.has(idx);

          return (
            <div key={idx}>
              <button
                onClick={() => suggestion && toggle(idx)}
                disabled={!suggestion}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                  fontSize: "14px",
                  cursor: suggestion ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (suggestion) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (suggestion) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
              >
                {suggestion && (
                  <span style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    transition: "transform 0.2s ease",
                    transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                    display: "inline-block",
                  }}>▶</span>
                )}
                <span>{axisTitle}</span>
              </button>

              {isOpen && suggestion && (
                <div style={{
                  padding: "8px 12px 12px 32px",
                  fontSize: "13px",
                  color: "#cbd5e1",
                  fontStyle: "italic",
                  lineHeight: 1.5,
                }}>
                  💡 {suggestion}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

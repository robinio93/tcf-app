import { useMemo } from 'react';

const CRITERE_CONFIG = {
  realisation_tache:       { label: 'Réalisation de la tâche',  color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)'  },
  lexique:                 { label: 'Lexique',                   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)'  },
  grammaire:               { label: 'Grammaire',                 color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.3)'  },
  fluidite_prononciation:  { label: 'Fluidité',                  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)'  },
  interaction_coherence:   { label: 'Interaction & Cohérence',   color: '#ec4899', bg: 'rgba(236,72,153,0.1)',  border: 'rgba(236,72,153,0.3)'  },
  interaction_spontaneite: { label: 'Interaction & Spontanéité', color: '#ec4899', bg: 'rgba(236,72,153,0.1)',  border: 'rgba(236,72,153,0.3)'  },
};

const FALLBACK_CONFIG = { label: 'À améliorer', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' };

export default function AxesPrioritaires({ axes, fallbackPoints }) {
  const items = useMemo(() => {
    if (Array.isArray(axes) && axes.length > 0) {
      return axes.filter(a => a && (a.probleme || a.reformulation));
    }
    if (Array.isArray(fallbackPoints) && fallbackPoints.length > 0) {
      return fallbackPoints.map(p => ({ probleme: p, _fallback: true }));
    }
    return [];
  }, [axes, fallbackPoints]);

  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        fontSize: '11px',
        color: '#94a3b8',
        textTransform: 'uppercase',
        fontWeight: 700,
        letterSpacing: '0.1em',
        marginBottom: '14px',
      }}>
        ⚡ Tes 3 axes prioritaires
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((axe, i) => {
          const config = CRITERE_CONFIG[axe.critere] || FALLBACK_CONFIG;
          const isFallback = axe._fallback;

          return (
            <div
              key={i}
              style={{
                background: 'rgba(15,23,42,0.5)',
                border: `1px solid ${config.border}`,
                borderRadius: '14px',
                padding: '16px 18px',
                opacity: 0,
                animation: `card-enter 0.4s ease forwards ${i * 100}ms`,
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}>
                <div style={{
                  fontSize: '11px',
                  color: '#64748b',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  Axe prioritaire {i + 1}
                </div>
                {axe.impact_sur_note && (
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: config.color,
                    background: config.bg,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    whiteSpace: 'nowrap',
                  }}>
                    🎯 {axe.impact_sur_note}
                  </div>
                )}
              </div>

              {!isFallback && (
                <div style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: config.color,
                  background: config.bg,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  letterSpacing: '0.03em',
                }}>
                  📌 {config.label.toUpperCase()}
                </div>
              )}

              {axe.probleme && (
                <div style={{ marginBottom: axe.reformulation ? '12px' : '0' }}>
                  {!isFallback && (
                    <div style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}>
                      Tu as dit :
                    </div>
                  )}
                  <div style={{
                    fontSize: '14px',
                    color: '#e2e8f0',
                    lineHeight: 1.55,
                    fontStyle: isFallback ? 'normal' : 'italic',
                  }}>
                    {axe.probleme}
                  </div>
                </div>
              )}

              {axe.reformulation && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px dashed rgba(148,163,184,0.2)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: config.color,
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}>
                    💡 Essaie plutôt :
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#f1f5f9',
                    lineHeight: 1.55,
                  }}>
                    {axe.reformulation}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

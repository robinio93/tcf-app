// src/components/PatternRecurrent.jsx
// Affiche les erreurs récurrentes du candidat sur ses dernières sessions
// Position : juste après l'en-tête niveau, avant les barres de score

const ICONES = {
  'Accords et conjugaisons':   '🟣',
  'Vocabulaire trop simple':   '🔵',
  'Structure de discours':     '🟡',
  'Développement insuffisant': '🟢',
  'Hésitations et fluidité':   '🟠',
  'Registre et interaction':   '🔴',
  'Autre':                     '⚪',
};

export default function PatternRecurrent({ patterns }) {
  if (!patterns || !patterns.patterns || patterns.patterns.length === 0) return null;

  const { nb_sessions_analysees, patterns: items } = patterns;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.08))',
      border: '1px solid rgba(139,92,246,0.25)',
      borderRadius: '16px',
      padding: '20px 22px',
      marginBottom: '16px',
      opacity: 0,
      animation: 'card-enter 0.5s ease forwards 100ms',
    }}>
      <div style={{
        fontSize: '11px',
        color: '#c4b5fd',
        textTransform: 'uppercase',
        fontWeight: 700,
        letterSpacing: '0.1em',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        🔄 Tes erreurs récurrentes
      </div>

      <div style={{
        fontSize: '13px',
        color: '#94a3b8',
        marginBottom: '14px',
        lineHeight: 1.5,
      }}>
        Sur tes <strong style={{ color: '#f1f5f9' }}>{nb_sessions_analysees} dernières sessions</strong>, ces erreurs reviennent. Travailler ces 3 chantiers en priorité te fera gagner des points rapidement.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              background: 'rgba(15,23,42,0.5)',
              borderRadius: '10px',
              border: item.gravite_dominante === 'bloquante'
                ? '1px solid rgba(239,68,68,0.3)'
                : '1px solid rgba(148,163,184,0.1)',
            }}
          >
            <div style={{ fontSize: '20px', flexShrink: 0 }}>
              {ICONES[item.categorie] || '⚪'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#f1f5f9',
                marginBottom: '2px',
              }}>
                {item.categorie}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {item.occurrences} occurrence{item.occurrences > 1 ? 's' : ''}
                {item.gravite_dominante === 'bloquante' && (
                  <span style={{ color: '#f87171', marginLeft: '8px', fontWeight: 600 }}>
                    ⚠️ bloquant pour ton NCLC visé
                  </span>
                )}
              </div>
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#a78bfa',
              background: 'rgba(139,92,246,0.15)',
              padding: '4px 10px',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              CHANTIER #{i + 1}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '14px',
        fontSize: '12px',
        color: '#64748b',
        fontStyle: 'italic',
        textAlign: 'center',
      }}>
        💡 Concentre-toi sur le chantier #1 lors de ton prochain essai.
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { useUser } from './contexts/UserContext';
import Dashboard from './Dashboard';

// Mapping cohérent avec totalToCecrlNclc serveur (api/analyze-*.js)
function computeLevel(total) {
  if (total === null || total === undefined || isNaN(total)) return { cecrl: '—', nclc: '—' };
  if (total < 4)   return { cecrl: 'A1', nclc: 3 };
  if (total <= 5)  return { cecrl: 'A2', nclc: 4 };
  if (total === 6) return { cecrl: 'B1', nclc: 5 };
  if (total <= 9)  return { cecrl: 'B1', nclc: 6 };
  if (total <= 11) return { cecrl: 'B2', nclc: 7 };
  if (total <= 13) return { cecrl: 'B2', nclc: 8 };
  if (total <= 15) return { cecrl: 'C1', nclc: 9 };
  return             { cecrl: 'C1', nclc: 10 };
}

export default function DashboardStatusBar({ onStartNewSession }) {
  const { betaCode, userProfile } = useUser();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!betaCode) { setLoading(false); return; }

    fetch('/api/get-user-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ betaCode }),
    })
      .then(r => r.json())
      .then(data => { if (!cancelled) setSessions(data.sessions || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [betaCode]);

  // Calculs pour la barre : niveau pondéré sur les 5 dernières sessions
  const stats = useMemo(() => {
    if (!sessions.length) return null;
    const recent = sessions.slice(0, 5);
    const weights = [5, 4, 3, 2, 1];
    let weightedSum = 0, totalWeight = 0;
    recent.forEach((s, i) => {
      if (typeof s.total === 'number') {
        weightedSum += s.total * weights[i];
        totalWeight += weights[i];
      }
    });
    const avg = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const unweightedAvg = sessions.reduce((sum, s) => sum + (s.total || 0), 0) / sessions.length;
    const level = computeLevel(avg);
    return {
      avgScore: unweightedAvg.toFixed(1),
      currentLevel: level.cecrl,
      currentNclc: level.nclc,
    };
  }, [sessions]);

  // Countdown
  const daysLeft = useMemo(() => {
    if (!userProfile?.date_examen_prevu) return null;
    const examDate = new Date(userProfile.date_examen_prevu);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    examDate.setHours(0, 0, 0, 0);
    return Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
  }, [userProfile?.date_examen_prevu]);

  const countdownColor = daysLeft === null ? '#64748b'
    : daysLeft <= 7 ? '#ef4444'
    : daysLeft <= 30 ? '#f59e0b'
    : '#10b981';

  const objectiveNclc = userProfile?.nclc_cible || 7;

  // Rien à afficher : pas de sessions et pas de date d'examen
  if (loading || (!sessions.length && daysLeft === null)) return null;

  return (
    <>
      {/* ── Status bar sticky ─────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(15,23,42,0.88)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(148,163,184,0.12)',
      }}>
        <div style={{
          maxWidth: '1080px', margin: '0 auto',
          padding: '10px 18px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '12px',
        }}>
          {/* Pills gauche */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>

            {daysLeft !== null && (
              <Pill color={countdownColor}>
                <strong>J-{daysLeft >= 0 ? daysLeft : '—'}</strong>
              </Pill>
            )}

            {stats && (
              <Pill color="#8b5cf6">
                <strong>{stats.currentLevel}/NCLC {stats.currentNclc}</strong>
                <span style={{ opacity: 0.6, margin: '0 5px' }}>→</span>
                <span style={{ opacity: 0.85 }}>NCLC {objectiveNclc}</span>
              </Pill>
            )}

            {stats && (
              <Pill color="#94a3b8">
                <strong>{stats.avgScore}/20</strong>
                <span style={{ opacity: 0.7, marginLeft: '5px' }}>moy</span>
              </Pill>
            )}

            {sessions.length > 0 && (
              <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                {sessions.length} session{sessions.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Bouton expand */}
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '10px',
              border: '1px solid rgba(139,92,246,0.35)',
              background: expanded ? 'rgba(139,92,246,0.15)' : 'transparent',
              color: '#c4b5fd', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {expanded ? 'Réduire' : 'Détails'}
            <span style={{ display: 'inline-block', transition: 'transform 0.25s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▾
            </span>
          </button>
        </div>
      </div>

      {/* ── Drawer dépliable ──────────────────────────────────────── */}
      <div style={{
        maxHeight: expanded ? '5000px' : '0px',
        transition: 'max-height 0.45s ease-in-out',
        overflow: 'hidden',
        background: 'rgba(2,6,23,0.4)',
        borderBottom: expanded ? '1px solid rgba(148,163,184,0.12)' : 'none',
      }}>
        {expanded && (
          <Dashboard onStartNewSession={() => {
            setExpanded(false);
            if (onStartNewSession) onStartNewSession();
          }} />
        )}
      </div>
    </>
  );
}

function Pill({ color, children }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '5px 11px', borderRadius: '999px',
      background: `${color}18`, border: `1px solid ${color}33`,
      color, fontSize: '12.5px', fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {children}
    </div>
  );
}

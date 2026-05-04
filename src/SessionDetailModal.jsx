import { useEffect, useState } from 'react';
import AxesPrioritaires from './components/AxesPrioritaires';

export default function SessionDetailModal({ sessionId, betaCode, onClose }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/get-session-detail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ betaCode, sessionId }),
        }).then(r => r.json());
        if (cancelled) return;
        if (res.session) {
          setSession(res.session);
        } else {
          setError('Session introuvable.');
        }
      } catch {
        if (!cancelled) setError('Erreur de chargement.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [sessionId, betaCode]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgb(15,23,42)',
          border: '1px solid rgba(148,163,184,0.2)',
          borderRadius: '16px',
          maxWidth: '720px', width: '100%',
          maxHeight: '90vh', overflowY: 'auto',
          padding: '28px',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(148,163,184,0.1)', border: 'none',
            borderRadius: '8px', padding: '6px 12px',
            color: '#94a3b8', fontSize: '20px', cursor: 'pointer', lineHeight: 1,
          }}
        >
          ×
        </button>

        {loading && <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Chargement...</div>}
        {error && <div style={{ color: '#f87171', textAlign: 'center', padding: '40px' }}>{error}</div>}
        {session && <SessionDetail session={session} />}
      </div>
    </div>
  );
}

function SessionDetail({ session }) {
  const labels = { 1: 'Entretien dirigé', 2: 'Interaction', 3: "Expression d'un point de vue" };
  const fb = session.feedback_complet || {};
  const date = new Date(session.created_at);
  const durationMin = Math.round((session.duree_secondes || 0) / 60);

  return (
    <div>
      <div style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
        Tâche {session.tache} · {labels[session.tache] || `Tâche ${session.tache}`}
      </div>
      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
        {date.toLocaleString('fr-FR')} · {durationMin > 0 ? `${durationMin} min` : '< 1 min'}
      </div>

      {/* Note + niveau */}
      <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '12px' }}>
        <div style={{ fontSize: '32px', fontWeight: 800, color: '#f1f5f9', marginBottom: '4px' }}>
          {session.total ?? '—'}/20
        </div>
        <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
          Niveau {session.niveau_cecrl || '—'} · NCLC {session.niveau_nclc || '—'}
        </div>
      </div>

      {/* Sujet */}
      {session.sujet && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Sujet</div>
          <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.5 }}>{session.sujet}</div>
        </div>
      )}

      {/* Résumé niveau */}
      {fb.resume_niveau && (
        <div style={{ marginBottom: '20px', fontSize: '14px', color: '#cbd5e1', lineHeight: 1.65 }}>
          {fb.resume_niveau}
        </div>
      )}

      {/* Scores par critère */}
      {fb.scores && Object.keys(fb.scores).length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>Détail des critères</div>
          {Object.entries(fb.scores).map(([key, val]) => {
            const note = typeof val?.note === 'number' ? val.note : 0;
            const pct = (note / 4) * 100;
            const color = note >= 3 ? '#10b981' : note >= 2 ? '#f59e0b' : '#ef4444';
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return (
              <div key={key} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color }}>{note}/4</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '999px' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Points positifs */}
      {fb.points_positifs?.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 700, marginBottom: '8px' }}>✓ Points positifs</div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '13px', lineHeight: 1.7 }}>
            {fb.points_positifs.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      {/* Axes prioritaires */}
      <AxesPrioritaires
        axes={fb.axes_prioritaires}
        fallbackPoints={fb.points_ameliorer}
      />

      {/* Conseil prioritaire */}
      {fb.conseil_prioritaire && (
        <div style={{ padding: '14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px' }}>
          <div style={{ fontSize: '12px', color: '#93c5fd', fontWeight: 700, marginBottom: '6px' }}>💡 Conseil prioritaire</div>
          <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>{fb.conseil_prioritaire}</div>
        </div>
      )}
    </div>
  );
}

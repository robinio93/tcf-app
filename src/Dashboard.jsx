import { useState, useEffect, useMemo } from 'react';
import { useUser } from './contexts/UserContext';
import { supabase } from './lib/supabase';
import SessionDetailModal from './SessionDetailModal';

// ── Styles constants ──────────────────────────────────────────────────────────

const containerStyle = {
  display: 'flex', flexDirection: 'column', gap: '16px',
  maxWidth: '720px', margin: '0 auto', padding: '24px 18px',
};

const cardStyle = {
  background: 'rgba(15,23,42,0.55)',
  border: '1px solid rgba(148,163,184,0.12)',
  borderRadius: '16px',
  padding: '20px',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

const sectionLabel = {
  fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', marginBottom: '14px',
};

// ── Niveau mapping (aligné sur totalToCecrlNclc serveur) ─────────────────────

function computeLevel(total) {
  if (total === null || total === undefined || isNaN(total)) return { cecrl: '—', nclc: '—' };
  if (total < 4)  return { cecrl: 'A1', nclc: 3 };
  if (total < 6)  return { cecrl: 'A2', nclc: 4 };
  if (total < 7)  return { cecrl: 'B1', nclc: 5 };
  if (total < 10) return { cecrl: 'B1', nclc: 6 };
  if (total < 12) return { cecrl: 'B2', nclc: 7 };
  if (total < 14) return { cecrl: 'B2', nclc: 8 };
  if (total < 16) return { cecrl: 'C1', nclc: 9 };
  return           { cecrl: 'C1', nclc: 10 };
}

// ── Stats calculées depuis les sessions ────────────────────────────────────────

function computeStats(sessions, userProfile) {
  const objectiveNclc = userProfile?.nclc_cible || 7;

  if (!sessions || sessions.length === 0) {
    return { currentLevel: null, currentNclc: null, objectiveNclc, totalSessions: 0, totalMinutes: 0, averageScore: null, lastSessions: [] };
  }

  const recent = sessions.slice(0, 5);
  const weights = [5, 4, 3, 2, 1];
  let weightedSum = 0, totalWeight = 0;
  recent.forEach((s, i) => {
    if (typeof s.total === 'number') {
      weightedSum += s.total * weights[i];
      totalWeight += weights[i];
    }
  });
  const avg = totalWeight > 0 ? weightedSum / totalWeight : null;
  const { cecrl, nclc } = computeLevel(avg);

  return {
    currentLevel: cecrl,
    currentNclc: nclc,
    objectiveNclc,
    totalSessions: sessions.length,
    totalMinutes: Math.round(sessions.reduce((sum, s) => sum + (s.duree_secondes || 0), 0) / 60),
    averageScore: avg !== null ? avg.toFixed(1) : null,
    lastSessions: recent.map(s => ({ score: s.total, tache: s.tache, date: s.created_at })),
  };
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function Dashboard({ onStartNewSession }) {
  const { betaCode, userProfile } = useUser();
  const [sessions, setSessions] = useState([]);
  const [banksStats, setBanksStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      if (!betaCode) return;
      setLoading(true);
      setError(null);
      try {
        const [sessionsRes, banksRes] = await Promise.all([
          fetch('/api/get-user-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ betaCode }),
          }).then(r => r.json()),
          fetch('/api/get-banks-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ betaCode }),
          }).then(r => r.json()),
        ]);
        if (cancelled) return;
        setSessions(sessionsRes.sessions || []);
        setBanksStats(banksRes);
      } catch {
        if (!cancelled) setError('Erreur de chargement des données.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [betaCode]);

  const stats = useMemo(() => computeStats(sessions, userProfile), [sessions, userProfile]);

  if (loading) return (
    <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#64748b', fontSize: '14px' }}>Chargement de ton dashboard...</div>
    </div>
  );

  if (error) return (
    <div style={{ ...containerStyle }}>
      <div style={{ padding: '24px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#f87171', fontSize: '14px' }}>
        {error}
      </div>
    </div>
  );

  if (sessions.length === 0) return (
    <div style={containerStyle}>
      <section style={cardStyle}>
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>
            Bienvenue sur ton tableau de bord
          </div>
          <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px', lineHeight: 1.6 }}>
            Fais ta première session d&rsquo;expression orale pour voir ta progression apparaître ici.
          </div>
          <button
            onClick={onStartNewSession}
            style={{
              padding: '14px 28px', borderRadius: '12px', border: 'none',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white', boxShadow: '0 8px 20px rgba(139,92,246,0.3)',
            }}
          >
            Commencer ma première session →
          </button>
        </div>
      </section>
    </div>
  );

  return (
    <div style={containerStyle}>
      <ModuleHero stats={stats} />
      <ModuleCountdown userProfile={userProfile} />
      <ModuleGlobalStats stats={stats} />
      <ModuleRecentTrend sessions={sessions} />
      <ModulePerTask sessions={sessions} />
      <ModuleBanks banksStats={banksStats} />
      <ModuleHistory sessions={sessions} onSelect={setSelectedSessionId} />
      <div style={{ marginTop: '8px' }}>
        <button
          onClick={onStartNewSession}
          style={{
            width: '100%', padding: '18px', borderRadius: '14px', border: 'none',
            fontSize: '16px', fontWeight: 700, cursor: 'pointer',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: 'white', boxShadow: '0 8px 24px rgba(139,92,246,0.35)',
            transition: 'all 0.2s',
          }}
        >
          Faire une nouvelle session →
        </button>
      </div>

      {selectedSessionId && (
        <SessionDetailModal
          sessionId={selectedSessionId}
          betaCode={betaCode}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  );
}

// ── Module 1 — Hero ───────────────────────────────────────────────────────────

function ModuleHero({ stats }) {
  const { currentNclc, currentLevel, objectiveNclc } = stats;
  const numericNclc = typeof currentNclc === 'number' ? currentNclc : null;
  const gap = numericNclc !== null ? Math.max(0, objectiveNclc - numericNclc) : null;

  let gapMessage;
  if (gap === null) {
    gapMessage = 'Pas encore de niveau évalué — fais une session pour démarrer';
  } else if (gap === 0) {
    gapMessage = '🎉 Tu as atteint ton objectif !';
  } else if (objectiveNclc - numericNclc < 0) {
    gapMessage = '🚀 Tu dépasses ton objectif !';
  } else {
    gapMessage = `Il te manque ${gap} niveau${gap > 1 ? 'x' : ''} pour ton objectif`;
  }

  const progressPercent = numericNclc !== null ? Math.min(100, (numericNclc / objectiveNclc) * 100) : 0;

  return (
    <section style={cardStyle}>
      <div style={{ ...sectionLabel, color: '#8b5cf6' }}>Niveau actuel</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 'clamp(36px, 7vw, 56px)', fontWeight: 800, color: '#f1f5f9', lineHeight: 1, letterSpacing: '-0.03em' }}>
          {currentLevel || '—'} <span style={{ color: '#8b5cf6' }}>/ NCLC {currentNclc || '—'}</span>
        </div>
        <div style={{ fontSize: '14px', color: '#94a3b8' }}>
          Objectif : NCLC {objectiveNclc}
        </div>
      </div>
      <div style={{ height: '8px', background: 'rgba(148,163,184,0.15)', borderRadius: '999px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)', transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ fontSize: '14px', color: '#cbd5e1' }}>{gapMessage}</div>
    </section>
  );
}

// ── Module 2 — Countdown ──────────────────────────────────────────────────────

function ModuleCountdown({ userProfile }) {
  const { betaCode, refreshProfile } = useUser();
  const [editingDate, setEditingDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  async function handleSaveDate() {
    if (!editingDate) return;
    setSaving(true);
    setSaveError(null);
    const { error: dbErr } = await supabase
      .from('beta_testers')
      .update({ date_examen_prevu: editingDate })
      .eq('code', betaCode);
    if (dbErr) {
      setSaveError("Impossible d'enregistrer. Réessaie.");
      setSaving(false);
      return;
    }
    await refreshProfile();
    setSaving(false);
  }

  if (!userProfile?.date_examen_prevu) {
    const todayStr = new Date().toISOString().split('T')[0];
    return (
      <section style={cardStyle}>
        <div style={{ ...sectionLabel, color: '#94a3b8' }}>📅 Examen</div>
        <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '14px' }}>
          Renseigne ta date d'examen pour activer ton compte à rebours.
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            lang="fr-FR"
            min={todayStr}
            value={editingDate}
            onChange={(e) => setEditingDate(e.target.value)}
            disabled={saving}
            style={{
              background: 'rgba(255,255,255,0.06)', color: '#f1f5f9',
              border: '1px solid rgba(148,163,184,0.22)', borderRadius: '10px',
              padding: '10px 14px', fontSize: '15px', outline: 'none',
              cursor: 'pointer', colorScheme: 'dark',
            }}
          />
          <button
            onClick={handleSaveDate}
            disabled={saving || !editingDate}
            style={{
              padding: '10px 18px', borderRadius: '10px', border: 'none',
              background: editingDate && !saving ? '#8b5cf6' : 'rgba(139,92,246,0.3)',
              color: 'white', fontSize: '14px', fontWeight: 600,
              cursor: editingDate && !saving ? 'pointer' : 'not-allowed',
              opacity: editingDate && !saving ? 1 : 0.6,
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
        {saveError && (
          <div style={{ color: '#f87171', fontSize: '13px', marginTop: '10px' }}>
            {saveError}
          </div>
        )}
      </section>
    );
  }

  const examDate = new Date(userProfile.date_examen_prevu);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  examDate.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

  let color, message;
  if (daysLeft < 0) {
    color = '#64748b';
    message = `Examen passé il y a ${Math.abs(daysLeft)} jour${Math.abs(daysLeft) > 1 ? 's' : ''}`;
  } else if (daysLeft === 0) {
    color = '#ef4444';
    message = "C'est aujourd'hui ! Tu vas y arriver 💪";
  } else if (daysLeft <= 7) {
    color = '#ef4444';
    message = `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''} — Sprint final`;
  } else if (daysLeft <= 30) {
    color = '#f59e0b';
    message = `${daysLeft} jours restants — Phase d'intensification`;
  } else {
    color = '#10b981';
    message = `${daysLeft} jours restants`;
  }

  return (
    <section style={{ ...cardStyle, borderColor: `${color}33` }}>
      <div style={{ ...sectionLabel, color }}>📅 Compte à rebours</div>
      <div style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, color, marginBottom: '8px', lineHeight: 1 }}>
        {daysLeft >= 0 ? `J-${daysLeft}` : '—'}
      </div>
      <div style={{ fontSize: '14px', color: '#cbd5e1' }}>{message}</div>
    </section>
  );
}

// ── Module 3 — Stats globales ─────────────────────────────────────────────────

function ModuleGlobalStats({ stats }) {
  return (
    <section style={cardStyle}>
      <div style={{ ...sectionLabel, color: '#94a3b8' }}>Statistiques</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <StatBlock label="Sessions" value={stats.totalSessions} />
        <StatBlock label="Min parlées" value={stats.totalMinutes} />
        <StatBlock label="Score moyen" value={stats.averageScore !== null ? `${stats.averageScore}/20` : '—'} />
      </div>
    </section>
  );
}

function StatBlock({ label, value }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 8px' }}>
      <div style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: '#f1f5f9', lineHeight: 1, marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  );
}

// ── Module 4 — Tendance récente ───────────────────────────────────────────────

function ModuleRecentTrend({ sessions }) {
  const last5 = sessions.slice(0, 5);
  if (last5.length < 2) return null;

  const trend = last5.length >= 3
    ? (last5[0].total > last5[last5.length - 1].total ? 'up' : last5[0].total < last5[last5.length - 1].total ? 'down' : 'stable')
    : null;

  const trendIcon = trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '→';
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#94a3b8';
  const trendMessage = trend === 'up' ? 'Tu progresses' : trend === 'down' ? 'Garde le rythme' : 'Score stable';

  return (
    <section style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ ...sectionLabel, marginBottom: 0, color: '#94a3b8' }}>Tendance</div>
        <div style={{ fontSize: '13px', color: trendColor, fontWeight: 600 }}>{trendIcon} {trendMessage}</div>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        {[...last5].reverse().map((s, i) => (
          <div key={i} style={{
            flex: 1, background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '8px', padding: '10px 4px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>{s.total ?? '—'}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>T{s.tache}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Module 5 — Performance par tâche ─────────────────────────────────────────

function ModulePerTask({ sessions }) {
  const colors = { 1: '#10b981', 2: '#f59e0b', 3: '#3b82f6' };
  const labels = { 1: 'Entretien dirigé', 2: 'Interaction', 3: 'Point de vue' };

  const byTache = [1, 2, 3].map(tache => {
    const filtered = sessions.filter(s => s.tache === tache);
    const count = filtered.length;
    const avg = count > 0 ? filtered.reduce((sum, s) => sum + (s.total || 0), 0) / count : null;
    return { tache, count, avg };
  });

  const validTaches = byTache.filter(t => t.count > 0);
  const weakest = validTaches.length > 1
    ? validTaches.reduce((min, curr) => curr.avg < min.avg ? curr : min)
    : null;

  return (
    <section style={cardStyle}>
      <div style={{ ...sectionLabel, color: '#94a3b8' }}>Par tâche</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: weakest ? '12px' : 0 }}>
        {byTache.map(({ tache, count, avg }) => (
          <div key={tache} style={{
            background: 'rgba(15,23,42,0.4)',
            border: `1px solid ${colors[tache]}33`,
            borderRadius: '10px', padding: '12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '11px', color: colors[tache], fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>T{tache}</div>
            <div style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 800, color: '#f1f5f9', marginBottom: '2px' }}>
              {avg !== null ? `${avg.toFixed(1)}/20` : '—'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>{count} session{count !== 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>
      {weakest && (
        <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '12px', padding: '10px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px' }}>
          💡 <strong>{labels[weakest.tache]}</strong> est ton point faible (moyenne {weakest.avg.toFixed(1)}/20). Concentre-toi dessus.
        </div>
      )}
    </section>
  );
}

// ── Module 6 — Sujets pratiqués ───────────────────────────────────────────────

function ModuleBanks({ banksStats }) {
  if (!banksStats) return null;
  const { t2, t3 } = banksStats;

  return (
    <section style={cardStyle}>
      <div style={{ ...sectionLabel, color: '#94a3b8' }}>Sujets pratiqués</div>
      <BankRow label="Scénarios T2 — Interaction" practiced={t2.practiced} total={t2.total} color="#f59e0b" />
      <div style={{ height: '12px' }} />
      <BankRow label="Sujets T3 — Point de vue" practiced={t3.practiced} total={t3.total} color="#3b82f6" />
    </section>
  );
}

function BankRow({ label, practiced, total, color }) {
  const percent = total > 0 ? (practiced / total) * 100 : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ fontSize: '13px', color: '#cbd5e1' }}>{label}</div>
        <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 700 }}>{practiced} / {total}</div>
      </div>
      <div style={{ height: '6px', background: 'rgba(148,163,184,0.15)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: color, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ── Module 7 — Historique ─────────────────────────────────────────────────────

function ModuleHistory({ sessions, onSelect }) {
  if (sessions.length === 0) return null;
  const colors = { 1: '#10b981', 2: '#f59e0b', 3: '#3b82f6' };
  const labels = { 1: 'T1 Entretien', 2: 'T2 Interaction', 3: 'T3 Point de vue' };

  return (
    <section style={cardStyle}>
      <div style={{ ...sectionLabel, color: '#94a3b8' }}>Historique</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sessions.slice(0, 10).map(s => {
          const date = new Date(s.created_at);
          const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
          const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          return (
            <button key={s.id} onClick={() => onSelect(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px', borderRadius: '10px', textAlign: 'left',
              background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(148,163,184,0.1)',
              cursor: 'pointer', transition: 'all 0.15s', color: 'inherit',
            }}>
              <div style={{ flexShrink: 0, width: '6px', height: '38px', borderRadius: '4px', background: colors[s.tache] || '#64748b' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '2px' }}>
                  {labels[s.tache] || `Tâche ${s.tache}`}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {dateStr} à {timeStr} · {Math.round((s.duree_secondes || 0) / 60)} min
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>{s.total ?? '—'}/20</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{s.niveau_cecrl || '—'}</div>
              </div>
            </button>
          );
        })}
      </div>
      {sessions.length > 10 && (
        <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '12px' }}>
          {sessions.length - 10} session{sessions.length - 10 > 1 ? 's' : ''} de plus en historique
        </div>
      )}
    </section>
  );
}

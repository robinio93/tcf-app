import { supabaseServer } from './_lib/supabase-server.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { betaCode } = req.body || {};

  if (!betaCode || typeof betaCode !== 'string') {
    return res.status(400).json({ error: 'betaCode required' });
  }

  try {
    const [{ count: totalT2 }, { count: totalT3 }] = await Promise.all([
      supabaseServer.from('scenario_references').select('*', { count: 'exact', head: true }),
      supabaseServer.from('task3_references').select('*', { count: 'exact', head: true }),
    ]);

    if (betaCode === 'DEV-MODE') {
      return res.status(200).json({
        t2: { total: totalT2 || 0, practiced: 0, practicedTitles: [] },
        t3: { total: totalT3 || 0, practiced: 0, practicedSujets: [] },
      });
    }

    // T3 : sujets distincts pratiqués (via sessions.sujet)
    const { data: t3Sessions } = await supabaseServer
      .from('sessions')
      .select('sujet')
      .eq('beta_code', betaCode)
      .eq('tache', 3)
      .not('sujet', 'is', null);

    const t3PracticedSujets = [...new Set((t3Sessions || []).map(s => s.sujet).filter(Boolean))];

    // T2 : titres distincts pratiqués (sessions.sujet contient le titre du scénario)
    const { data: t2Sessions } = await supabaseServer
      .from('sessions')
      .select('sujet')
      .eq('beta_code', betaCode)
      .eq('tache', 2)
      .not('sujet', 'is', null);

    const t2PracticedTitles = [...new Set((t2Sessions || []).map(s => s.sujet).filter(Boolean))];

    return res.status(200).json({
      t2: { total: totalT2 || 0, practiced: t2PracticedTitles.length, practicedTitles: t2PracticedTitles },
      t3: { total: totalT3 || 0, practiced: t3PracticedSujets.length, practicedSujets: t3PracticedSujets },
    });
  } catch (err) {
    console.error('[get-banks-stats] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

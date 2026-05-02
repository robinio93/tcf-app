import { supabaseServer } from './_lib/supabase-server.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { betaCode } = req.body || {};

  if (!betaCode || typeof betaCode !== 'string') {
    return res.status(400).json({ error: 'betaCode required' });
  }

  if (betaCode === 'DEV-MODE') {
    return res.status(200).json({ sessions: [], totalSessions: 0 });
  }

  try {
    const { data: tester, error: testerError } = await supabaseServer
      .from('beta_testers')
      .select('code')
      .eq('code', betaCode)
      .single();

    if (testerError || !tester) {
      return res.status(403).json({ error: 'Invalid beta code' });
    }

    const { data: sessions, error: sessionsError } = await supabaseServer
      .from('sessions')
      .select(`
        id,
        tache,
        sujet,
        total,
        niveau_cecrl,
        niveau_nclc,
        feedback_complet,
        duree_secondes,
        prompt_version,
        model_used,
        audit_status,
        created_at
      `)
      .eq('beta_code', betaCode)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('[get-user-sessions] Error fetching sessions:', sessionsError);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }

    return res.status(200).json({
      sessions: sessions || [],
      totalSessions: sessions?.length || 0,
    });

  } catch (err) {
    console.error('[get-user-sessions] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

import { supabaseServer } from './_lib/supabase-server.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { betaCode, sessionId } = req.body || {};

  if (!betaCode || typeof betaCode !== 'string') {
    return res.status(400).json({ error: 'betaCode required' });
  }
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId required' });
  }

  if (betaCode === 'DEV-MODE') {
    return res.status(200).json({ session: null });
  }

  try {
    const { data: session, error } = await supabaseServer
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('beta_code', betaCode)
      .single();

    if (error || !session) {
      return res.status(404).json({ error: 'Session not found or access denied' });
    }

    return res.status(200).json({ session });
  } catch (err) {
    console.error('[get-session-detail] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

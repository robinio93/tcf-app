import { supabaseServer } from './_lib/supabase-server.js';

// Endpoint de validation Phase 2 — à supprimer après confirmation en prod
export default async function handler(req, res) {
  try {
    const { data: testers, error: testersError } = await supabaseServer
      .from('beta_testers')
      .select('code')
      .limit(1);

    if (testersError) {
      return res.status(500).json({
        success: false,
        step: 'beta_testers query',
        error: testersError.message,
      });
    }

    const { data: prompts, error: promptsError } = await supabaseServer
      .from('prompt_versions')
      .select('tache, version_number, is_active')
      .eq('is_active', true)
      .order('tache');

    if (promptsError) {
      return res.status(500).json({
        success: false,
        step: 'prompt_versions query',
        error: promptsError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Supabase server config OK',
      beta_testers_accessible: true,
      sample_count: testers?.length || 0,
      active_prompts: prompts || [],
      env_check: {
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'set' : 'MISSING',
        SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'MISSING',
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      step: 'unknown',
      error: err.message,
    });
  }
}

import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_SERVICE_KEY env variable is not set');
}

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL env variable is not set');
}

export const supabaseServer = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Récupère la version active du prompt pour une tâche donnée.
 * Retourne { version_number, system_prompt, model_used } ou null si aucune.
 */
export async function getActivePromptVersion(tache) {
  const { data, error } = await supabaseServer
    .from('prompt_versions')
    .select('version_number, system_prompt, model_used')
    .eq('tache', tache)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error(`[getActivePromptVersion] Error fetching prompt for tache ${tache}:`, error);
    return null;
  }

  return data;
}

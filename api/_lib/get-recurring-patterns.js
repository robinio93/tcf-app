// api/_lib/get-recurring-patterns.js
// Détecte les patterns récurrents d'un candidat sur ses 3 dernières sessions

import { supabaseServer } from './supabase-server.js';

/**
 * Règle de récurrence : une catégorie est "récurrente" si :
 *   - apparaît dans ≥ 2 sessions distinctes parmi les 3 dernières
 *   - OU ≥ 4 occurrences au total sur les 3 dernières sessions
 *
 * Retourne TOP 3 catégories pour affichage candidat.
 */
export async function getRecurringPatterns(betaCode) {
  const { data: sessions } = await supabaseServer
    .from('sessions')
    .select('id, created_at')
    .eq('beta_code', betaCode)
    .order('created_at', { ascending: false })
    .limit(3);

  if (!sessions || sessions.length < 2) return null;

  const oldestDate = sessions[sessions.length - 1].created_at;
  const { data: erreurs } = await supabaseServer
    .from('erreurs_observees')
    .select('categorie, sous_categorie, gravite, created_at')
    .eq('beta_code', betaCode)
    .gte('created_at', oldestDate);

  if (!erreurs || erreurs.length === 0) return null;

  const stats = {};
  erreurs.forEach(e => {
    if (!stats[e.categorie]) {
      stats[e.categorie] = { count: 0, gravites: [], sous_cats: new Set() };
    }
    stats[e.categorie].count += 1;
    stats[e.categorie].gravites.push(e.gravite);
    stats[e.categorie].sous_cats.add(e.sous_categorie);
  });

  const scored = Object.entries(stats).map(([categorie, s]) => {
    const bloquantes = s.gravites.filter(g => g === 'bloquante').length;
    const moyennes = s.gravites.filter(g => g === 'moyenne').length;
    const score = s.count + bloquantes * 2 + moyennes * 1;
    return {
      categorie,
      occurrences: s.count,
      bloquantes,
      sous_categories_distinctes: s.sous_cats.size,
      score,
    };
  });

  const recurrents = scored.filter(s => s.occurrences >= 2);

  if (recurrents.length === 0) return null;

  const top3 = recurrents
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    nb_sessions_analysees: sessions.length,
    patterns: top3.map(p => ({
      categorie: p.categorie,
      occurrences: p.occurrences,
      sessions_count: Math.min(p.sous_categories_distinctes + 1, sessions.length),
      gravite_dominante: p.bloquantes > 0 ? 'bloquante' : 'moyenne',
    })),
  };
}

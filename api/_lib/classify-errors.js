// api/_lib/classify-errors.js
// Classification automatique des erreurs via Haiku 4.5
// Stockage dans erreurs_observees avec schéma riche

import Anthropic from '@anthropic-ai/sdk';
import { supabaseServer } from './supabase-server.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CLASSIFIER_MODEL = 'claude-haiku-4-5-20251001';
const CLASSIFIER_VERSION = 1;

// ─── Taxonomie 36 sous_catégories regroupées en 6 catégories macro ──────────
const TAXONOMIE = {
  'Accords et conjugaisons': {
    critere_fei: 'grammaire',
    sous_categories: [
      'accord_sujet_verbe',
      'conjugaison_temps_simples',
      'conjugaison_passe_compose',
      'subjonctif_absent_ou_incorrect',
      'genre_nombre_noms_adjectifs',
    ],
  },
  'Vocabulaire trop simple': {
    critere_fei: 'lexique',
    sous_categories: [
      'repetition_lexicale',
      'vocabulaire_imprecis',
      'niveau_lexical_basique',
      'champ_lexical_thematique_absent',
      'anglicisme',
    ],
  },
  'Structure de discours': {
    critere_fei: 'interaction_coherence',
    sous_categories: [
      'connecteurs_basiques_uniquement',
      'connecteurs_logiques_pauvres',
      'structure_globale_absente',
      'structure_phrase_simple',
      'pronoms_relatifs_et_complements',
    ],
  },
  'Développement insuffisant': {
    critere_fei: 'realisation_tache',
    sous_categories: [
      'reponses_telegraphiques',
      'arguments_non_developpes',
      'absence_details_personnels',
      'exemples_concrets_absents',
      'questions_insuffisantes',
      'points_cles_scenario_oublies',
      'cloture_prematuree',
      'temps_non_exploite',
      'desequilibre_pour_contre',
      'position_personnelle_floue',
    ],
  },
  'Hésitations et fluidité': {
    critere_fei: 'fluidite_prononciation',
    sous_categories: [
      'hesitations_frequentes',
      'faux_departs',
      'formules_de_remplissage',
      'debit_lent',
      'discours_qui_tourne_en_rond',
    ],
  },
  'Registre et interaction': {
    critere_fei: 'interaction_spontaneite',
    sous_categories: [
      'registre_familier',
      'registre_inadapte_entretien',
      'rupture_cadre_officiel',
      'pas_de_rebond_examinateur',
      'passivite',
      'negation_incomplete',
    ],
  },
};

const SOUS_CATEGORIES_VALIDES = Object.values(TAXONOMIE).flatMap(t => t.sous_categories);

const MAPPING_INVERSE = {};
Object.entries(TAXONOMIE).forEach(([categorie, data]) => {
  data.sous_categories.forEach(sc => {
    MAPPING_INVERSE[sc] = { categorie, critere_fei: data.critere_fei };
  });
});

export function getCategorieFromSousCategorie(sousCategorie) {
  return MAPPING_INVERSE[sousCategorie]?.categorie || 'Autre';
}

// ─── Appel Haiku pour classifier les erreurs d'une session ──────────────────
export async function classifierErreurs(scoringJson, transcription, tache) {
  const axes = scoringJson.axes_prioritaires || [];
  if (axes.length === 0) return [];

  const SYSTEM = `Tu es un classificateur d'erreurs linguistiques pour le TCF Canada Expression Orale.
Tu reçois les axes_prioritaires d'une session déjà notée par un autre IA et tu retournes une liste structurée d'erreurs taggées avec une taxonomie fermée.

TAXONOMIE FERMÉE — utilise UNIQUEMENT ces valeurs pour sous_categorie :
${SOUS_CATEGORIES_VALIDES.map(c => `- ${c}`).join('\n')}

Pour CHAQUE erreur identifiée, tu dois remplir 6 champs :
1. sous_categorie : une seule valeur EXACTE de la taxonomie (pas de variante)
2. extrait : citation EXACTE de la transcription du candidat (entre guillemets si possible)
3. correction : la version corrigée concrète (ce que le candidat aurait dû dire)
4. regle : règle pédagogique simple en 1 phrase courte (ex : "En français formel, on dit 'nous' au lieu de 'on'.")
5. gravite : "mineure" (n'empêche pas la compréhension), "moyenne" (gêne la fluidité), "bloquante" (empêche le NCLC visé)
6. (categorie et critere_fei seront déduits automatiquement par le code)

RÈGLES STRICTES :
- Identifie 3 à 8 erreurs MAX par session (les plus impactantes)
- Pour chaque axe_prioritaire reçu en input, identifie 1 à 3 erreurs distinctes
- L'extrait DOIT être présent dans la transcription fournie (pas d'invention)
- Si tu ne peux pas trouver de citation exacte, mets extrait="" mais ne saute pas l'erreur
- Tutoie le candidat dans regle (tu, ton, tes)

FORMAT DE SORTIE — JSON strict, pas de markdown, pas de backticks :
{
  "erreurs": [
    {
      "sous_categorie": "accord_sujet_verbe",
      "extrait": "ils a fait",
      "correction": "ils ont fait",
      "regle": "Avec 'ils' (3e personne du pluriel), le verbe 'avoir' au présent se conjugue 'ont'.",
      "gravite": "moyenne"
    }
  ]
}`;

  const userPrompt = `Tâche : T${tache}
Axes prioritaires identifiés par le scoring :
${JSON.stringify(axes, null, 2)}

Transcription du candidat :
${transcription}

Classifie 3 à 8 erreurs en respectant la taxonomie fermée et le format JSON strict.`;

  try {
    const response = await anthropic.messages.create({
      model: CLASSIFIER_MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawText = response.content[0]?.text || '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const erreurs = (parsed.erreurs || [])
      .filter(e => e.sous_categorie && SOUS_CATEGORIES_VALIDES.includes(e.sous_categorie))
      .map(e => {
        const mapping = MAPPING_INVERSE[e.sous_categorie];
        return {
          sous_categorie: e.sous_categorie,
          categorie: mapping.categorie,
          critere_fei: mapping.critere_fei,
          extrait: e.extrait || '',
          correction: e.correction || '',
          regle: e.regle || '',
          gravite: ['mineure', 'moyenne', 'bloquante'].includes(e.gravite) ? e.gravite : 'moyenne',
        };
      });

    return erreurs;
  } catch (err) {
    console.warn('[classifierErreurs] Haiku échec :', err.message);
    return [];
  }
}

// ─── Insertion dans erreurs_observees ───────────────────────────────────────
export async function persistErreurs({ erreurs, betaCode, tache, langueMaternelle, niveauSession, numeroSession }) {
  if (!erreurs || erreurs.length === 0) return;

  const rows = erreurs.map(e => ({
    beta_code: betaCode,
    tache,
    categorie: e.categorie,
    sous_categorie: e.sous_categorie,
    critere_fei: e.critere_fei,
    extrait: e.extrait || null,
    correction: e.correction || null,
    regle: e.regle || null,
    gravite: e.gravite,
    classifier_model: CLASSIFIER_MODEL,
    classifier_version: CLASSIFIER_VERSION,
    langue_maternelle: langueMaternelle || null,
    niveau_session: niveauSession || null,
    numero_session: numeroSession || null,
  }));

  try {
    const { error } = await supabaseServer.from('erreurs_observees').insert(rows);
    if (error) console.warn('[persistErreurs] insert échec :', error.message);
  } catch (err) {
    console.warn('[persistErreurs] exception :', err.message);
  }
}

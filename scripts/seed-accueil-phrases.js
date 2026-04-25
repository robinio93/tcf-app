/**
 * Seed: ajoute les phrases d'accueil aux 13 scénarios de scenario_references.
 *
 * Avant de lancer ce script, exécute ce SQL dans Supabase (SQL Editor) :
 *   ALTER TABLE scenario_references
 *     ADD COLUMN IF NOT EXISTS phrases_accueil_examinateur jsonb DEFAULT '[]'::jsonb;
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xlhdakujfjmsmyvdrcdc.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error("Missing SUPABASE_SERVICE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const updates = [
  {
    numero: 1,
    titre: "S'inscrire à un centre de langue française à Montréal",
    phrases_accueil_examinateur: [
      "Bonjour, Centre Francophonie Montréal, que puis-je faire pour vous ?",
      "Bonjour, Centre de langue, je vous écoute.",
      "Bonjour, en quoi puis-je vous aider ?",
    ],
  },
  {
    numero: 2,
    titre: "Réserver une chambre dans un hôtel à Québec",
    phrases_accueil_examinateur: [
      "Bonjour, Hôtel Château Frontenac, que puis-je faire pour vous ?",
      "Bonjour, réception de l'hôtel, je vous écoute.",
      "Bonjour, Hôtel Château Frontenac, en quoi puis-je vous aider ?",
    ],
  },
  {
    numero: 3,
    titre: "S'inscrire comme bénévole dans une organisation communautaire",
    phrases_accueil_examinateur: [
      "Bonjour, Organisation Entraide Québec, que puis-je faire pour vous ?",
      "Bonjour, Organisation Entraide Québec, je vous écoute.",
      "Bonjour, en quoi puis-je vous aider ?",
    ],
  },
  {
    numero: 4,
    titre: "Prendre rendez-vous dans un cabinet dentaire à Montréal",
    phrases_accueil_examinateur: [
      "Bonjour, Cabinet Dentaire Sourire, que puis-je faire pour vous ?",
      "Bonjour, cabinet dentaire, je vous écoute.",
    ],
  },
  {
    numero: 5,
    titre: "Ouvrir un compte bancaire professionnel au Canada",
    phrases_accueil_examinateur: [
      "Bonjour, Banque Nationale du Canada, en quoi puis-je vous aider ?",
      "Bonjour, service clientèle, que puis-je faire pour vous ?",
    ],
  },
  {
    numero: 6,
    titre: "Inscrire son enfant à un camp d'été au Québec",
    phrases_accueil_examinateur: [
      "Bonjour, Centre de Loisirs Laurentides, que puis-je faire pour vous ?",
      "Bonjour, service des inscriptions, je vous écoute.",
      "Bonjour, en quoi puis-je vous aider ?",
    ],
  },
  {
    numero: 7,
    titre: "Louer une voiture pour le week-end",
    phrases_accueil_examinateur: [
      "Bonjour, AutoLocation Montréal, que puis-je faire pour vous ?",
      "Bonjour, agence de location, je vous écoute.",
    ],
  },
  {
    numero: 8,
    titre: "Ouvrir un contrat d'électricité dans son nouveau logement",
    phrases_accueil_examinateur: [
      "Bonjour, Hydro-Québec, comment puis-je vous aider ?",
      "Bonjour, service client Hydro-Québec, je vous écoute.",
    ],
  },
  {
    numero: 9,
    titre: "Renouveler un document officiel auprès d'un service administratif",
    phrases_accueil_examinateur: [
      "Bonjour, Services Canada, que puis-je faire pour vous ?",
      "Bonjour, Services Canada, en quoi puis-je vous aider ?",
    ],
  },
  {
    numero: 10,
    titre: "Signaler un bagage perdu à une compagnie de transport",
    phrases_accueil_examinateur: [
      "Bonjour, Via Rail, service des objets trouvés, que puis-je faire pour vous ?",
      "Bonjour, objets trouvés Via Rail, je vous écoute.",
    ],
  },
  {
    numero: 11,
    titre: "S'informer sur les films à l'affiche dans un cinéma",
    phrases_accueil_examinateur: [
      "Bonjour, Cinéma Quartier Latin, que puis-je faire pour vous ?",
      "Bonjour, billetterie, je vous écoute.",
      "Bonjour, en quoi puis-je vous aider ?",
    ],
  },
  {
    numero: 12,
    titre: "S'inscrire dans un club de sport de quartier",
    phrases_accueil_examinateur: [
      "Bonjour, Centre Sportif Laurier, que puis-je faire pour vous ?",
      "Bonjour, je vous écoute.",
    ],
  },
  {
    numero: 13,
    titre: "S'informer à l'office de tourisme de Québec",
    phrases_accueil_examinateur: [
      "Bonjour, Office de Tourisme de Québec, que puis-je faire pour vous ?",
      "Bonjour, bienvenue à l'office de tourisme, je vous écoute.",
    ],
  },
];

async function seed() {
  console.log(`Updating ${updates.length} scenarios with phrases d'accueil...`);
  let ok = 0;

  for (const u of updates) {
    const { error } = await supabase
      .from("scenario_references")
      .update({ phrases_accueil_examinateur: u.phrases_accueil_examinateur })
      .eq("numero", u.numero);

    if (error) {
      console.error(`  ❌ ${u.numero}. ${u.titre.substring(0, 50)} — ${error.message}`);
    } else {
      console.log(`  ✅ ${u.numero}. ${u.titre.substring(0, 55)}`);
      ok++;
    }
  }

  console.log(`\nDone: ${ok}/${updates.length} updated.`);
}

seed();

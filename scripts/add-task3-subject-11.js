import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xlhdakujfjmsmyvdrcdc.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error("Missing SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sujet11 = {
  numero: 11,
  sujet: "Dans le monde actuel, les médias peuvent manipuler volontairement notre opinion. Qu'en pensez-vous ?",
  consigne: "Donnez votre opinion personnelle sur ce sujet et justifiez-la avec au moins 2 arguments. Illustrez vos idées avec des exemples concrets.",
  categorie: "Société & Médias",
  emoji_categorie: "📰",
  arguments_pour: [
    "Concentration des médias entre les mains de quelques milliardaires (cas en France)",
    "Algorithmes des réseaux sociaux qui filtrent l'information",
    "Sélection éditoriale partisane (ligne politique des journaux)",
    "Sensationnalisme pour faire de l'audience",
    "Désinformation et fake news",
  ],
  arguments_contre: [
    "Pluralité des sources accessibles via Internet",
    "Esprit critique des lecteurs/spectateurs aujourd'hui",
    "Médias indépendants, journalisme d'investigation",
    "Régulation et déontologie journalistique",
  ],
  erreurs_typiques_b1: [
    "Confusion 'média' / 'moyen' (faux ami)",
    "'manipuler' mal conjugué",
    "Pas d'utilisation du subjonctif après 'il faut que'",
    "Vocabulaire trop simple ('c'est mauvais', 'c'est bien')",
    "Argumentation linéaire sans nuance",
    "Pas de connecteurs logiques variés",
  ],
  difference_b1_b2: "B1 : 'Je pense que les médias mentent. C'est mauvais pour les gens.' (position binaire, lexique simple) B2 : 'Je pense que les médias peuvent manipuler l'opinion, mais la vraie question est de savoir s'ils le font systématiquement. Avec Internet, le contrôle est moins fort qu'avant.' (nuance, lexique précis, structure argumentée)",
  monologue_a2: "",
  monologue_b1: "",
  monologue_b2: "",
  note_cible_a2: {},
  note_cible_b1: {},
  note_cible_b2: {},
  expressions_cles: [
    "manipuler l'opinion publique",
    "se rendre compte que",
    "racheter un journal / un média",
    "contrôler l'information",
    "avoir un monopole sur",
  ],
  connecteurs_utiles: [
    "Cause : 'à cause de cela', 'puisque', 'étant donné que'",
    "Opposition : 'mais', 'cependant', 'en revanche'",
    "Concession : 'bien sûr', 'il est vrai que'",
    "Conclusion : 'finalement', 'en somme', 'pour conclure'",
  ],
};

async function addSubject() {
  console.log("Checking if subject 11 already exists...");
  const { data: existing } = await supabase
    .from("task3_references")
    .select("numero, sujet")
    .eq("numero", 11)
    .maybeSingle();

  if (existing) {
    console.log(`Subject 11 already exists: "${existing.sujet.substring(0, 60)}..."`);
    console.log("Use upsert to overwrite, or delete manually first.");
    process.exit(0);
  }

  console.log("Inserting subject 11...");
  const { data, error } = await supabase
    .from("task3_references")
    .insert([sujet11])
    .select("numero, sujet");

  if (error) {
    console.error("Insert error:", error.message);
    process.exit(1);
  }

  console.log(`  Done: ${data[0].numero}. ${data[0].sujet.substring(0, 70)}...`);

  console.log("\nVerifying total subjects...");
  const { count } = await supabase
    .from("task3_references")
    .select("*", { count: "exact", head: true });
  console.log(`  Total subjects in task3_references: ${count}`);
}

addSubject();

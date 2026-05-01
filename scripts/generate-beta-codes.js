import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = "https://xlhdakujfjmsmyvdrcdc.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SERVICE_KEY) { console.error("Missing SUPABASE_SERVICE_KEY"); process.exit(1); }

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// Alphabet sans 0/O, 1/I, 5/S, U (confusions oral)
const CHARS = "ABCDEFGHJKLMNPQRTVWXY234679";
const CODE_COUNT = 50;

function generateCode() {
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return `TCF-${suffix}`;
}

function generateUniqueCodes(count) {
  const codes = new Set();
  while (codes.size < count) {
    codes.add(generateCode());
  }
  return [...codes];
}

async function main() {
  console.log("Génération des codes bêta...\n");

  // 1. Vérifier que beta_testers est accessible
  const { error: tableErr } = await sb.from("beta_testers").select("code").limit(1);
  if (tableErr) {
    console.error("❌ Table beta_testers inaccessible:", tableErr.message);
    console.error("→ Exécutez d'abord scripts/migrate-beta-schema.sql dans Supabase Dashboard");
    process.exit(1);
  }

  // 2. Vérifier les codes existants pour éviter les doublons
  const { data: existing } = await sb.from("beta_testers").select("code");
  const existingCodes = new Set((existing || []).map(r => r.code));

  // 3. Générer 50 codes uniques qui ne sont pas déjà en base
  const allCodes = new Set();
  while (allCodes.size < CODE_COUNT) {
    const c = generateCode();
    if (!existingCodes.has(c) && !allCodes.has(c)) allCodes.add(c);
  }
  const codes = [...allCodes];

  // 4. Insérer les 50 codes bêta
  const betaRows = codes.map(code => ({ code, cohorte: "beta_v1" }));
  const { error: insertErr } = await sb.from("beta_testers").insert(betaRows);
  if (insertErr) {
    console.error("❌ Erreur insertion codes:", insertErr.message);
    process.exit(1);
  }
  console.log(`✓ ${CODE_COUNT} codes insérés en Supabase (cohorte: beta_v1)`);

  // 5. Insérer DEV-MODE si absent
  if (!existingCodes.has("DEV-MODE")) {
    const { error: devErr } = await sb.from("beta_testers").insert([{ code: "DEV-MODE", cohorte: "dev" }]);
    if (devErr) console.warn("⚠️ DEV-MODE déjà présent ou erreur:", devErr.message);
    else console.log("✓ Code DEV-MODE inséré (cohorte: dev)");
  } else {
    console.log("✓ Code DEV-MODE déjà présent");
  }

  // 6. Vérification finale
  const { count: totalBeta } = await sb.from("beta_testers")
    .select("*", { count: "exact", head: true })
    .eq("cohorte", "beta_v1");
  const { count: totalDev } = await sb.from("beta_testers")
    .select("*", { count: "exact", head: true })
    .eq("cohorte", "dev");
  console.log(`✓ beta_testers: ${totalBeta} codes beta_v1, ${totalDev} code(s) dev`);

  // 7. Vérifier pas de doublons
  const { data: allRows } = await sb.from("beta_testers").select("code").eq("cohorte", "beta_v1");
  const uniqueCheck = new Set(allRows.map(r => r.code));
  if (uniqueCheck.size !== allRows.length) {
    console.error("❌ Doublons détectés !");
  } else {
    console.log("✓ Aucun doublon détecté");
  }

  // 8. Générer le fichier Excel
  const wb = XLSX.utils.book_new();

  const headers = ["N°", "Code accès", "Nom (privé)", "Email/Contact", "Date envoi", "Source", "Notes", "Statut"];
  const rows = codes.map((code, i) => [
    i + 1,
    code,
    "",
    "",
    "",
    "",
    "",
    "🟡 À distribuer",
  ]);

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Largeurs de colonnes
  ws["!cols"] = [
    { wch: 5 },   // N°
    { wch: 14 },  // Code accès
    { wch: 22 },  // Nom
    { wch: 28 },  // Email
    { wch: 14 },  // Date envoi
    { wch: 16 },  // Source
    { wch: 24 },  // Notes
    { wch: 18 },  // Statut
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Codes Bêta v1");

  // Sauvegarder dans scripts/
  const localPath = join(__dir, "beta-codes-export.xlsx");
  XLSX.writeFile(wb, localPath);
  console.log(`✓ Excel exporté → ${localPath}`);

  // Sauvegarder dans /mnt/user-data/outputs/ si accessible
  try {
    const outputDir = "/mnt/user-data/outputs";
    if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
    const outputPath = join(outputDir, "beta-codes-export.xlsx");
    XLSX.writeFile(wb, outputPath);
    console.log(`✓ Excel exporté → ${outputPath}`);
  } catch {
    console.log("ℹ  /mnt/user-data/outputs/ inaccessible (normal sur Windows) — seule la copie locale est disponible");
  }

  // Aperçu des 5 premiers codes
  console.log("\nAperçu des 5 premiers codes :");
  codes.slice(0, 5).forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
  console.log(`  ...et ${codes.length - 5} autres`);
}

main().catch(console.error);

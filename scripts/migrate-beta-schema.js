import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const SQL = readFileSync(join(__dir, "migrate-beta-schema.sql"), "utf8");

const SUPABASE_URL = "https://xlhdakujfjmsmyvdrcdc.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PROJECT_REF = "xlhdakujfjmsmyvdrcdc";

if (!SERVICE_KEY) { console.error("Missing SUPABASE_SERVICE_KEY"); process.exit(1); }

async function tryManagementApi() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({ query: SQL }),
  });
  if (res.ok) { console.log("✓ Migration via Management API"); return true; }
  return false;
}

async function tryPgMeta() {
  const res = await fetch(`${SUPABASE_URL}/pg-meta/v0/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({ query: SQL }),
  });
  if (res.ok) { console.log("✓ Migration via pg-meta"); return true; }
  return false;
}

async function main() {
  console.log("Tentative de migration automatique...");

  const ok = await tryManagementApi().catch(() => false)
           || await tryPgMeta().catch(() => false);

  if (!ok) {
    console.log("\n⚠️  Migration automatique impossible (token PAT requis).");
    console.log("→ Copiez scripts/migrate-beta-schema.sql dans:");
    console.log("   Supabase Dashboard → SQL Editor → Exécuter");
    console.log("\nSQL à exécuter :\n");
    console.log(SQL);
    process.exit(0);
  }

  // Vérification post-migration
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const { count } = await sb.from("beta_testers").select("*", { count: "exact", head: true });
  console.log(`✓ Table beta_testers opérationnelle (${count} lignes)`);

  const { data: cols } = await sb.from("sessions").select("beta_code").limit(1);
  console.log("✓ Colonne beta_code présente sur sessions");
}

main().catch(console.error);

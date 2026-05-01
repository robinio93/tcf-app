-- ═══════════════════════════════════════════════════════════
-- MIGRATION BÊTA — TCF Speaking AI
-- Coller dans Supabase Dashboard → SQL Editor et exécuter
-- ═══════════════════════════════════════════════════════════

-- 1. Recréer beta_testers proprement
DROP TABLE IF EXISTS beta_testers CASCADE;

CREATE TABLE beta_testers (
  code                    TEXT PRIMARY KEY,
  cohorte                 TEXT DEFAULT 'beta_v1',
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  first_used_at           TIMESTAMPTZ,
  last_used_at            TIMESTAMPTZ,
  total_sessions          INT DEFAULT 0,
  objectif                TEXT,
  familiarite             TEXT,
  timeline                TEXT,
  onboarding_completed_at TIMESTAMPTZ,
  email_optionnel         TEXT,
  email_donne_at          TIMESTAMPTZ
);

CREATE INDEX idx_beta_testers_code ON beta_testers(code);

-- 2. Ajouter beta_code sur sessions (NULL autorisé — 74 sessions historiques)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS beta_code TEXT;

-- 3. FK avec DELETE SET NULL (sessions historiques restent intactes)
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS fk_beta_code;
ALTER TABLE sessions ADD CONSTRAINT fk_beta_code
  FOREIGN KEY (beta_code) REFERENCES beta_testers(code)
  ON DELETE SET NULL;

-- 4. Fonction atomique increment_beta_sessions (évite race condition)
CREATE OR REPLACE FUNCTION increment_beta_sessions(p_code TEXT)
RETURNS void AS $$
  UPDATE beta_testers
  SET total_sessions = total_sessions + 1,
      last_used_at   = NOW()
  WHERE code = p_code;
$$ LANGUAGE sql SECURITY DEFINER;

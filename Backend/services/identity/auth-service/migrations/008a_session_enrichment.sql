-- Baalvion Auth Service — Migration 008a: Session enrichment columns (EXPAND step)
-- ============================================================================
-- Identity-consolidation Phase 1. ADDITIVE + IDEMPOTENT. Adds the geo / device /
-- risk / unified-lifecycle columns to auth.sessions so the table can become the
-- single source of truth for sessions (absorbing the retired session-service's
-- enrichment fields, which were never formalized in a migration).
--
-- SAFETY CONTRACT:
--   * Every statement is `IF NOT EXISTS` — safe to run more than once.
--   * Every new column is NULLABLE (or has a constant default) — existing rows are
--     untouched, no table rewrite, no lock of consequence on Postgres 11+.
--   * NOTHING reads or writes these columns yet (that is Phase 2). This migration
--     only creates storage.
--   * This migration contains *** NO ROW LEVEL SECURITY ***. RLS is deliberately
--     deferred to a separate migration (008b) that ships only after the baalvion_app
--     role + per-request GUC write-path are proven on a clone — enabling RLS here
--     without that plumbing would filter out auth-service's own session writes and
--     break login platform-wide.
--   * Rollback = DROP COLUMN (safe precisely because nothing depends on these yet).
-- ============================================================================

SET search_path TO auth, public;

-- ── Refresh-token family linkage (unified lifecycle; lets logout/reuse revoke the
--    family directly from the session row in a later phase) ─────────────────────
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS refresh_family_id UUID;

-- ── Revocation reason (audit + reuse-detection traceability) ───────────────────
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS revoked_reason VARCHAR(48);
--   expected values: logout | refresh_reuse | password_reset | org_suspended | admin_revoke | step_up_fail | expired

-- ── Last-seen IP, distinct from creation IP (impossible-travel signal) ─────────
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS last_seen_ip VARCHAR(45);

-- ── Geo enrichment (folds in session-service utils/geo.js) ─────────────────────
-- NOTE: geo_*/device_*/risk_* below already exist on the live DB (added out-of-band by
-- the old session-service with NO migration). Sizes here MATCH those live columns so a
-- fresh database ends up identical to production; IF NOT EXISTS makes this a no-op where
-- they already exist. `geo_source` is the one genuinely-new geo column.
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS geo_country  VARCHAR(2);
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS geo_region   VARCHAR(100);
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS geo_city     VARCHAR(100);
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS geo_lat      DOUBLE PRECISION;
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS geo_lon      DOUBLE PRECISION;
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS geo_timezone VARCHAR(50);
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS geo_source   VARCHAR(24);   -- cdn-header | geoip-lite (NEW)

-- ── Device fingerprint (folds in session-service utils/deviceParser.js + the
--    gateway's SHA-256 UA/IP binding hashes) ─────────────────────────────────────
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS device_browser     VARCHAR(100);
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS device_os          VARCHAR(100);
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS device_type        VARCHAR(20);  -- desktop | mobile | tablet | bot | unknown
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(16);
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS ua_hash            VARCHAR(64);  -- NEW: gateway SHA-256(UA) binding
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS ip_hash            VARCHAR(64);  -- NEW: gateway SHA-256(IP) binding

-- ── Risk scoring (folds in session-service risk signals) ───────────────────────
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS risk_score   SMALLINT DEFAULT 0;  -- 0-100
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS risk_level   VARCHAR(10);         -- low | medium | high (NULL = never scored)
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS risk_signals JSONB DEFAULT '[]'::jsonb;

-- ── CSRF binding (folds in the gateway redisSession csrfToken) ─────────────────
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS csrf_token VARCHAR(64);

-- ── Step-up elevation (folds in the gateway step-up Redis fields) ──────────────
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS step_up_level      VARCHAR(16);   -- NULL | elevated
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS step_up_expires_at TIMESTAMPTZ;

-- ── Provenance bookkeeping (left NULL for historical rows — we do not retro-claim
--    an issuer; new writes set these explicitly in a later phase) ────────────────
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS source    VARCHAR(24);   -- auth-service | gateway | issue-on-behalf
ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS issued_by VARCHAR(48);   -- login | refresh | mfa | accept-invite | issue-on-behalf

-- ── Indexes (partial, active-session only — cheap and used by the upcoming admin
--    session panel + risk views) ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_family ON auth.sessions (refresh_family_id);
CREATE INDEX IF NOT EXISTS idx_sessions_org_active  ON auth.sessions (org_id)  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON auth.sessions (user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_risk        ON auth.sessions (risk_level) WHERE revoked_at IS NULL;

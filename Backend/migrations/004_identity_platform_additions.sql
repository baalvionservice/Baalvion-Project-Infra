-- Migration 004: Identity Platform additions
-- Adds geo/device/risk columns to sessions, OAuth tables, and API-key table.
-- Run after 001_auth_schema.sql

-- ── Session enrichment columns ────────────────────────────────────────────────
ALTER TABLE auth.sessions
    ADD COLUMN IF NOT EXISTS geo_country        VARCHAR(2),
    ADD COLUMN IF NOT EXISTS geo_region         VARCHAR(100),
    ADD COLUMN IF NOT EXISTS geo_city           VARCHAR(100),
    ADD COLUMN IF NOT EXISTS geo_lat            DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS geo_lon            DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS geo_timezone       VARCHAR(50),
    ADD COLUMN IF NOT EXISTS device_browser     VARCHAR(100),
    ADD COLUMN IF NOT EXISTS device_os          VARCHAR(100),
    ADD COLUMN IF NOT EXISTS device_type        VARCHAR(20),
    ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(16),
    ADD COLUMN IF NOT EXISTS risk_score         SMALLINT     DEFAULT 0,
    ADD COLUMN IF NOT EXISTS risk_level         VARCHAR(10)  DEFAULT 'low',
    ADD COLUMN IF NOT EXISTS risk_signals       JSONB        DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_sessions_risk_level ON auth.sessions (risk_level) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_device_fp  ON auth.sessions (device_fingerprint);

-- ── OAuth clients ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.oauth_clients (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name               VARCHAR(255) NOT NULL,
    client_id          VARCHAR(120) UNIQUE NOT NULL,
    client_secret_hash TEXT,
    redirect_uris      JSONB        NOT NULL DEFAULT '[]',
    grant_types        JSONB        NOT NULL DEFAULT '["authorization_code"]',
    scopes             JSONB        NOT NULL DEFAULT '["openid"]',
    is_confidential    BOOLEAN      NOT NULL DEFAULT TRUE,
    owner_id           BIGINT       REFERENCES auth.users(id) ON DELETE SET NULL,
    org_id             UUID         REFERENCES auth.organizations(id) ON DELETE SET NULL,
    revoked_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_clients_owner ON auth.oauth_clients (owner_id);

-- ── OAuth authorization codes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.oauth_authorization_codes (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id        VARCHAR(120) NOT NULL,
    user_id          BIGINT       NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id           UUID,
    code_hash        VARCHAR(64)  UNIQUE NOT NULL,
    redirect_uri     TEXT         NOT NULL,
    scopes           JSONB        NOT NULL DEFAULT '[]',
    pkce_challenge   TEXT,
    pkce_method      VARCHAR(10),
    nonce            TEXT,
    expires_at       TIMESTAMPTZ  NOT NULL,
    used_at          TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_codes_expires ON auth.oauth_authorization_codes (expires_at) WHERE used_at IS NULL;

-- ── OAuth refresh tokens ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.oauth_refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     BIGINT       REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id      UUID,
    client_id   VARCHAR(120) NOT NULL,
    token_hash  VARCHAR(64)  UNIQUE NOT NULL,
    scopes      JSONB        NOT NULL DEFAULT '[]',
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_rt_user_id  ON auth.oauth_refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_rt_expires  ON auth.oauth_refresh_tokens (expires_at) WHERE revoked_at IS NULL;

-- ── API keys (for programmatic access / service accounts) ────────────────────
CREATE TABLE IF NOT EXISTS auth.api_keys (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     BIGINT       REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id      UUID         REFERENCES auth.organizations(id) ON DELETE CASCADE,
    name        VARCHAR(120) NOT NULL,
    key_prefix  VARCHAR(12)  NOT NULL,
    key_hash    VARCHAR(64)  NOT NULL UNIQUE,
    scopes      JSONB        NOT NULL DEFAULT '[]',
    last_used_at TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON auth.api_keys (user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_org  ON auth.api_keys (org_id)  WHERE revoked_at IS NULL;

-- ── Cleanup: auto-purge expired auth codes older than 24h (cron / pg_cron) ───
-- SELECT cron.schedule('purge-oauth-codes', '0 * * * *',
--   $$DELETE FROM auth.oauth_authorization_codes WHERE expires_at < NOW() - INTERVAL '1 day'$$);

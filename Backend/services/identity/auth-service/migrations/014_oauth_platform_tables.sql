-- Baalvion Auth Service — Migration 014: OAuth client platform tables + API keys
-- ============================================================================
-- Root-cause fix: oauth-service's clientController/clientService (GET/POST/DELETE
-- /v1/clients, secret rotation) has always queried auth.oauth_clients /
-- auth.oauth_authorization_codes / auth.oauth_refresh_tokens / auth.api_keys via
-- raw SQL — none of those tables were ever created by any migration that actually
-- runs. They were originally defined in Backend/database/migrations/
-- 004_identity_platform_additions.sql, a centralized migrations directory that
-- predates the per-service `pnpm run migrate:auth` pattern and is never executed
-- by any script, CI job, or service boot path (verified: zero references to
-- Backend/database/migrations anywhere in Backend/services or deploy/). Every call
-- into oauth-service's client-management endpoints has therefore been failing with
-- "relation auth.oauth_clients does not exist" since the identity-consolidation
-- migration moved schema ownership to auth-service's own numbered SQL chain.
--
-- The session-enrichment column block from that same orphaned file is NOT
-- reproduced here — it's already covered by 008a_session_enrichment.sql, which
-- has real ADD COLUMN IF NOT EXISTS statements for the same columns and is part
-- of the migrate chain that does run.
-- ============================================================================

SET search_path TO auth, public;

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

-- 001_backchannel_logout.sql (oauth-service's own migrations/ dir, applied
-- separately below) ALTERs this table for backchannel_logout_uri /
-- post_logout_redirect_uris — safe to run after this since it's IF NOT EXISTS.

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

-- ── API keys (programmatic access / service accounts) ────────────────────────
CREATE TABLE IF NOT EXISTS auth.api_keys (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      BIGINT       REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id       UUID         REFERENCES auth.organizations(id) ON DELETE CASCADE,
    name         VARCHAR(120) NOT NULL,
    key_prefix   VARCHAR(12)  NOT NULL,
    key_hash     VARCHAR(64)  NOT NULL UNIQUE,
    scopes       JSONB        NOT NULL DEFAULT '[]',
    last_used_at TIMESTAMPTZ,
    expires_at   TIMESTAMPTZ,
    revoked_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON auth.api_keys (user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_org  ON auth.api_keys (org_id)  WHERE revoked_at IS NULL;

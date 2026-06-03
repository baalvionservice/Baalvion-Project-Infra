-- admin-service :: developer module (Developer Platform console)
--
-- Owns three real domain tables in the dedicated `admin` schema:
--   admin.dev_webhooks            — webhook endpoint registry
--   admin.dev_webhook_deliveries  — per-event delivery attempts/results
--   admin.dev_sandboxes           — isolated sandbox environments
--
-- API-usage stats are derived LIVE from real platform data (auth.audit_logs) when
-- present, else honest zeros — no fabricated metrics, no seed rows here. The changelog
-- and SDK registry served by this module are a STATIC real catalog (returned from code,
-- not stored), so they have no tables.
--
-- Self-provisioning DDL. This file documents the schema for clean deploys; the runtime
-- equivalent is executed idempotently (and memoized) by ensureSchema() in
-- service/developerService.js. No migration runner exists in this service.
--
-- No seed rows.

CREATE SCHEMA IF NOT EXISTS admin;

-- ── Webhook endpoints ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin.dev_webhooks (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    url         TEXT         NOT NULL,
    description TEXT,
    events      JSONB        NOT NULL DEFAULT '[]'::jsonb,
    secret      TEXT         NOT NULL,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    org_id      UUID,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_webhooks_created_at
    ON admin.dev_webhooks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_webhooks_org_id
    ON admin.dev_webhooks (org_id);

-- ── Webhook deliveries ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin.dev_webhook_deliveries (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id    UUID         NOT NULL REFERENCES admin.dev_webhooks (id) ON DELETE CASCADE,
    event         TEXT         NOT NULL,
    status        TEXT         NOT NULL DEFAULT 'pending',  -- pending | success | failed | retrying
    status_code   INTEGER,
    attempts      INTEGER      NOT NULL DEFAULT 0,
    latency_ms    INTEGER,
    response_body TEXT,
    next_retry_at TIMESTAMPTZ,
    payload       JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_webhook_deliveries_webhook_id
    ON admin.dev_webhook_deliveries (webhook_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_webhook_deliveries_status
    ON admin.dev_webhook_deliveries (status);

-- ── Sandbox environments ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin.dev_sandboxes (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT         NOT NULL,
    owner       UUID,
    org_id      UUID,
    status      TEXT         NOT NULL DEFAULT 'running',  -- running | stopped | creating
    base_url    TEXT,
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_sandboxes_created_at
    ON admin.dev_sandboxes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_sandboxes_owner
    ON admin.dev_sandboxes (owner);

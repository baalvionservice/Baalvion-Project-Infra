-- admin-service :: feature-flags module
-- Self-provisioning DDL. This file documents the schema for clean deploys; the
-- runtime equivalent is executed idempotently by ensureSchema() in
-- service/featureFlagsService.js (no migration runner exists in this service).
--
-- Owns: platform feature-flag definitions for the admin console
-- (src/app/(dashboard)/feature-flags). Empty by default — no seed rows.

CREATE SCHEMA IF NOT EXISTS admin;

CREATE TABLE IF NOT EXISTS admin.feature_flags (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    key                TEXT         NOT NULL UNIQUE,
    name               TEXT         NOT NULL,
    description        TEXT,
    enabled            BOOLEAN      NOT NULL DEFAULT FALSE,
    rollout_percentage INTEGER      NOT NULL DEFAULT 100
        CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    environments       JSONB        NOT NULL DEFAULT '[]'::jsonb,
    target_org_ids     JSONB        NOT NULL DEFAULT '[]'::jsonb,
    target_user_ids    JSONB        NOT NULL DEFAULT '[]'::jsonb,
    metadata           JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Case-insensitive lookups by key are common in the console; the UNIQUE on key
-- is exact-match and authoritative. Order list newest-first.
CREATE INDEX IF NOT EXISTS idx_feature_flags_created_at ON admin.feature_flags (created_at DESC);

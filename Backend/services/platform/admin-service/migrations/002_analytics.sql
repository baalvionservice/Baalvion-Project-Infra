-- admin-service :: analytics module (READ-ONLY aggregation)
--
-- This module does NOT own any domain tables. It computes platform metrics live from
-- the shared Postgres (auth.users / auth.sessions / auth.audit_logs and, when present,
-- orders.orders_orders). The ONLY object it provisions is an OPTIONAL cache table used
-- to accelerate repeated dashboard loads — the live query result is always
-- authoritative and the cache is best-effort.
--
-- Self-provisioning DDL. This file documents the schema for clean deploys; the runtime
-- equivalent is executed idempotently (and non-fatally) by ensureSchema() in
-- service/analyticsService.js. No migration runner exists in this service.
--
-- No seed rows.

CREATE SCHEMA IF NOT EXISTS admin;

CREATE TABLE IF NOT EXISTS admin.analytics_cache (
    cache_key   TEXT         PRIMARY KEY,
    payload     JSONB        NOT NULL,
    computed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Cheap expiry sweeps for cache eviction.
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires_at
    ON admin.analytics_cache (expires_at);

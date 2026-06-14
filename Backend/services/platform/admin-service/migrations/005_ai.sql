-- admin-service :: ai module (AI Operations console)
--
-- Owns three domain tables in the dedicated `admin` schema:
--   admin.ai_agents          — configured agents (assistant / workflow / rag / tool_use)
--   admin.ai_prompts         — versioned prompt registry
--   admin.ai_inference_jobs  — inference queue + per-job token/cost accounting
--   admin.ai_model_overrides — per-model enable/cost overrides on top of the static
--                              available-model catalog (the catalog itself is code, not data)
--
-- Self-provisioning DDL. This file documents the schema for clean deploys; the runtime
-- equivalent is executed idempotently (and memoized) by ensureSchema() in
-- service/aiService.js. No migration runner exists in this service.
--
-- UUID primary keys (gen_random_uuid) + created_at/updated_at timestamptz defaults,
-- matching the auth schema style. No seed rows — empty tables + honest empty responses.

CREATE SCHEMA IF NOT EXISTS admin;

-- ── Agents ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin.ai_agents (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT         NOT NULL,
    description   TEXT,
    type          TEXT         NOT NULL DEFAULT 'assistant'
        CHECK (type IN ('assistant', 'workflow', 'rag', 'tool_use')),
    model         TEXT,
    system_prompt TEXT,
    tools         JSONB        NOT NULL DEFAULT '[]'::jsonb,
    status        TEXT         NOT NULL DEFAULT 'enabled'
        CHECK (status IN ('enabled', 'disabled')),
    config        JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_agents_created_at ON admin.ai_agents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status     ON admin.ai_agents (status);

-- ── Prompts (versioned registry) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin.ai_prompts (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT         NOT NULL,
    slug        TEXT,
    description TEXT,
    template    TEXT         NOT NULL DEFAULT '',
    model       TEXT,
    version     INTEGER      NOT NULL DEFAULT 1 CHECK (version >= 1),
    status      TEXT         NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'active', 'archived')),
    tags        TEXT[]       NOT NULL DEFAULT '{}',
    config      JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_by  TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_prompts_created_at ON admin.ai_prompts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_status     ON admin.ai_prompts (status);

-- ── Inference jobs (queue + cost accounting) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin.ai_inference_jobs (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id     UUID         REFERENCES admin.ai_agents (id) ON DELETE SET NULL,
    model        TEXT,
    provider     TEXT,
    status       TEXT         NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    priority     INTEGER      NOT NULL DEFAULT 0,
    tokens_in    INTEGER,
    tokens_out   INTEGER,
    cost_usd     NUMERIC(12, 6) NOT NULL DEFAULT 0,
    latency_ms   INTEGER,
    error        TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_inference_jobs_created_at ON admin.ai_inference_jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_inference_jobs_status     ON admin.ai_inference_jobs (status);
CREATE INDEX IF NOT EXISTS idx_ai_inference_jobs_agent_id   ON admin.ai_inference_jobs (agent_id);

-- ── Model overrides (enable/cost overrides on the static code catalog) ────────────
CREATE TABLE IF NOT EXISTS admin.ai_model_overrides (
    model_id            TEXT         PRIMARY KEY,
    enabled             BOOLEAN,
    cost_per_1k_input   NUMERIC(12, 6),
    cost_per_1k_output  NUMERIC(12, 6),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

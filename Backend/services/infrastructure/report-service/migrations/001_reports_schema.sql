-- report-service schema — report builder + runs + schedules.
CREATE SCHEMA IF NOT EXISTS reports;

CREATE TABLE IF NOT EXISTS reports.report_definitions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         VARCHAR(128),
    name           VARCHAR(160) NOT NULL,
    description    TEXT,
    category       VARCHAR(80),
    source_type    VARCHAR(16) NOT NULL DEFAULT 'query',
    datasource     VARCHAR(64) NOT NULL DEFAULT 'default',
    query_template TEXT,
    params_schema  JSONB NOT NULL DEFAULT '[]',
    columns        JSONB NOT NULL DEFAULT '[]',
    default_format VARCHAR(8) NOT NULL DEFAULT 'csv',
    status         VARCHAR(16) NOT NULL DEFAULT 'active',
    created_by     VARCHAR(64),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_report_defs_org ON reports.report_definitions (org_id);
CREATE INDEX IF NOT EXISTS idx_report_defs_status ON reports.report_definitions (status);

CREATE TABLE IF NOT EXISTS reports.report_runs (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id     UUID NOT NULL REFERENCES reports.report_definitions (id) ON DELETE CASCADE,
    org_id            VARCHAR(128),
    status            VARCHAR(16) NOT NULL DEFAULT 'pending',
    format            VARCHAR(8) NOT NULL DEFAULT 'csv',
    params            JSONB NOT NULL DEFAULT '{}',
    row_count         INTEGER,
    artifact          TEXT,
    artifact_encoding VARCHAR(8) NOT NULL DEFAULT 'utf8',
    content_type      VARCHAR(80),
    byte_size         INTEGER,
    error             TEXT,
    duration_ms       INTEGER,
    triggered_by      VARCHAR(64),
    trigger           VARCHAR(16) NOT NULL DEFAULT 'manual',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_report_runs_def ON reports.report_runs (definition_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_runs_org ON reports.report_runs (org_id, created_at DESC);

CREATE TABLE IF NOT EXISTS reports.report_schedules (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id  UUID NOT NULL REFERENCES reports.report_definitions (id) ON DELETE CASCADE,
    org_id         VARCHAR(128),
    name           VARCHAR(160),
    cadence        VARCHAR(16) NOT NULL DEFAULT 'daily',
    at_minute      INTEGER NOT NULL DEFAULT 0,
    at_hour        INTEGER NOT NULL DEFAULT 6,
    at_weekday     INTEGER,
    at_day         INTEGER,
    timezone       VARCHAR(48) NOT NULL DEFAULT 'UTC',
    format         VARCHAR(8) NOT NULL DEFAULT 'csv',
    params         JSONB NOT NULL DEFAULT '{}',
    delivery       JSONB NOT NULL DEFAULT '{}',
    enabled        BOOLEAN NOT NULL DEFAULT true,
    last_run_at    TIMESTAMPTZ,
    next_run_at    TIMESTAMPTZ,
    created_by     VARCHAR(64),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_report_sched_due ON reports.report_schedules (enabled, next_run_at);

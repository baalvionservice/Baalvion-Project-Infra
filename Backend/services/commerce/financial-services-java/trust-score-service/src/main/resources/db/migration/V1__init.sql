-- Trust Score domain: composite 0-1000 counterparty score + append-only recompute history.
-- One isolated schema per service.
CREATE SCHEMA IF NOT EXISTS trust_score;

-- Current score: exactly one row per (tenant, subject, subject_type).
CREATE TABLE IF NOT EXISTS trust_score.trust_scores (
  id              UUID PRIMARY KEY,
  tenant_id       UUID NOT NULL,
  subject_id      UUID NOT NULL,                    -- customer/supplier/org being scored
  subject_type    VARCHAR(32) NOT NULL,             -- CUSTOMER, SUPPLIER, ORGANIZATION, COUNTERPARTY
  subject_name    VARCHAR(255),
  score           INT NOT NULL,                     -- 0..1000
  band            VARCHAR(12) NOT NULL,             -- VERY_LOW, LOW, MEDIUM, HIGH, EXCELLENT
  factors         JSONB NOT NULL DEFAULT '[]',      -- [{name, weight, value, points}]
  signals         JSONB NOT NULL DEFAULT '{}',      -- the inputs that produced this score
  revision        INT NOT NULL DEFAULT 1,           -- bumped on every recompute
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP,
  UNIQUE (tenant_id, subject_id, subject_type)
);
CREATE INDEX IF NOT EXISTS idx_ts_tenant_band ON trust_score.trust_scores (tenant_id, band);
CREATE INDEX IF NOT EXISTS idx_ts_subject ON trust_score.trust_scores (tenant_id, subject_id);

-- Append-only history: one row per recompute, with the delta vs the previous score.
CREATE TABLE IF NOT EXISTS trust_score.trust_score_history (
  id              UUID PRIMARY KEY,
  tenant_id       UUID NOT NULL,
  subject_id      UUID NOT NULL,
  subject_type    VARCHAR(32) NOT NULL,
  score           INT NOT NULL,
  band            VARCHAR(12) NOT NULL,
  delta           INT NOT NULL DEFAULT 0,           -- score - previous score
  reason          VARCHAR(255),
  factors         JSONB NOT NULL DEFAULT '[]',
  created_by      VARCHAR(255),
  created_at      TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tsh_subject ON trust_score.trust_score_history (tenant_id, subject_id, subject_type, created_at DESC);

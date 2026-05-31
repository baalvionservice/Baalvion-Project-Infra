-- AML domain: transaction-monitoring alerts with FATF-aligned risk grading + case workflow.
-- One isolated schema per service. Money is numeric(19,4).
CREATE SCHEMA IF NOT EXISTS aml;

CREATE TABLE IF NOT EXISTS aml.aml_alerts (
  id                    UUID PRIMARY KEY,
  tenant_id             UUID NOT NULL,
  idempotency_key       VARCHAR(255) NOT NULL,
  reference             VARCHAR(40) NOT NULL,             -- AML-2026-AB12CD34
  subject_id            UUID,                             -- customer/account screened
  subject_name          VARCHAR(255),
  transaction_id        VARCHAR(128),
  direction             VARCHAR(10),                      -- INBOUND, OUTBOUND
  amount                NUMERIC(19,4) NOT NULL,
  currency              VARCHAR(3) NOT NULL,
  counterparty_country  VARCHAR(2),
  risk_score            NUMERIC(5,2) NOT NULL,            -- 0..100
  risk_grade            VARCHAR(10) NOT NULL,             -- LOW, MEDIUM, HIGH, CRITICAL
  triggered_rules       JSONB NOT NULL DEFAULT '[]',      -- [{code, name, points}]
  status                VARCHAR(12) NOT NULL DEFAULT 'OPEN', -- OPEN, INVESTIGATING, CLEARED, ESCALATED, SAR_FILED
  findings              TEXT,
  assigned_to           VARCHAR(255),
  details               JSONB NOT NULL DEFAULT '{}',
  created_by            VARCHAR(255),
  created_at            TIMESTAMP NOT NULL DEFAULT now(),
  updated_at            TIMESTAMP,
  resolved_at           TIMESTAMP,
  UNIQUE (tenant_id, idempotency_key),
  UNIQUE (tenant_id, reference)
);
CREATE INDEX IF NOT EXISTS idx_aml_tenant_status ON aml.aml_alerts (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_aml_subject ON aml.aml_alerts (tenant_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_aml_grade ON aml.aml_alerts (risk_grade);

CREATE SCHEMA IF NOT EXISTS risk;

ALTER SCHEMA risk OWNER TO postgres;

CREATE TABLE risk.risk_assessments (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  transaction_id uuid NOT NULL,
  source_account_id uuid NOT NULL,
  amount numeric(19, 4) NOT NULL,
  currency varchar(3) NOT NULL,
  scheme varchar(32),
  score integer NOT NULL DEFAULT 0,
  decision varchar(16) NOT NULL,          -- APPROVE, REVIEW, DECLINE
  reasons text,
  created_at timestamp NOT NULL,
  CONSTRAINT uk_risk_txn UNIQUE (transaction_id, tenant_id)
);

CREATE INDEX idx_risk_tenant_source_created ON risk.risk_assessments(tenant_id, source_account_id, created_at DESC);
CREATE INDEX idx_risk_tenant_decision ON risk.risk_assessments(tenant_id, decision, created_at DESC);
CREATE INDEX idx_risk_txn ON risk.risk_assessments(tenant_id, transaction_id);

-- Row-Level Security for multi-tenancy
ALTER TABLE risk.risk_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY risk_assessments_tenant_isolation ON risk.risk_assessments
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

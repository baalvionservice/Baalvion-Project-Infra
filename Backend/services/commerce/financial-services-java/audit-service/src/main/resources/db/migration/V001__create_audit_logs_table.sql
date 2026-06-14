CREATE SCHEMA IF NOT EXISTS finance_audit;

ALTER SCHEMA finance_audit OWNER TO postgres;

CREATE TABLE finance_audit.audit_logs (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  event_type varchar(128) NOT NULL,
  aggregate_type varchar(64),
  aggregate_id varchar(128),
  action varchar(64),
  actor varchar(128),
  source varchar(64),
  trace_id varchar(64),
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamp NOT NULL
);

CREATE INDEX idx_audit_tenant_created ON finance_audit.audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_tenant_event_type ON finance_audit.audit_logs(tenant_id, event_type, created_at DESC);
CREATE INDEX idx_audit_tenant_aggregate ON finance_audit.audit_logs(tenant_id, aggregate_id);
CREATE INDEX idx_audit_trace ON finance_audit.audit_logs(trace_id);

-- GIN index for full-text / containment queries over the JSONB payload (design §6.3)
CREATE INDEX idx_audit_payload_gin ON finance_audit.audit_logs USING GIN (payload);

-- Append-only: revoke UPDATE/DELETE so the trail is immutable even for app role.
-- (Table owner can still alter; enforce immutability at the role granted to the app.)
REVOKE UPDATE, DELETE ON finance_audit.audit_logs FROM PUBLIC;

-- Row-Level Security for multi-tenancy
ALTER TABLE finance_audit.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_tenant_isolation ON finance_audit.audit_logs
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

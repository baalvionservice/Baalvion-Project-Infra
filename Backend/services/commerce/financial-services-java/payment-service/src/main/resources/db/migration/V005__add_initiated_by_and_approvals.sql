-- ABAC ownership: who initiated each payment (design §7.1).
ALTER TABLE payments.transactions ADD COLUMN IF NOT EXISTS initiated_by varchar(128);

-- Maker-checker (4-eyes) approval requests (design §7.1).
CREATE TABLE payments.approval_requests (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  operation varchar(48) NOT NULL,           -- e.g. PAYMENT_REVERSAL
  resource_id uuid NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status varchar(16) NOT NULL DEFAULT 'PENDING',   -- PENDING, APPROVED, REJECTED
  maker_id varchar(128) NOT NULL,
  checker_id varchar(128),
  decision_reason text,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  decided_at timestamp,
  version bigint,
  CONSTRAINT check_four_eyes CHECK (checker_id IS NULL OR checker_id <> maker_id)
);

CREATE INDEX idx_approval_tenant_status ON payments.approval_requests(tenant_id, status, created_at DESC);
CREATE INDEX idx_approval_resource ON payments.approval_requests(tenant_id, resource_id);

ALTER TABLE payments.approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY approval_requests_tenant_isolation ON payments.approval_requests
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

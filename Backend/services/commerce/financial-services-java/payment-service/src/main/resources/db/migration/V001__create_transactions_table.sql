CREATE SCHEMA IF NOT EXISTS payments;

-- Enable RLS
ALTER SCHEMA payments OWNER TO postgres;

CREATE TABLE payments.transactions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  idempotency_key varchar(128) NOT NULL,
  source_account_id uuid NOT NULL,
  destination_account_id uuid NOT NULL,
  amount numeric(19, 2) NOT NULL,
  fee numeric(19, 4) NOT NULL DEFAULT 0,
  vat numeric(19, 4) NOT NULL DEFAULT 0,
  currency varchar(3) NOT NULL,
  payment_scheme varchar(32) NOT NULL,
  status varchar(32) NOT NULL,
  ledger_journal_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  failure_reason text,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  version bigint,
  CONSTRAINT uk_idempotency_key UNIQUE (idempotency_key, tenant_id),
  CONSTRAINT check_amount CHECK (amount > 0),
  CONSTRAINT check_currency CHECK (length(currency) = 3)
);

CREATE INDEX idx_tenant_status_date ON payments.transactions(tenant_id, status, created_at DESC);
CREATE INDEX idx_source_account ON payments.transactions(source_account_id, tenant_id);
CREATE INDEX idx_destination_account ON payments.transactions(destination_account_id, tenant_id);
CREATE INDEX idx_idempotency_key ON payments.transactions(idempotency_key, tenant_id);
CREATE INDEX idx_payment_scheme ON payments.transactions(payment_scheme, status);

-- Row-Level Security for multi-tenancy
ALTER TABLE payments.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY transactions_tenant_isolation ON payments.transactions
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

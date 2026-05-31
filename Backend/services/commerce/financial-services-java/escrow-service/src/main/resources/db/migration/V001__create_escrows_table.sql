CREATE SCHEMA IF NOT EXISTS escrow;

ALTER SCHEMA escrow OWNER TO postgres;

CREATE TABLE escrow.escrows (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  escrow_ref varchar(64) NOT NULL,
  source_account_id uuid NOT NULL,
  beneficiary_account_id uuid NOT NULL,
  amount numeric(19, 4) NOT NULL,
  currency varchar(3) NOT NULL,
  status varchar(32) NOT NULL,            -- HELD, RELEASED, REFUNDED, DISPUTED, EXPIRED
  release_condition varchar(32) NOT NULL, -- TIME_BASED, EVENT_BASED, MANUAL
  release_at timestamp,
  auto_release_on_expiry boolean NOT NULL DEFAULT true,
  released_at timestamp,
  refunded_at timestamp,
  dispute_reason text,
  ledger_journal_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  version bigint,
  CONSTRAINT uk_escrow_ref UNIQUE (escrow_ref, tenant_id),
  CONSTRAINT check_amount CHECK (amount > 0),
  CONSTRAINT check_currency CHECK (length(currency) = 3)
);

CREATE INDEX idx_tenant_status_date ON escrow.escrows(tenant_id, status, created_at DESC);
CREATE INDEX idx_source_account ON escrow.escrows(source_account_id, tenant_id);
CREATE INDEX idx_beneficiary_account ON escrow.escrows(beneficiary_account_id, tenant_id);
CREATE INDEX idx_release_at ON escrow.escrows(status, release_condition, release_at);

-- Row-Level Security for multi-tenancy
ALTER TABLE escrow.escrows ENABLE ROW LEVEL SECURITY;

CREATE POLICY escrows_tenant_isolation ON escrow.escrows
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE SCHEMA IF NOT EXISTS ledger;

-- Schema owner. V003/V004 rely on the app connecting AS the owner for their RLS semantics,
-- so this must be the role that actually runs the migration rather than a hardcoded name:
-- `postgres` does not exist on every deployment (the consolidated box's superuser is
-- baalvion_app), and the unguarded ALTER failed V001 outright with 42704 role does not exist.
-- CURRENT_USER is spring.flyway.user, which defaults to the same DB_USER the app connects as.
ALTER SCHEMA ledger OWNER TO CURRENT_USER;

CREATE TABLE ledger.journal_entries (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  transaction_ref varchar(64) NOT NULL,
  debit_account_id uuid NOT NULL,
  credit_account_id uuid NOT NULL,
  amount numeric(19, 4) NOT NULL,
  currency varchar(3) NOT NULL,
  entry_type varchar(32) NOT NULL,
  status varchar(32) NOT NULL,
  description text,
  related_transaction_id uuid,
  posted_at timestamp,
  reversed_at timestamp,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  version bigint,
  CONSTRAINT uk_transaction_ref UNIQUE (transaction_ref, tenant_id),
  CONSTRAINT check_amount CHECK (amount > 0),
  CONSTRAINT check_currency CHECK (length(currency) = 3)
);

CREATE INDEX idx_tenant_status_date ON ledger.journal_entries(tenant_id, status, posted_at DESC);
CREATE INDEX idx_debit_account ON ledger.journal_entries(debit_account_id, tenant_id);
CREATE INDEX idx_credit_account ON ledger.journal_entries(credit_account_id, tenant_id);
CREATE INDEX idx_tenant_date ON ledger.journal_entries(tenant_id, posted_at DESC);

-- Row-Level Security for multi-tenancy
ALTER TABLE ledger.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY journal_entries_tenant_isolation ON ledger.journal_entries
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

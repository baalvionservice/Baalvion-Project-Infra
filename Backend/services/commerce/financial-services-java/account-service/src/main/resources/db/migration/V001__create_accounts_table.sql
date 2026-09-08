CREATE SCHEMA IF NOT EXISTS accounts;

-- Schema owner. Must be the role that actually RUNS the migration, not a hardcoded name:
-- `postgres` does not exist on every deployment (the consolidated box's superuser is
-- baalvion_app), and an unguarded ALTER fails the migration outright with
-- "42704 role does not exist", leaving the service unable to start at all.
-- CURRENT_USER is spring.flyway.user, which defaults to the same DB_USER the app connects as,
-- so the RLS policies that assume "the app connects as the owner" still hold.
ALTER SCHEMA accounts OWNER TO CURRENT_USER;

CREATE TABLE accounts.accounts (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  account_number varchar(20) NOT NULL,
  account_name varchar(140),
  account_type varchar(32) NOT NULL,      -- INDIVIDUAL, BUSINESS, ESCROW, SETTLEMENT, FEE
  currency varchar(3) NOT NULL,
  balance numeric(19, 4) NOT NULL DEFAULT 0,
  ledger_balance numeric(19, 4) NOT NULL DEFAULT 0,
  kyc_status varchar(32) NOT NULL,        -- PENDING, APPROVED, REJECTED, SUSPENDED
  daily_limit numeric(19, 4) NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  version bigint,
  CONSTRAINT uk_account_number UNIQUE (account_number),
  CONSTRAINT check_currency CHECK (length(currency) = 3),
  CONSTRAINT check_daily_limit CHECK (daily_limit >= 0)
);

CREATE INDEX idx_tenant_type ON accounts.accounts(tenant_id, account_type);
CREATE INDEX idx_tenant_kyc ON accounts.accounts(tenant_id, kyc_status);
CREATE INDEX idx_tenant_created ON accounts.accounts(tenant_id, created_at DESC);

-- Row-Level Security for multi-tenancy
ALTER TABLE accounts.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY accounts_tenant_isolation ON accounts.accounts
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

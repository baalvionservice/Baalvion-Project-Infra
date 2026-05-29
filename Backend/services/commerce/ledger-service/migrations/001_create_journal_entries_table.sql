-- Migration: 001_create_journal_entries_table
-- Description: Create the immutable journal entries table for double-entry ledger

CREATE TABLE IF NOT EXISTS ledger.journal_entries (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  transaction_ref VARCHAR(64) NOT NULL,
  debit_account_id UUID NOT NULL,
  credit_account_id UUID NOT NULL,
  amount NUMERIC(19, 4) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('PAYMENT', 'FEE', 'REVERSAL', 'SETTLEMENT', 'ESCROW', 'REFUND', 'ADJUSTMENT')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'POSTED', 'REVERSED')),
  description TEXT,
  related_transaction_id UUID,
  posted_at TIMESTAMP,
  reversed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_transaction_ref UNIQUE (transaction_ref, tenant_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant_status_date
  ON ledger.journal_entries(tenant_id, status, posted_at DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_debit_account
  ON ledger.journal_entries(debit_account_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_credit_account
  ON ledger.journal_entries(credit_account_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant_date
  ON ledger.journal_entries(tenant_id, posted_at DESC);

-- Row-Level Security policy for multi-tenancy
ALTER TABLE ledger.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY ledger_entries_tenant_isolation ON ledger.journal_entries
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

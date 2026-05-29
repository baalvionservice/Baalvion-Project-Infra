-- Migration: 001_create_transactions_table
-- Description: Create transactions table for payment processing

CREATE TABLE IF NOT EXISTS payments.transactions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  idempotency_key VARCHAR(64) NOT NULL,
  source_account_id UUID NOT NULL,
  destination_account_id UUID NOT NULL,
  amount NUMERIC(19, 4) NOT NULL,
  fee NUMERIC(19, 4) NOT NULL DEFAULT 0,
  vat NUMERIC(19, 4) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  payment_scheme VARCHAR(20) NOT NULL CHECK (payment_scheme IN ('NIP', 'VISA', 'MASTERCARD', 'INTERSWITCH', 'WALLET', 'INTERNAL', 'ESCROW')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED')),
  failure_code VARCHAR(10),
  failure_reason TEXT,
  scheme_ref VARCHAR(64),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  initiated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  reversed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_idempotency_key UNIQUE (idempotency_key, tenant_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_status_date
  ON payments.transactions(tenant_id, status, initiated_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_source_account
  ON payments.transactions(source_account_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_transactions_dest_account
  ON payments.transactions(destination_account_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_transactions_tenant_date
  ON payments.transactions(tenant_id, initiated_at DESC);

-- Row-Level Security
ALTER TABLE payments.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY transactions_tenant_isolation ON payments.transactions
  USING (tenant_id = current_setting('app.current_tenant', true)::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

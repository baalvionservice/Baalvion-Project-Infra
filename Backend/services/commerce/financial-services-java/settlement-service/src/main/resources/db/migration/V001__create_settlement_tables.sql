CREATE SCHEMA IF NOT EXISTS settlement;

ALTER SCHEMA settlement OWNER TO postgres;

CREATE TABLE settlement.settlement_batches (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  batch_ref varchar(64) NOT NULL,
  scheme varchar(32) NOT NULL,            -- NIP, VISA, MASTERCARD, INTERSWITCH, WALLET
  settlement_type varchar(8) NOT NULL,    -- T0, T1
  settlement_date date NOT NULL,
  currency char(3) NOT NULL,
  total_amount numeric(19, 4) NOT NULL DEFAULT 0,
  total_fees numeric(19, 4) NOT NULL DEFAULT 0,
  net_amount numeric(19, 4) NOT NULL DEFAULT 0,
  record_count integer NOT NULL DEFAULT 0,
  status varchar(32) NOT NULL,            -- PENDING, GENERATED, SUBMITTED, RECONCILED, FAILED
  file_name varchar(128),
  file_content text,
  file_checksum varchar(64),
  generated_at timestamp,
  submitted_at timestamp,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  version bigint,
  CONSTRAINT uk_batch_ref UNIQUE (batch_ref, tenant_id),
  CONSTRAINT check_currency CHECK (length(currency) = 3)
);

CREATE INDEX idx_tenant_status_date ON settlement.settlement_batches(tenant_id, status, settlement_date DESC);
CREATE INDEX idx_tenant_scheme ON settlement.settlement_batches(tenant_id, scheme, settlement_date DESC);

CREATE TABLE settlement.settlement_items (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  transaction_id uuid NOT NULL,
  transaction_ref varchar(64),
  amount numeric(19, 4) NOT NULL,
  fee numeric(19, 4) NOT NULL,
  status varchar(32) NOT NULL,            -- PENDING, SETTLED, EXCEPTION
  created_at timestamp NOT NULL,
  CONSTRAINT fk_settlement_item_batch FOREIGN KEY (batch_id)
    REFERENCES settlement.settlement_batches(id) ON DELETE CASCADE
);

CREATE INDEX idx_item_batch ON settlement.settlement_items(batch_id, tenant_id);
CREATE INDEX idx_item_tenant_txn ON settlement.settlement_items(tenant_id, transaction_id);

-- Row-Level Security for multi-tenancy
ALTER TABLE settlement.settlement_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement.settlement_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY settlement_batches_tenant_isolation ON settlement.settlement_batches
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY settlement_items_tenant_isolation ON settlement.settlement_items
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

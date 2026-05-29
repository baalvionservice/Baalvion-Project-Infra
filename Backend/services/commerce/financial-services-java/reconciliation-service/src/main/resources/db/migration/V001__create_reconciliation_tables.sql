CREATE SCHEMA IF NOT EXISTS reconciliation;

ALTER SCHEMA reconciliation OWNER TO postgres;

CREATE TABLE reconciliation.reconciliation_runs (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  run_ref varchar(64) NOT NULL,
  source_file varchar(128),
  batch_ref varchar(64),
  total_records integer NOT NULL DEFAULT 0,
  matched_count integer NOT NULL DEFAULT 0,
  exception_count integer NOT NULL DEFAULT 0,
  unmatched_count integer NOT NULL DEFAULT 0,
  status varchar(40) NOT NULL,            -- COMPLETED, COMPLETED_WITH_EXCEPTIONS, RESOLVED
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  version bigint,
  CONSTRAINT uk_run_ref UNIQUE (run_ref, tenant_id)
);

CREATE INDEX idx_run_tenant_status_date ON reconciliation.reconciliation_runs(tenant_id, status, created_at DESC);

CREATE TABLE reconciliation.reconciliation_items (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  run_id uuid NOT NULL,
  transaction_ref varchar(64),
  internal_amount numeric(19, 4),
  external_amount numeric(19, 4),
  status varchar(32) NOT NULL,            -- MATCHED, EXCEPTION, UNMATCHED, RESOLVED
  exception_reason text,
  resolved_by varchar(128),
  resolved_at timestamp,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  version bigint,
  CONSTRAINT fk_recon_item_run FOREIGN KEY (run_id)
    REFERENCES reconciliation.reconciliation_runs(id) ON DELETE CASCADE
);

CREATE INDEX idx_item_run ON reconciliation.reconciliation_items(run_id, tenant_id);
CREATE INDEX idx_item_tenant_status ON reconciliation.reconciliation_items(tenant_id, status);
CREATE INDEX idx_item_tenant_txn_ref ON reconciliation.reconciliation_items(tenant_id, transaction_ref);

-- Row-Level Security for multi-tenancy
ALTER TABLE reconciliation.reconciliation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation.reconciliation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY recon_runs_tenant_isolation ON reconciliation.reconciliation_runs
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY recon_items_tenant_isolation ON reconciliation.reconciliation_items
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

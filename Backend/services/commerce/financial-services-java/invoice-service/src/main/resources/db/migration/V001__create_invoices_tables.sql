CREATE SCHEMA IF NOT EXISTS invoice;

ALTER SCHEMA invoice OWNER TO postgres;

-- Invoice header
CREATE TABLE invoice.invoices (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  invoice_number varchar(40) NOT NULL,
  direction varchar(16) NOT NULL,           -- RECEIVABLE, PAYABLE
  counterparty_name varchar(200),
  counterparty_id varchar(128),
  currency varchar(3) NOT NULL,
  subtotal numeric(19, 4) NOT NULL DEFAULT 0,
  tax_amount numeric(19, 4) NOT NULL DEFAULT 0,
  total numeric(19, 4) NOT NULL DEFAULT 0,
  amount_paid numeric(19, 4) NOT NULL DEFAULT 0,
  status varchar(24) NOT NULL,              -- DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED, DISPUTED
  issue_date date,
  due_date date,
  order_id varchar(128),
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  version bigint,
  CONSTRAINT uk_invoice_number_tenant UNIQUE (tenant_id, invoice_number),
  CONSTRAINT check_invoice_currency CHECK (length(currency) = 3),
  CONSTRAINT check_invoice_direction CHECK (direction IN ('RECEIVABLE', 'PAYABLE')),
  CONSTRAINT check_invoice_amounts CHECK (subtotal >= 0 AND tax_amount >= 0 AND total >= 0 AND amount_paid >= 0)
);

CREATE INDEX idx_invoice_tenant_dir_status ON invoice.invoices(tenant_id, direction, status);
CREATE INDEX idx_invoice_tenant_due ON invoice.invoices(tenant_id, due_date);
CREATE INDEX idx_invoice_tenant_created ON invoice.invoices(tenant_id, created_at DESC);

-- Invoice line items
CREATE TABLE invoice.invoice_line_items (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  description varchar(500),
  quantity numeric(19, 4) NOT NULL,
  unit_price numeric(19, 4) NOT NULL,
  line_total numeric(19, 4) NOT NULL,
  CONSTRAINT fk_line_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoice.invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_line_item_invoice ON invoice.invoice_line_items(tenant_id, invoice_id);

-- Append-only invoice audit / status log
CREATE TABLE invoice.invoice_events (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  event_type varchar(48) NOT NULL,
  from_status varchar(24),
  to_status varchar(24),
  actor varchar(200),
  detail jsonb NOT NULL DEFAULT '{}',
  created_at timestamp NOT NULL
);

CREATE INDEX idx_invoice_event_invoice ON invoice.invoice_events(tenant_id, invoice_id);
CREATE INDEX idx_invoice_event_created ON invoice.invoice_events(tenant_id, created_at DESC);

-- WORM: the invoice_events table is an immutable audit log. Reject any UPDATE or DELETE so
-- history can only ever be appended to (matches the platform's append-only audit convention).
CREATE OR REPLACE FUNCTION invoice.invoice_events_block_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'invoice.invoice_events is append-only; % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_events_worm
  BEFORE UPDATE OR DELETE ON invoice.invoice_events
  FOR EACH ROW EXECUTE FUNCTION invoice.invoice_events_block_mutation();

-- Row-Level Security for multi-tenancy
ALTER TABLE invoice.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice.invoice_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoices_tenant_isolation ON invoice.invoices
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY invoice_line_items_tenant_isolation ON invoice.invoice_line_items
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY invoice_events_tenant_isolation ON invoice.invoice_events
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

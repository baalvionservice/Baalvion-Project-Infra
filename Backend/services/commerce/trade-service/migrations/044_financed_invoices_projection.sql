-- 044 — Read-only projection of financial-services-java credit-service's invoice financing
-- (factoring/discounting), same pattern as trade.escrows/trade.payments: the Java service is the
-- write system of record (there is no trade-service write path for financing), and this table is
-- populated by the finance-events webhook (controller/internalController.js) so financing status
-- is visible against a real GTI order, closing the "receives financing" traceability gap noted in
-- gti_e2e_flow_gap_analysis.md ("FinancedInvoice has no order/deal field, zero callers").

CREATE TABLE IF NOT EXISTS trade.financed_invoices (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id text DEFAULT 'T-DEMO',
    order_id integer REFERENCES trade.orders (id),
    invoice_ref text NOT NULL,
    java_invoice_id uuid,
    seller_org_id text,
    status text NOT NULL DEFAULT 'funded',
    amount numeric(19,4),
    currency varchar(10),
    funded_at timestamptz,
    collected_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_financed_invoices_ref ON trade.financed_invoices (invoice_ref);
CREATE INDEX IF NOT EXISTS idx_financed_invoices_order ON trade.financed_invoices (order_id);

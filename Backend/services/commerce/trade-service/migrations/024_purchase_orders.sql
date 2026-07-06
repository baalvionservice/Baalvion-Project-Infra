-- 024 — Purchase Orders (Phase 1 MVP).
--
-- The spec's "Buyer generates Purchase Order after accepting quotation" step had no
-- backing entity — `trade.orders` (the fulfillment record) was being used as a
-- stand-in but has no line items, tax, or shipping/payment terms. This adds the
-- missing formal PO document as its own table, schema `tradeops` (mirrors 021/022 —
-- the other Phase 1 additions): UUID PK, tenant-scoped, RLS fail-closed.
--
-- Lifecycle: draft → issued → accepted (seller) | rejected (seller) | cancelled
-- (buyer, draft/issued only). `order_id` links to the `trade.orders` fulfillment
-- record created when a PO is accepted (cross-schema reference kept as text — the
-- two schemas are versioned independently, no DB-level FK).
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; the RLS policy is written explicitly (mirrors 008…022).

CREATE TABLE IF NOT EXISTS tradeops.purchase_orders (
    id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            text          NOT NULL DEFAULT 'T-DEMO',
    po_number            text          NOT NULL,
    deal_id              text,
    quotation_id         text,
    rfq_id               text,
    buyer_org_id         text          NOT NULL,
    seller_org_id        text          NOT NULL,
    currency             text          NOT NULL DEFAULT 'USD',
    line_items           jsonb         NOT NULL DEFAULT '[]',
    subtotal             numeric(18,2) NOT NULL DEFAULT 0,
    tax_total            numeric(18,2) NOT NULL DEFAULT 0,
    total_value          numeric(18,2) NOT NULL DEFAULT 0,
    shipping_terms       text,
    payment_terms        text,
    delivery_date        timestamptz,
    status               text          NOT NULL DEFAULT 'draft',
    order_id             text,
    notes                text,
    created_by_user_id   text,
    issued_at            timestamptz,
    responded_at         timestamptz,
    created_at           timestamptz   NOT NULL DEFAULT now(),
    updated_at           timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT chk_purchase_orders_status CHECK (status IN ('draft','issued','accepted','rejected','cancelled')),
    CONSTRAINT uq_purchase_orders_tenant_po_number UNIQUE (tenant_id, po_number)
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_status ON tradeops.purchase_orders (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_buyer          ON tradeops.purchase_orders (tenant_id, buyer_org_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_seller         ON tradeops.purchase_orders (tenant_id, seller_org_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_deal           ON tradeops.purchase_orders (deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_brin   ON tradeops.purchase_orders USING brin (created_at);

ALTER TABLE tradeops.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.purchase_orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.purchase_orders;
CREATE POLICY tenant_isolation ON tradeops.purchase_orders
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

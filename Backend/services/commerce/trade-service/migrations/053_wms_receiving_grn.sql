-- 053 — Warehouse Management System, Phase A: receiving + Goods Receipt Notes.
--
--   • tradeops.goods_receipt_notes — receiving header (one per inbound
--     shipment/PO arrival). draft -> in_progress -> completed, cancellable from
--     either open state (see service/warehouse/receivingLifecycle.js).
--   • tradeops.goods_receipt_lines — per-item receiving detail (expected vs
--     received quantity, condition, lot/expiry, hazard/temperature attrs feeding
--     the putaway engine).
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style, same as 043).

CREATE TABLE IF NOT EXISTS tradeops.goods_receipt_notes (
    id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          text          NOT NULL DEFAULT 'T-DEMO',
    grn_number         text          NOT NULL,
    warehouse_id       uuid          NOT NULL,
    purchase_order_id  uuid,
    shipment_id        uuid,
    supplier_reference text,
    status             text          NOT NULL DEFAULT 'draft',
    received_by        text,
    received_at        timestamptz,
    notes              text,
    metadata           jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version            integer       NOT NULL DEFAULT 1,
    created_by         text,
    updated_by         text,
    deleted_by         text,
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz   NOT NULL DEFAULT now(),
    deleted_at         timestamptz,
    CONSTRAINT fk_grn_warehouse      FOREIGN KEY (warehouse_id) REFERENCES tradeops.warehouses (id) ON DELETE CASCADE,
    CONSTRAINT fk_grn_purchase_order FOREIGN KEY (purchase_order_id) REFERENCES tradeops.purchase_orders (id) ON DELETE SET NULL,
    CONSTRAINT fk_grn_shipment       FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE SET NULL,
    CONSTRAINT chk_grn_status        CHECK (status IN ('draft','in_progress','completed','cancelled')),
    CONSTRAINT uq_grn_number         UNIQUE (tenant_id, grn_number)
);

CREATE INDEX IF NOT EXISTS idx_grn_tenant     ON tradeops.goods_receipt_notes (tenant_id);
CREATE INDEX IF NOT EXISTS idx_grn_warehouse  ON tradeops.goods_receipt_notes (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_grn_po         ON tradeops.goods_receipt_notes (purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_grn_status     ON tradeops.goods_receipt_notes (status);

ALTER TABLE tradeops.goods_receipt_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.goods_receipt_notes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.goods_receipt_notes;
CREATE POLICY tenant_isolation ON tradeops.goods_receipt_notes
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.goods_receipt_lines (
    id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                text          NOT NULL DEFAULT 'T-DEMO',
    grn_id                   uuid          NOT NULL,
    package_id               uuid,
    sku                      text,
    description              text,
    expected_quantity        numeric(14,3),
    received_quantity        numeric(14,3) NOT NULL DEFAULT 0,
    unit                     text          NOT NULL DEFAULT 'unit',
    condition                text          NOT NULL DEFAULT 'good',
    lot_number               text,
    manufacture_date         date,
    expiry_date              date,
    weight_kg                numeric(12,3),
    volume_cbm               numeric(12,4),
    hazard_class             text,
    temperature_requirement  text,
    metadata                 jsonb         NOT NULL DEFAULT '{}'::jsonb,
    created_by               text,
    created_at               timestamptz   NOT NULL DEFAULT now(),
    updated_at               timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_grn_line_grn      FOREIGN KEY (grn_id) REFERENCES tradeops.goods_receipt_notes (id) ON DELETE CASCADE,
    CONSTRAINT fk_grn_line_package  FOREIGN KEY (package_id) REFERENCES tradeops.packages (id) ON DELETE SET NULL,
    CONSTRAINT chk_grn_line_condition CHECK (condition IN ('good','damaged','partial','rejected'))
);

CREATE INDEX IF NOT EXISTS idx_grn_line_tenant  ON tradeops.goods_receipt_lines (tenant_id);
CREATE INDEX IF NOT EXISTS idx_grn_line_grn     ON tradeops.goods_receipt_lines (grn_id);
CREATE INDEX IF NOT EXISTS idx_grn_line_package ON tradeops.goods_receipt_lines (package_id);

ALTER TABLE tradeops.goods_receipt_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.goods_receipt_lines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.goods_receipt_lines;
CREATE POLICY tenant_isolation ON tradeops.goods_receipt_lines
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

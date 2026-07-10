-- 043 — Logistics Core Foundation, Phase 2: operational warehouses + inventory
-- movement ledger.
--
--   • tradeops.warehouses — physical facility holding inventory. Distinct from
--     tradeops.facilities (Phase 2 Trust/Verification KYC record).
--   • tradeops.inventory_movements — append-only ledger (HIGH VOLUME like
--     tradeops.tracking_events — BRIN index on occurred_at).
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.warehouses (
    id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        text          NOT NULL DEFAULT 'T-DEMO',
    name             text          NOT NULL,
    code             text,
    warehouse_type   text          NOT NULL DEFAULT 'distribution',
    address_id       uuid,
    capacity_sqm     numeric(14,2),
    capacity_units   integer,
    used_units       integer       NOT NULL DEFAULT 0,
    status           text          NOT NULL DEFAULT 'active',
    manager_name     text,
    contact_phone    text,
    operating_hours  jsonb         NOT NULL DEFAULT '{}'::jsonb,
    metadata         jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version          integer       NOT NULL DEFAULT 1,
    created_by       text,
    updated_by       text,
    deleted_by       text,
    created_at       timestamptz   NOT NULL DEFAULT now(),
    updated_at       timestamptz   NOT NULL DEFAULT now(),
    deleted_at       timestamptz,
    CONSTRAINT fk_warehouses_address FOREIGN KEY (address_id) REFERENCES tradeops.logistics_addresses (id) ON DELETE SET NULL,
    CONSTRAINT chk_warehouses_type CHECK (warehouse_type IN ('distribution','fulfillment','cold_storage','bonded','cross_dock')),
    CONSTRAINT chk_warehouses_status CHECK (status IN ('active','inactive','full','maintenance'))
);

CREATE INDEX IF NOT EXISTS idx_warehouses_tenant  ON tradeops.warehouses (tenant_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_address ON tradeops.warehouses (address_id);

ALTER TABLE tradeops.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.warehouses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.warehouses;
CREATE POLICY tenant_isolation ON tradeops.warehouses
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.inventory_movements (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text          NOT NULL DEFAULT 'T-DEMO',
    warehouse_id    uuid          NOT NULL,
    package_id      uuid,
    shipment_id     uuid,
    movement_type   text          NOT NULL,
    quantity        numeric(14,3) NOT NULL,
    unit            text          NOT NULL DEFAULT 'unit',
    reference_type  text,
    reference_id    text,
    occurred_at     timestamptz   NOT NULL DEFAULT now(),
    notes           text,
    metadata        jsonb         NOT NULL DEFAULT '{}'::jsonb,
    created_by      text,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_inventory_movements_warehouse FOREIGN KEY (warehouse_id) REFERENCES tradeops.warehouses (id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_movements_package   FOREIGN KEY (package_id) REFERENCES tradeops.packages (id) ON DELETE SET NULL,
    CONSTRAINT fk_inventory_movements_shipment  FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE SET NULL,
    CONSTRAINT chk_inventory_movements_type CHECK (movement_type IN ('inbound','outbound','transfer','adjustment'))
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant    ON tradeops.inventory_movements (tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_warehouse ON tradeops.inventory_movements (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_package   ON tradeops.inventory_movements (package_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_occurred_brin ON tradeops.inventory_movements USING brin (occurred_at);

ALTER TABLE tradeops.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.inventory_movements FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.inventory_movements;
CREATE POLICY tenant_isolation ON tradeops.inventory_movements
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

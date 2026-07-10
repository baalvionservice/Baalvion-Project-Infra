-- 052 — Warehouse Management System, Phase A: location hierarchy.
--
--   • tradeops.warehouse_zones — functional areas within a warehouse (receiving,
--     picking, packing, cold storage, hazmat, quarantine, ...).
--   • tradeops.warehouse_bins — self-referencing (parent_bin_id) so aisle -> rack
--     -> shelf -> bin is ONE table (bin_type discriminates the level) rather than
--     four near-duplicate tables/join paths. warehouse_id is denormalized onto
--     every bin (not just the zone) because the hot putaway-candidate query
--     filters by warehouse first.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style, same as 043).

CREATE TABLE IF NOT EXISTS tradeops.warehouse_zones (
    id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         text          NOT NULL DEFAULT 'T-DEMO',
    warehouse_id      uuid          NOT NULL,
    code              text,
    name              text          NOT NULL,
    zone_type         text          NOT NULL DEFAULT 'storage',
    temperature_zone  text,
    hazard_class      text,
    capacity_units    integer,
    used_units        integer       NOT NULL DEFAULT 0,
    sequence_order    integer       NOT NULL DEFAULT 0,
    status            text          NOT NULL DEFAULT 'active',
    barcode           text,
    qr_payload        text,
    metadata          jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version           integer       NOT NULL DEFAULT 1,
    created_by        text,
    updated_by        text,
    deleted_by        text,
    created_at        timestamptz   NOT NULL DEFAULT now(),
    updated_at        timestamptz   NOT NULL DEFAULT now(),
    deleted_at        timestamptz,
    CONSTRAINT fk_warehouse_zones_warehouse FOREIGN KEY (warehouse_id) REFERENCES tradeops.warehouses (id) ON DELETE CASCADE,
    CONSTRAINT chk_warehouse_zones_type CHECK (zone_type IN ('storage','receiving','staging','packing','hazmat','cold_storage','quarantine','cross_dock')),
    CONSTRAINT chk_warehouse_zones_temp CHECK (temperature_zone IS NULL OR temperature_zone IN ('ambient','chilled','frozen','controlled')),
    CONSTRAINT chk_warehouse_zones_status CHECK (status IN ('active','inactive','maintenance','full'))
);

CREATE INDEX IF NOT EXISTS idx_warehouse_zones_tenant    ON tradeops.warehouse_zones (tenant_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_zones_warehouse ON tradeops.warehouse_zones (warehouse_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_warehouse_zones_barcode ON tradeops.warehouse_zones (tenant_id, barcode) WHERE barcode IS NOT NULL;

ALTER TABLE tradeops.warehouse_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.warehouse_zones FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.warehouse_zones;
CREATE POLICY tenant_isolation ON tradeops.warehouse_zones
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.warehouse_bins (
    id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             text          NOT NULL DEFAULT 'T-DEMO',
    warehouse_id          uuid          NOT NULL,
    zone_id               uuid          NOT NULL,
    parent_bin_id         uuid,
    bin_type              text          NOT NULL DEFAULT 'bin',
    code                  text,
    name                  text,
    path                  text,
    capacity_weight_kg    numeric(12,3),
    capacity_volume_cbm   numeric(12,4),
    capacity_units        integer,
    used_weight_kg        numeric(12,3) NOT NULL DEFAULT 0,
    used_volume_cbm       numeric(12,4) NOT NULL DEFAULT 0,
    used_units            integer       NOT NULL DEFAULT 0,
    temperature_zone      text,
    hazard_class          text,
    abc_class             text,
    status                text          NOT NULL DEFAULT 'active',
    barcode               text,
    qr_payload            text,
    metadata              jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version               integer       NOT NULL DEFAULT 1,
    created_by            text,
    updated_by            text,
    deleted_by            text,
    created_at            timestamptz   NOT NULL DEFAULT now(),
    updated_at            timestamptz   NOT NULL DEFAULT now(),
    deleted_at            timestamptz,
    CONSTRAINT fk_warehouse_bins_warehouse FOREIGN KEY (warehouse_id) REFERENCES tradeops.warehouses (id) ON DELETE CASCADE,
    CONSTRAINT fk_warehouse_bins_zone      FOREIGN KEY (zone_id) REFERENCES tradeops.warehouse_zones (id) ON DELETE CASCADE,
    CONSTRAINT fk_warehouse_bins_parent    FOREIGN KEY (parent_bin_id) REFERENCES tradeops.warehouse_bins (id) ON DELETE CASCADE,
    CONSTRAINT chk_warehouse_bins_type     CHECK (bin_type IN ('aisle','rack','shelf','bin')),
    CONSTRAINT chk_warehouse_bins_temp     CHECK (temperature_zone IS NULL OR temperature_zone IN ('ambient','chilled','frozen','controlled')),
    CONSTRAINT chk_warehouse_bins_abc      CHECK (abc_class IS NULL OR abc_class IN ('A','B','C')),
    CONSTRAINT chk_warehouse_bins_status   CHECK (status IN ('active','inactive','blocked','full','maintenance'))
);

CREATE INDEX IF NOT EXISTS idx_warehouse_bins_tenant     ON tradeops.warehouse_bins (tenant_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_bins_warehouse  ON tradeops.warehouse_bins (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_bins_zone       ON tradeops.warehouse_bins (zone_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_bins_parent     ON tradeops.warehouse_bins (parent_bin_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_bins_candidate  ON tradeops.warehouse_bins (tenant_id, zone_id, status, bin_type);
CREATE UNIQUE INDEX IF NOT EXISTS uq_warehouse_bins_barcode ON tradeops.warehouse_bins (tenant_id, barcode) WHERE barcode IS NOT NULL;

ALTER TABLE tradeops.warehouse_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.warehouse_bins FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.warehouse_bins;
CREATE POLICY tenant_isolation ON tradeops.warehouse_bins
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

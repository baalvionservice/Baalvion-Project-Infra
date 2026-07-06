-- 040 — Logistics Core Foundation, Phase 1: containers + packages.
--
--   • tradeops.containers — shipping container (20ft/40ft/.../reefer/tank/...),
--     optionally linked to a shipment.
--   • tradeops.packages — physical cargo unit (box/pallet/hazardous/...) inside
--     a shipment, optionally inside a container.
--
-- Both carry tenant_id + full RLS, matching the tradeops foundation (009)
-- conventions. Soft references to carriers (carrier_id) are TEXT, not FK
-- constraints — same pattern as tradeops.shipments.carrier_id, since Carrier
-- is a global marketplace registry the tenant may not have a row for yet.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.containers (
    id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         text          NOT NULL DEFAULT 'T-DEMO',
    shipment_id       uuid,
    container_number  text          NOT NULL,
    iso_code          text,
    container_type    text          NOT NULL DEFAULT '20ft',
    seal_number       text,
    carrier_id        text,
    owner             text,
    status            text          NOT NULL DEFAULT 'empty',
    current_location  text,
    capacity_kg       numeric(16,3),
    weight_kg         numeric(16,3),
    temperature_c     numeric(6,2),
    metadata          jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version           integer       NOT NULL DEFAULT 1,
    created_by        text,
    updated_by        text,
    deleted_by        text,
    created_at        timestamptz   NOT NULL DEFAULT now(),
    updated_at        timestamptz   NOT NULL DEFAULT now(),
    deleted_at        timestamptz,
    CONSTRAINT fk_containers_shipment FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE SET NULL,
    CONSTRAINT chk_containers_type CHECK (container_type IN ('20ft','40ft','40hc','45hc','lcl','fcl','reefer','tank','open_top','flat_rack')),
    CONSTRAINT chk_containers_status CHECK (status IN ('empty','loaded','sealed','in_transit','at_port','customs_hold','released','returned'))
);

CREATE INDEX IF NOT EXISTS idx_containers_tenant    ON tradeops.containers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_containers_shipment   ON tradeops.containers (shipment_id);
CREATE INDEX IF NOT EXISTS idx_containers_number     ON tradeops.containers (container_number);

ALTER TABLE tradeops.containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.containers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.containers;
CREATE POLICY tenant_isolation ON tradeops.containers
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.packages (
    id                     uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id              text          NOT NULL DEFAULT 'T-DEMO',
    shipment_id            uuid          NOT NULL,
    container_id           uuid,
    package_type           text          NOT NULL DEFAULT 'box',
    length_cm              numeric(10,2),
    width_cm               numeric(10,2),
    height_cm              numeric(10,2),
    weight_kg              numeric(12,3),
    volume_cbm             numeric(12,4),
    barcode                text,
    qr_code                text,
    rfid_tag               text,
    sku                    text,
    hs_code                text,
    commodity_description  text,
    packaging_material     text,
    seal_number            text,
    metadata               jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version                integer       NOT NULL DEFAULT 1,
    created_by             text,
    updated_by             text,
    deleted_by             text,
    created_at             timestamptz   NOT NULL DEFAULT now(),
    updated_at             timestamptz   NOT NULL DEFAULT now(),
    deleted_at             timestamptz,
    CONSTRAINT fk_packages_shipment  FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE CASCADE,
    CONSTRAINT fk_packages_container FOREIGN KEY (container_id) REFERENCES tradeops.containers (id) ON DELETE SET NULL,
    CONSTRAINT chk_packages_type CHECK (package_type IN ('box','pallet','container','loose_cargo','hazardous','oversized','temperature_controlled'))
);

CREATE INDEX IF NOT EXISTS idx_packages_tenant    ON tradeops.packages (tenant_id);
CREATE INDEX IF NOT EXISTS idx_packages_shipment   ON tradeops.packages (shipment_id);
CREATE INDEX IF NOT EXISTS idx_packages_container  ON tradeops.packages (container_id);
CREATE INDEX IF NOT EXISTS idx_packages_barcode    ON tradeops.packages (barcode);

ALTER TABLE tradeops.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.packages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.packages;
CREATE POLICY tenant_isolation ON tradeops.packages
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

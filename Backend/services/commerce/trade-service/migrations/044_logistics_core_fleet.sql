-- 044 — Logistics Core Foundation, Phase 2: fleet (vehicles, drivers, assignments).
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.vehicles (
    id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             text          NOT NULL DEFAULT 'T-DEMO',
    vehicle_number        text          NOT NULL,
    vehicle_type          text          NOT NULL DEFAULT 'truck',
    capacity_kg           numeric(14,3),
    capacity_volume_cbm   numeric(14,3),
    status                text          NOT NULL DEFAULT 'available',
    current_location      text,
    carrier_id            text,
    make                  text,
    model                 text,
    year                  integer,
    gps_device_id         text,
    metadata              jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version               integer       NOT NULL DEFAULT 1,
    created_by            text,
    updated_by            text,
    deleted_by            text,
    created_at            timestamptz   NOT NULL DEFAULT now(),
    updated_at            timestamptz   NOT NULL DEFAULT now(),
    deleted_at            timestamptz,
    CONSTRAINT chk_vehicles_type CHECK (vehicle_type IN ('truck','van','trailer','rail_car','ship','aircraft')),
    CONSTRAINT chk_vehicles_status CHECK (status IN ('available','in_use','maintenance','out_of_service'))
);

CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON tradeops.vehicles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_number ON tradeops.vehicles (vehicle_number);

ALTER TABLE tradeops.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.vehicles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.vehicles;
CREATE POLICY tenant_isolation ON tradeops.vehicles
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.drivers (
    id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           text          NOT NULL DEFAULT 'T-DEMO',
    full_name           text          NOT NULL,
    license_number      text,
    license_expiry      date,
    phone               text,
    email               text,
    status              text          NOT NULL DEFAULT 'available',
    current_vehicle_id  uuid,
    rating              numeric(3,2),
    metadata            jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version             integer       NOT NULL DEFAULT 1,
    created_by          text,
    updated_by          text,
    deleted_by          text,
    created_at          timestamptz   NOT NULL DEFAULT now(),
    updated_at          timestamptz   NOT NULL DEFAULT now(),
    deleted_at          timestamptz,
    CONSTRAINT fk_drivers_current_vehicle FOREIGN KEY (current_vehicle_id) REFERENCES tradeops.vehicles (id) ON DELETE SET NULL,
    CONSTRAINT chk_drivers_status CHECK (status IN ('available','on_trip','off_duty','suspended'))
);

CREATE INDEX IF NOT EXISTS idx_drivers_tenant  ON tradeops.drivers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_drivers_vehicle ON tradeops.drivers (current_vehicle_id);

ALTER TABLE tradeops.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.drivers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.drivers;
CREATE POLICY tenant_isolation ON tradeops.drivers
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.fleet_assignments (
    id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     text          NOT NULL DEFAULT 'T-DEMO',
    vehicle_id    uuid          NOT NULL,
    driver_id     uuid          NOT NULL,
    shipment_id   uuid,
    status        text          NOT NULL DEFAULT 'assigned',
    assigned_at   timestamptz   NOT NULL DEFAULT now(),
    started_at    timestamptz,
    completed_at  timestamptz,
    notes         text,
    metadata      jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version       integer       NOT NULL DEFAULT 1,
    created_by    text,
    updated_by    text,
    deleted_by    text,
    created_at    timestamptz   NOT NULL DEFAULT now(),
    updated_at    timestamptz   NOT NULL DEFAULT now(),
    deleted_at    timestamptz,
    CONSTRAINT fk_fleet_assignments_vehicle  FOREIGN KEY (vehicle_id) REFERENCES tradeops.vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_fleet_assignments_driver   FOREIGN KEY (driver_id) REFERENCES tradeops.drivers (id) ON DELETE CASCADE,
    CONSTRAINT fk_fleet_assignments_shipment FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE SET NULL,
    CONSTRAINT chk_fleet_assignments_status CHECK (status IN ('assigned','in_progress','completed','cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_fleet_assignments_tenant   ON tradeops.fleet_assignments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_fleet_assignments_vehicle  ON tradeops.fleet_assignments (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_assignments_driver   ON tradeops.fleet_assignments (driver_id);
CREATE INDEX IF NOT EXISTS idx_fleet_assignments_shipment ON tradeops.fleet_assignments (shipment_id);

ALTER TABLE tradeops.fleet_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.fleet_assignments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.fleet_assignments;
CREATE POLICY tenant_isolation ON tradeops.fleet_assignments
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

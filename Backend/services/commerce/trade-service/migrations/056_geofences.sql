-- 056 — Shipment Tracking & Global Visibility Platform: geofencing.
--
--   • tradeops.geofences — named zones (warehouse/port/airport/customer/
--     border/customs/delivery_hub) as a circle (center+radius) or polygon,
--     stored as JSONB so either shape works without a PostGIS dependency.
--   • tradeops.geofence_events — append-only entry/exit/dwell/violation log,
--     written by service/tracking-platform/geofenceEngine.js whenever a new
--     tracking_event is recorded for a shipment inside/near a fence.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.geofences (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text          NOT NULL DEFAULT 'T-DEMO',
    name            text          NOT NULL,
    fence_type      text          NOT NULL,
    shape           jsonb         NOT NULL DEFAULT '{}'::jsonb,
    active          boolean       NOT NULL DEFAULT true,
    metadata        jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version         integer       NOT NULL DEFAULT 1,
    created_by      text,
    updated_by      text,
    deleted_by      text,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz   NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    CONSTRAINT chk_geofences_type CHECK (fence_type IN ('warehouse','port','airport','customer','border','customs','delivery_hub','rail_terminal','distribution_center','other'))
);

CREATE INDEX IF NOT EXISTS idx_geofences_tenant ON tradeops.geofences (tenant_id);
CREATE INDEX IF NOT EXISTS idx_geofences_active ON tradeops.geofences (active);

ALTER TABLE tradeops.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.geofences FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.geofences;
CREATE POLICY tenant_isolation ON tradeops.geofences
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.geofence_events (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text          NOT NULL DEFAULT 'T-DEMO',
    geofence_id     uuid          NOT NULL,
    shipment_id     uuid          NOT NULL,
    event_type      text          NOT NULL,
    latitude        numeric(9,6),
    longitude       numeric(9,6),
    occurred_at     timestamptz   NOT NULL DEFAULT now(),
    metadata        jsonb         NOT NULL DEFAULT '{}'::jsonb,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_geofence_events_geofence FOREIGN KEY (geofence_id) REFERENCES tradeops.geofences (id) ON DELETE CASCADE,
    CONSTRAINT fk_geofence_events_shipment FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE CASCADE,
    CONSTRAINT chk_geofence_events_type CHECK (event_type IN ('entry','exit','dwell_exceeded','unauthorized_movement','outside_route','wrong_destination'))
);

CREATE INDEX IF NOT EXISTS idx_geofence_events_tenant   ON tradeops.geofence_events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_geofence ON tradeops.geofence_events (geofence_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_shipment ON tradeops.geofence_events (shipment_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_occurred_brin ON tradeops.geofence_events USING brin (occurred_at);

ALTER TABLE tradeops.geofence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.geofence_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.geofence_events;
CREATE POLICY tenant_isolation ON tradeops.geofence_events
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

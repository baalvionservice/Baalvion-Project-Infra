-- 062 — Shipment Tracking & Global Visibility Platform: planned multi-leg
-- routes.
--
--   • tradeops.shipment_routes — the planned/actual leg-by-leg journey
--     (sea/air/road/rail/courier legs in sequence) for a shipment, distinct
--     from tradeops.route_optimizations (pre-booking carrier/route scoring).
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.shipment_routes (
    id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          text          NOT NULL DEFAULT 'T-DEMO',
    shipment_id        uuid          NOT NULL,
    sequence           integer       NOT NULL DEFAULT 0,
    leg_mode           text          NOT NULL,
    from_location      text,
    to_location        text,
    planned_departure  timestamptz,
    planned_arrival    timestamptz,
    actual_departure   timestamptz,
    actual_arrival     timestamptz,
    distance_km        numeric(12,2),
    polyline           text,
    carrier_leg_id     text,
    metadata           jsonb         NOT NULL DEFAULT '{}'::jsonb,
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_shipment_routes_shipment FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE CASCADE,
    CONSTRAINT chk_shipment_routes_mode CHECK (leg_mode IN ('sea','air','road','rail','courier'))
);

CREATE INDEX IF NOT EXISTS idx_shipment_routes_tenant   ON tradeops.shipment_routes (tenant_id);
CREATE INDEX IF NOT EXISTS idx_shipment_routes_shipment ON tradeops.shipment_routes (shipment_id, sequence);

ALTER TABLE tradeops.shipment_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.shipment_routes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.shipment_routes;
CREATE POLICY tenant_isolation ON tradeops.shipment_routes
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

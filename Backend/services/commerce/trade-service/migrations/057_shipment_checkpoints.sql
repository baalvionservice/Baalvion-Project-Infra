-- 057 — Shipment Tracking & Global Visibility Platform: physical checkpoints.
--
--   • tradeops.shipment_checkpoints — a shipment's planned/actual stops
--     (warehouse/factory/port/airport/rail_terminal/border/customs/
--     distribution_center/delivery_hub/final_destination), with arrival/
--     departure timestamps so dwell/delay/waiting time is queryable directly
--     instead of derived from the generic shipment_events log.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.shipment_checkpoints (
    id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          text          NOT NULL DEFAULT 'T-DEMO',
    shipment_id        uuid          NOT NULL,
    checkpoint_type    text          NOT NULL,
    name               text,
    sequence           integer       NOT NULL DEFAULT 0,
    arrived_at         timestamptz,
    departed_at        timestamptz,
    delay_minutes      integer,
    waiting_minutes    integer,
    inspection_status  text          NOT NULL DEFAULT 'pending',
    approved           boolean       NOT NULL DEFAULT false,
    latitude           numeric(9,6),
    longitude          numeric(9,6),
    metadata           jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version            integer       NOT NULL DEFAULT 1,
    created_by         text,
    updated_by         text,
    deleted_by         text,
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz   NOT NULL DEFAULT now(),
    deleted_at         timestamptz,
    CONSTRAINT fk_shipment_checkpoints_shipment FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE CASCADE,
    CONSTRAINT chk_shipment_checkpoints_type CHECK (checkpoint_type IN ('warehouse','factory','port','airport','rail_terminal','border','customs','distribution_center','delivery_hub','final_destination')),
    CONSTRAINT chk_shipment_checkpoints_inspection CHECK (inspection_status IN ('pending','passed','failed','not_applicable'))
);

CREATE INDEX IF NOT EXISTS idx_shipment_checkpoints_tenant   ON tradeops.shipment_checkpoints (tenant_id);
CREATE INDEX IF NOT EXISTS idx_shipment_checkpoints_shipment ON tradeops.shipment_checkpoints (shipment_id, sequence);

ALTER TABLE tradeops.shipment_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.shipment_checkpoints FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.shipment_checkpoints;
CREATE POLICY tenant_isolation ON tradeops.shipment_checkpoints
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

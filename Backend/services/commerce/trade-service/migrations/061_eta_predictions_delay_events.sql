-- 061 — Shipment Tracking & Global Visibility Platform: ETA prediction +
-- delay detection.
--
--   • tradeops.eta_predictions — append-only history of live in-transit ETA
--     re-predictions (distinct from the pure pre-booking quote-ETA calculator
--     in service/freight/eta.js), written by
--     service/tracking-platform/etaPredictionEngine.js.
--   • tradeops.delay_events — detected delay causes (traffic/weather/
--     mechanical/border/port_congestion/customs_hold/missing_documents/
--     driver/warehouse/late_pickup/late_delivery), written by
--     service/tracking-platform/delayDetectionEngine.js.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.eta_predictions (
    id                     uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id              text          NOT NULL DEFAULT 'T-DEMO',
    shipment_id            uuid          NOT NULL,
    predicted_eta          timestamptz,
    confidence_pct         numeric(5,2),
    risk_score             numeric(5,2),
    delay_probability_pct  numeric(5,2),
    factors                jsonb         NOT NULL DEFAULT '{}'::jsonb,
    model_version          text          NOT NULL DEFAULT 'rule-based-v1',
    computed_at            timestamptz   NOT NULL DEFAULT now(),
    created_at             timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_eta_predictions_shipment FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_eta_predictions_tenant   ON tradeops.eta_predictions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_eta_predictions_shipment ON tradeops.eta_predictions (shipment_id, computed_at DESC);

ALTER TABLE tradeops.eta_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.eta_predictions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.eta_predictions;
CREATE POLICY tenant_isolation ON tradeops.eta_predictions
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.delay_events (
    id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                text          NOT NULL DEFAULT 'T-DEMO',
    shipment_id              uuid          NOT NULL,
    delay_type               text          NOT NULL,
    detected_at              timestamptz   NOT NULL DEFAULT now(),
    estimated_delay_minutes  integer,
    resolved                 boolean       NOT NULL DEFAULT false,
    resolved_at              timestamptz,
    metadata                 jsonb         NOT NULL DEFAULT '{}'::jsonb,
    created_at               timestamptz   NOT NULL DEFAULT now(),
    updated_at               timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_delay_events_shipment FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE CASCADE,
    CONSTRAINT chk_delay_events_type CHECK (delay_type IN ('traffic','weather','mechanical','border','port_congestion','customs_hold','missing_documents','driver','warehouse','late_pickup','late_delivery'))
);

CREATE INDEX IF NOT EXISTS idx_delay_events_tenant   ON tradeops.delay_events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_delay_events_shipment ON tradeops.delay_events (shipment_id);
CREATE INDEX IF NOT EXISTS idx_delay_events_resolved ON tradeops.delay_events (resolved);

ALTER TABLE tradeops.delay_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.delay_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.delay_events;
CREATE POLICY tenant_isolation ON tradeops.delay_events
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

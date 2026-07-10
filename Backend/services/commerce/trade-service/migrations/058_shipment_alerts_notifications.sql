-- 058 — Shipment Tracking & Global Visibility Platform: alerts + notification
-- fan-out.
--
--   • tradeops.shipment_alerts — the single alert ledger raised by
--     geofenceEngine/iotIngestEngine/delayDetectionEngine/etaPredictionEngine
--     (service/tracking-platform/alertEngine.js is the sole writer).
--   • tradeops.shipment_notifications — one row per channel delivery attempt
--     for an alert (websocket/email/sms/whatsapp/slack/teams/webhook/push),
--     written by service/tracking-platform/notificationDispatcher.js.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.shipment_alerts (
    id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        text          NOT NULL DEFAULT 'T-DEMO',
    shipment_id      uuid          NOT NULL,
    alert_type       text          NOT NULL,
    severity         text          NOT NULL DEFAULT 'medium',
    message          text          NOT NULL,
    status           text          NOT NULL DEFAULT 'active',
    triggered_at     timestamptz   NOT NULL DEFAULT now(),
    acknowledged_by  text,
    acknowledged_at  timestamptz,
    resolved_at      timestamptz,
    metadata         jsonb         NOT NULL DEFAULT '{}'::jsonb,
    created_at       timestamptz   NOT NULL DEFAULT now(),
    updated_at       timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_shipment_alerts_shipment FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE CASCADE,
    CONSTRAINT chk_shipment_alerts_type CHECK (alert_type IN ('gps_lost','offline','geofence_enter','geofence_exit','delay','route_deviation','temperature','humidity','shock','unauthorized_opening','container_tampering','battery_low','eta_changed','late_delivery','customs_hold','delivered')),
    CONSTRAINT chk_shipment_alerts_severity CHECK (severity IN ('low','medium','high','critical')),
    CONSTRAINT chk_shipment_alerts_status CHECK (status IN ('active','acknowledged','resolved'))
);

CREATE INDEX IF NOT EXISTS idx_shipment_alerts_tenant   ON tradeops.shipment_alerts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_shipment_alerts_shipment ON tradeops.shipment_alerts (shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_alerts_status   ON tradeops.shipment_alerts (status);

ALTER TABLE tradeops.shipment_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.shipment_alerts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.shipment_alerts;
CREATE POLICY tenant_isolation ON tradeops.shipment_alerts
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.shipment_notifications (
    id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    text          NOT NULL DEFAULT 'T-DEMO',
    shipment_id  uuid          NOT NULL,
    alert_id     uuid,
    channel      text          NOT NULL,
    recipient    text,
    status       text          NOT NULL DEFAULT 'pending',
    payload      jsonb         NOT NULL DEFAULT '{}'::jsonb,
    sent_at      timestamptz,
    error        text,
    created_at   timestamptz   NOT NULL DEFAULT now(),
    updated_at   timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_shipment_notifications_shipment FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE CASCADE,
    CONSTRAINT fk_shipment_notifications_alert FOREIGN KEY (alert_id) REFERENCES tradeops.shipment_alerts (id) ON DELETE SET NULL,
    CONSTRAINT chk_shipment_notifications_channel CHECK (channel IN ('websocket','email','sms','whatsapp','slack','teams','webhook','push')),
    CONSTRAINT chk_shipment_notifications_status CHECK (status IN ('pending','sent','failed','delivered'))
);

CREATE INDEX IF NOT EXISTS idx_shipment_notifications_tenant   ON tradeops.shipment_notifications (tenant_id);
CREATE INDEX IF NOT EXISTS idx_shipment_notifications_shipment ON tradeops.shipment_notifications (shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_notifications_alert    ON tradeops.shipment_notifications (alert_id);

ALTER TABLE tradeops.shipment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.shipment_notifications FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.shipment_notifications;
CREATE POLICY tenant_isolation ON tradeops.shipment_notifications
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

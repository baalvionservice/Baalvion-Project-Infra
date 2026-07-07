-- 059 — Shipment Tracking & Global Visibility Platform: IoT sensor tracking.
--
--   • tradeops.iot_devices — registered sensor/tracker hardware attached to a
--     shipment or container (temperature/humidity/shock/tilt/door/battery/
--     fuel/pressure/light/gps), one row per physical device.
--   • tradeops.iot_sensor_logs — high-volume append-only sensor readings,
--     written by service/tracking-platform/iotIngestEngine.js.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.iot_devices (
    id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          text          NOT NULL DEFAULT 'T-DEMO',
    shipment_id        uuid,
    container_id       uuid,
    device_type        text          NOT NULL,
    external_device_id text,
    provider           text,
    status             text          NOT NULL DEFAULT 'unknown',
    last_seen_at       timestamptz,
    battery_pct        numeric(5,2),
    metadata           jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version            integer       NOT NULL DEFAULT 1,
    created_by         text,
    updated_by         text,
    deleted_by         text,
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz   NOT NULL DEFAULT now(),
    deleted_at         timestamptz,
    CONSTRAINT fk_iot_devices_shipment  FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE SET NULL,
    CONSTRAINT fk_iot_devices_container FOREIGN KEY (container_id) REFERENCES tradeops.containers (id) ON DELETE SET NULL,
    CONSTRAINT chk_iot_devices_type CHECK (device_type IN ('temperature','humidity','shock','tilt','door','battery','fuel','pressure','light','gps')),
    CONSTRAINT chk_iot_devices_provider CHECK (provider IS NULL OR provider IN ('aws_iot','azure_iot','mqtt','lorawan','ble')),
    CONSTRAINT chk_iot_devices_status CHECK (status IN ('online','offline','unknown'))
);

CREATE INDEX IF NOT EXISTS idx_iot_devices_tenant    ON tradeops.iot_devices (tenant_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_shipment  ON tradeops.iot_devices (shipment_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_container ON tradeops.iot_devices (container_id);

ALTER TABLE tradeops.iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.iot_devices FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.iot_devices;
CREATE POLICY tenant_isolation ON tradeops.iot_devices
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.iot_sensor_logs (
    id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     text          NOT NULL DEFAULT 'T-DEMO',
    device_id     uuid          NOT NULL,
    shipment_id   uuid,
    metric_type   text          NOT NULL,
    value         numeric(12,4),
    unit          text,
    recorded_at   timestamptz   NOT NULL DEFAULT now(),
    raw_payload   jsonb         NOT NULL DEFAULT '{}'::jsonb,
    created_at    timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_iot_sensor_logs_device   FOREIGN KEY (device_id) REFERENCES tradeops.iot_devices (id) ON DELETE CASCADE,
    CONSTRAINT fk_iot_sensor_logs_shipment FOREIGN KEY (shipment_id) REFERENCES tradeops.shipments (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_iot_sensor_logs_tenant   ON tradeops.iot_sensor_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_iot_sensor_logs_device   ON tradeops.iot_sensor_logs (device_id);
CREATE INDEX IF NOT EXISTS idx_iot_sensor_logs_shipment ON tradeops.iot_sensor_logs (shipment_id);
CREATE INDEX IF NOT EXISTS idx_iot_sensor_logs_recorded_brin ON tradeops.iot_sensor_logs USING brin (recorded_at);

ALTER TABLE tradeops.iot_sensor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.iot_sensor_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.iot_sensor_logs;
CREATE POLICY tenant_isolation ON tradeops.iot_sensor_logs
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

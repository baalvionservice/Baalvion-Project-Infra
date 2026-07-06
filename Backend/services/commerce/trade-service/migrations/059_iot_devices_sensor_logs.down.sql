-- Down for 059.
DROP POLICY IF EXISTS tenant_isolation ON tradeops.iot_sensor_logs;
DROP TABLE IF EXISTS tradeops.iot_sensor_logs;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.iot_devices;
DROP TABLE IF EXISTS tradeops.iot_devices;

-- Down for 056.
DROP POLICY IF EXISTS tenant_isolation ON tradeops.geofence_events;
DROP TABLE IF EXISTS tradeops.geofence_events;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.geofences;
DROP TABLE IF EXISTS tradeops.geofences;

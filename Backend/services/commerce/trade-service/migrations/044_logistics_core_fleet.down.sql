-- Down for 044.
DROP POLICY IF EXISTS tenant_isolation ON tradeops.fleet_assignments;
DROP TABLE IF EXISTS tradeops.fleet_assignments;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.drivers;
DROP TABLE IF EXISTS tradeops.drivers;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.vehicles;
DROP TABLE IF EXISTS tradeops.vehicles;

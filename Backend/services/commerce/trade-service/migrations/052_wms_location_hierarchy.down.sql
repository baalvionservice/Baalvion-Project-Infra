-- Down for 052.
DROP POLICY IF EXISTS tenant_isolation ON tradeops.warehouse_bins;
DROP TABLE IF EXISTS tradeops.warehouse_bins;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.warehouse_zones;
DROP TABLE IF EXISTS tradeops.warehouse_zones;

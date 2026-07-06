-- Down for 040.
DROP POLICY IF EXISTS tenant_isolation ON tradeops.packages;
DROP TABLE IF EXISTS tradeops.packages;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.containers;
DROP TABLE IF EXISTS tradeops.containers;

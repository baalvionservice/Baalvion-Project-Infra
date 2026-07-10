-- Down for 043.
DROP POLICY IF EXISTS tenant_isolation ON tradeops.inventory_movements;
DROP TABLE IF EXISTS tradeops.inventory_movements;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.warehouses;
DROP TABLE IF EXISTS tradeops.warehouses;

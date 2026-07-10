-- Down for 045.
DROP POLICY IF EXISTS tenant_isolation ON tradeops.shipment_returns;
DROP TABLE IF EXISTS tradeops.shipment_returns;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.incidents;
DROP TABLE IF EXISTS tradeops.incidents;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.shipment_charges;
DROP TABLE IF EXISTS tradeops.shipment_charges;

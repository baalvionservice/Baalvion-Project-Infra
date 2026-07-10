-- Down for 057.
DROP POLICY IF EXISTS tenant_isolation ON tradeops.shipment_checkpoints;
DROP TABLE IF EXISTS tradeops.shipment_checkpoints;

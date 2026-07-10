-- Down for 058.
DROP POLICY IF EXISTS tenant_isolation ON tradeops.shipment_notifications;
DROP TABLE IF EXISTS tradeops.shipment_notifications;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.shipment_alerts;
DROP TABLE IF EXISTS tradeops.shipment_alerts;

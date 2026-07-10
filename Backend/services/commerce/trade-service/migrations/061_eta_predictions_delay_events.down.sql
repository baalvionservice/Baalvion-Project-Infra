-- Down for 061.
DROP POLICY IF EXISTS tenant_isolation ON tradeops.delay_events;
DROP TABLE IF EXISTS tradeops.delay_events;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.eta_predictions;
DROP TABLE IF EXISTS tradeops.eta_predictions;

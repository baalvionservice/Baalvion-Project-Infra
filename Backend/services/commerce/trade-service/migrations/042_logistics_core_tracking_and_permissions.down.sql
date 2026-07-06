-- Down for 042.
DROP TABLE IF EXISTS tradeops.logistics_role_permissions;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.tracking_events;
DROP TABLE IF EXISTS tradeops.tracking_events;

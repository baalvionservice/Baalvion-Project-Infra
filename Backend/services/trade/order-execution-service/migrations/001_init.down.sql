BEGIN;
DROP POLICY IF EXISTS tenant_isolation ON oms.orders;
ALTER TABLE oms.orders NO FORCE ROW LEVEL SECURITY;
ALTER TABLE oms.orders DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS oms.order_saga_state;
DROP TABLE IF EXISTS oms.processed_webhooks;
DROP TABLE IF EXISTS oms.outbox_events;
-- F3: oms.orders is this service's OWN table (not the shared trade.orders), safe to drop.
DROP TABLE IF EXISTS oms.orders;
COMMIT;

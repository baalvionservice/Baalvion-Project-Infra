-- Down for 041.
ALTER TABLE tradeops.shipments DROP CONSTRAINT IF EXISTS fk_shipments_delivery_address;
ALTER TABLE tradeops.shipments DROP CONSTRAINT IF EXISTS fk_shipments_pickup_address;
DROP INDEX IF EXISTS tradeops.idx_shipments_delivery_address;
DROP INDEX IF EXISTS tradeops.idx_shipments_pickup_address;
ALTER TABLE tradeops.shipments DROP COLUMN IF EXISTS delivery_address_id;
ALTER TABLE tradeops.shipments DROP COLUMN IF EXISTS pickup_address_id;

DROP POLICY IF EXISTS tenant_isolation ON tradeops.logistics_addresses;
DROP TABLE IF EXISTS tradeops.logistics_addresses;

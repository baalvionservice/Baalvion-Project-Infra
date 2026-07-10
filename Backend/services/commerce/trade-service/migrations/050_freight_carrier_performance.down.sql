DROP INDEX IF EXISTS tradeops.idx_freight_bookings_quote;
ALTER TABLE tradeops.freight_bookings DROP CONSTRAINT IF EXISTS fk_freight_bookings_quote;
ALTER TABLE tradeops.freight_bookings DROP COLUMN IF EXISTS quote_id;
DROP TABLE IF EXISTS tradeops.carrier_performance;

-- Revert 002: drop the money-truth columns. (Grants are left in place — harmless.)
BEGIN;
ALTER TABLE oms.orders DROP COLUMN IF EXISTS subtotal;
ALTER TABLE oms.orders DROP COLUMN IF EXISTS duty_amount;
ALTER TABLE oms.orders DROP COLUMN IF EXISTS tax_amount;
ALTER TABLE oms.orders DROP COLUMN IF EXISTS base_currency;
ALTER TABLE oms.orders DROP COLUMN IF EXISTS base_currency_amount;
ALTER TABLE oms.orders DROP COLUMN IF EXISTS fx_rate_used;
ALTER TABLE oms.orders DROP COLUMN IF EXISTS destination_country;
COMMIT;

-- Invoice finance (factoring/discounting) was the only credit product missing a deal/order
-- correlation key — credit.bnpl_plans already has order_ref (see V1__init.sql). Without this,
-- a financed invoice has no way to be traced back to the GTI order/deal it funds, which is why
-- "receives financing" was never actually connected to a real trade.
ALTER TABLE credit.financed_invoices ADD COLUMN IF NOT EXISTS order_ref VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_if_order_ref ON credit.financed_invoices (tenant_id, order_ref);

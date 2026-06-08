-- 002_order_money_truth.sql — R3: persist the server-computed order money breakdown.
-- Additive + idempotent so it upgrades an oms.orders created by 001 (pre-money-truth)
-- without a data wipe. Run as the privileged owner role (MIGRATION_DB_USER).
-- New columns also re-granted to baalvion_app (the RLS-subject app role) below.
BEGIN;

ALTER TABLE oms.orders ADD COLUMN IF NOT EXISTS subtotal             numeric(20,2) NOT NULL DEFAULT 0;
ALTER TABLE oms.orders ADD COLUMN IF NOT EXISTS duty_amount          numeric(20,2) NOT NULL DEFAULT 0;
ALTER TABLE oms.orders ADD COLUMN IF NOT EXISTS tax_amount           numeric(20,2) NOT NULL DEFAULT 0;
ALTER TABLE oms.orders ADD COLUMN IF NOT EXISTS base_currency        varchar(10) NOT NULL DEFAULT 'USD';
ALTER TABLE oms.orders ADD COLUMN IF NOT EXISTS base_currency_amount numeric(20,2) NOT NULL DEFAULT 0;
ALTER TABLE oms.orders ADD COLUMN IF NOT EXISTS fx_rate_used         numeric(18,8) NOT NULL DEFAULT 1;
ALTER TABLE oms.orders ADD COLUMN IF NOT EXISTS destination_country  varchar(2);

-- Ensure the RLS-subject app role can DML the order table + infra tables (idempotent).
GRANT USAGE ON SCHEMA oms TO baalvion_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA oms TO baalvion_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA oms TO baalvion_app;

COMMIT;

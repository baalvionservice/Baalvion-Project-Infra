-- 005_order_payments.sql — consumer-checkout gateway payments for GTI orders.
-- A shopper-facing card/UPI/PayU/bank payment against an oms.orders row, settled provider-
-- authoritatively (Razorpay HMAC / Stripe session / PayU reverse-hash). Distinct from the
-- escrow/internal saga settlement (gtos.order.payment_requested.v1): this is the direct
-- gateway rail. Run as the privileged owner role (MIGRATION_DB_USER); RLS mirrors oms.orders.
BEGIN;

CREATE TABLE IF NOT EXISTS oms.order_payments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid NOT NULL REFERENCES oms.orders(id) ON DELETE CASCADE,
  tenant_id      text NOT NULL,
  gateway        text,                       -- shopper's chosen slug: razorpay|stripe|payu|bank
  provider       text,                       -- capture provider name (razorpay|stripe|payu|bank_transfer|mock)
  intent_id      text NOT NULL,              -- provider intent/order id (razorpay order_, stripe cs_, payu txn, bt_)
  amount         numeric(20,2) NOT NULL DEFAULT 0,
  currency       varchar(10) NOT NULL DEFAULT 'USD',
  status         text NOT NULL DEFAULT 'pending', -- pending|captured|failed
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  paid_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Concurrent intents never duplicate a payment row for the same provider intent.
CREATE UNIQUE INDEX IF NOT EXISTS uq_oes_order_payments_intent ON oms.order_payments (order_id, intent_id);
CREATE INDEX IF NOT EXISTS idx_oes_order_payments_order ON oms.order_payments (order_id);
CREATE INDEX IF NOT EXISTS idx_oes_order_payments_tenant ON oms.order_payments (tenant_id);

-- RLS — identical isolation contract to oms.orders (app.current_tenant GUC, bypass for system jobs).
ALTER TABLE oms.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE oms.order_payments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON oms.order_payments;
CREATE POLICY tenant_isolation ON oms.order_payments
  USING ((current_setting('app.tenant_bypass', true) = 'on')
      OR (current_setting('app.current_tenant', true) IS NOT NULL
          AND current_setting('app.current_tenant', true) <> ''
          AND tenant_id::text = current_setting('app.current_tenant', true)))
  WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on')
      OR (current_setting('app.current_tenant', true) IS NOT NULL
          AND current_setting('app.current_tenant', true) <> ''
          AND tenant_id::text = current_setting('app.current_tenant', true)));

-- The RLS-subject app role can DML this table (idempotent re-grant, matches 002).
GRANT USAGE ON SCHEMA oms TO baalvion_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON oms.order_payments TO baalvion_app;

COMMIT;

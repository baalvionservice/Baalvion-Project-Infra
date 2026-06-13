-- Gateway-checkout vertical (Razorpay / Stripe / PayU): PSP charges initiated via the
-- /v1/gateway/payments contract. Distinct from the legacy interbank payments.transactions
-- table (NIP/VISA/…). Port of the Node GatewayPayment model. No fee/VAT columns —
-- gateway-checkout fees are provider-side. The Idempotency-Key is UNIQUE so a retried
-- create returns the existing charge instead of double-charging.
CREATE TABLE payments.gateway_payments (
  id uuid PRIMARY KEY,
  provider varchar(40) NOT NULL,
  provider_ref varchar(190),
  status varchar(32) NOT NULL DEFAULT 'CREATED',  -- CREATED, AUTHORIZED, CAPTURED, FAILED, REFUNDED
  amount numeric(19, 4) NOT NULL,                  -- MINOR units (paise/cents)
  currency varchar(3) NOT NULL,
  method varchar(20),                              -- CARD, BANK, UPI, NETBANKING
  order_ref varchar(190),
  customer_json jsonb NOT NULL DEFAULT '{}',
  idempotency_key varchar(190) NOT NULL,
  raw_request jsonb,
  raw_response jsonb,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  version bigint,
  CONSTRAINT uk_gateway_idempotency_key UNIQUE (idempotency_key),
  CONSTRAINT check_gateway_amount CHECK (amount > 0),
  CONSTRAINT check_gateway_currency CHECK (length(currency) = 3),
  CONSTRAINT check_gateway_status CHECK (status IN ('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'))
);

-- Lookups: webhook application resolves by (provider, provider_ref); ops by status/order.
CREATE INDEX idx_gwpay_provider_ref ON payments.gateway_payments(provider, provider_ref);
CREATE INDEX idx_gwpay_status ON payments.gateway_payments(status, created_at DESC);
CREATE INDEX idx_gwpay_order_ref ON payments.gateway_payments(order_ref);

-- Grant the non-superuser runtime role baalvion_app DML on the new table. Postgres checks
-- table privileges BEFORE RLS, so without these grants every query fails on permission.
-- Idempotent and role-guarded so it is safe where baalvion_app is not yet provisioned
-- (027_app_role). Mirrors V008__grant_baalvion_app.sql.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'baalvion_app') THEN
    RAISE NOTICE 'baalvion_app role absent — skipping grants for payments.gateway_payments; provision the role (027_app_role) and re-run.';
    RETURN;
  END IF;
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON payments.gateway_payments TO baalvion_app';
END$$;

-- 028_payments_webhook_events.sql — durable webhook idempotency + audit for the
-- proxy-service billing webhooks (Stripe / PayU / Cashfree).
--
-- The Node billing webhook handlers previously deduped with a per-PROCESS in-memory
-- Set: that state is lost on every restart and is NOT shared across instances, so a
-- redelivered or concurrent webhook could be applied twice (double credit / double
-- activation). This table is the restart-durable, instance-shared UNIQUE gate that
-- replaces it — mirroring the Java payment-service gateway_webhook_events (V011) and
-- the order-execution-service processed_webhooks pattern.
--
-- provider_event_id is ALWAYS body-derived (Stripe event.id, PayU txnid) and signature-
-- verified before insert — never an attacker-settable header value.
BEGIN;

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id                 BIGSERIAL    PRIMARY KEY,
  provider           VARCHAR(30)  NOT NULL,   -- stripe | payu | cashfree
  provider_event_id  VARCHAR(255) NOT NULL,   -- body-derived event id (event.id / txnid)
  event_type         VARCHAR(120),
  org_id             UUID,
  amount             NUMERIC(19, 4),          -- major units, as applied (audit/reconciliation)
  currency           VARCHAR(8),
  status             VARCHAR(32)  NOT NULL DEFAULT 'claimed', -- claimed | applied | amount_mismatch | ignored
  applied            BOOLEAN      NOT NULL DEFAULT FALSE,
  received_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  applied_at         TIMESTAMPTZ,
  CONSTRAINT uq_payment_webhook_events UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_received_at
  ON public.payment_webhook_events (received_at);

-- Runtime role grant (idempotent; no-op if the RLS app role does not exist yet — see 027).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'baalvion_app') THEN
    GRANT SELECT, INSERT, UPDATE ON public.payment_webhook_events TO baalvion_app;
    GRANT USAGE, SELECT ON SEQUENCE public.payment_webhook_events_id_seq TO baalvion_app;
  END IF;
END $$;

COMMIT;

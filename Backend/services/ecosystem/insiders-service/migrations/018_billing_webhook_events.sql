-- Durable idempotency for membership fulfilment.
--
-- payment-service calls /v1/billing/fulfill after it has signature-verified a CAPTURED
-- provider webhook. That call is at-least-once: a provider redelivery or a JVM retry must
-- net exactly one membership activation, so the claim lives in the database rather than in
-- process memory.
SET search_path TO insiders, public;

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'claimed',   -- claimed | applied
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The claim itself: one row per (provider, event). A concurrent redelivery loses the insert
-- race rather than activating twice.
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_webhook_events_claim
  ON billing_webhook_events(provider, event_id);

DROP TRIGGER IF EXISTS billing_webhook_events_updated_at ON billing_webhook_events;
CREATE TRIGGER billing_webhook_events_updated_at BEFORE UPDATE ON billing_webhook_events
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Migration 032: Community Service billing webhook dedup
-- Run once against baalvion_db after migration 031.
--
-- Backs the paid-tier community checkout (crypto USDT/BTC via payment-service's gateway-checkout
-- vertical, provider=crypto). community_memberships already reserves tier/amount_usd/currency/
-- payment_ref/expires_at columns (031) — this migration adds only the durable idempotency table
-- for the fulfill webhook, mirroring proxy-service's payment_webhook_events pattern.

SET search_path TO community, public;

ALTER TABLE community.communities
  ADD COLUMN IF NOT EXISTS price_usd_cents INTEGER;

CREATE TABLE IF NOT EXISTS community.community_billing_webhook_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider     VARCHAR(40) NOT NULL,
    event_id     VARCHAR(190) NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed','applied')),
    payload      JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, event_id)
);

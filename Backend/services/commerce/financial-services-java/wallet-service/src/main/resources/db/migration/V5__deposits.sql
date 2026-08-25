-- Deposit tracking: a user-initiated top-up of their wallet balance, paid via payment-service's
-- crypto gateway. One row per deposit attempt; the wallet balance itself is only ever mutated by
-- the idempotent /billing/fulfill callback once payment-service confirms CAPTURED on-chain.
CREATE TABLE IF NOT EXISTS wallet.wallet_deposits (
  id                 UUID PRIMARY KEY,
  tenant_id          UUID NOT NULL,
  wallet_id          UUID NOT NULL REFERENCES wallet.wallets (id),
  holder_id          UUID NOT NULL,
  currency           VARCHAR(3) NOT NULL DEFAULT 'USD',
  amount             NUMERIC(19,4) NOT NULL,
  asset              VARCHAR(20) NOT NULL,          -- USDT_TRC20, ETH_BEP20, BTC — mirrors giftcard's CryptoAsset
  provider_charge_id UUID,                          -- payment-service GatewayPayment.id (opaque here, stored for support/debug only)
  status             VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, credited, failed, expired
  fulfillment_error  TEXT,
  created_at         TIMESTAMP NOT NULL DEFAULT now(),
  credited_at        TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wallet_deposits_holder ON wallet.wallet_deposits (holder_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_deposits_wallet ON wallet.wallet_deposits (wallet_id);

-- Idempotent fulfillment claim for payment-service's BillingFulfillmentClient callback — mirrors
-- giftcard-service's gift_card_billing_webhook_events exactly. Provider event ids (e.g. a crypto
-- tx hash) are NOT UUID-shaped, so this cannot reuse wallet.processed_events (UUID-keyed inbox,
-- currently unused, scaffolded for a future Kafka consumer — not a fit here).
CREATE TABLE IF NOT EXISTS wallet.wallet_billing_webhook_events (
  id           UUID PRIMARY KEY,
  provider     VARCHAR(40) NOT NULL,
  event_id     VARCHAR(160) NOT NULL,
  status       VARCHAR(10) NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed','applied')),
  payload      JSONB,
  created_at   TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

-- RLS: wallet_deposits is tenant-scoped like every other table in this schema (see V3__rls.sql).
-- wallet_billing_webhook_events has no tenant_id (mirrors the documented V3 rationale for
-- skipping wallet.processed_events: an inbox dedup table isn't tenant-scoped) — deliberately left
-- unprotected by RLS, same as its giftcard-service counterpart.
ALTER TABLE wallet.wallet_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet.wallet_deposits FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallet_deposits_tenant_isolation ON wallet.wallet_deposits;
CREATE POLICY wallet_deposits_tenant_isolation ON wallet.wallet_deposits
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- No separate grant migration needed: V4__grant_baalvion_app.sql used ALTER DEFAULT PRIVILEGES,
-- which already covers tables created after it by the same (schema-owner) role.

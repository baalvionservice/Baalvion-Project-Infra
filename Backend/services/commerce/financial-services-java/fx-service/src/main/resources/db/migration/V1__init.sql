-- FX domain: market rates (shared reference data) + tenant-scoped locks, conversions, forwards.
CREATE SCHEMA IF NOT EXISTS fx;

-- Latest published rate snapshot per currency pair (market reference data — not tenant scoped).
CREATE TABLE IF NOT EXISTS fx.fx_rates (
  id              UUID PRIMARY KEY,
  base_currency   VARCHAR(3) NOT NULL,
  quote_currency  VARCHAR(3) NOT NULL,
  mid_rate        NUMERIC(19,8) NOT NULL,
  bid_rate        NUMERIC(19,8) NOT NULL,
  ask_rate        NUMERIC(19,8) NOT NULL,
  source          VARCHAR(40) NOT NULL,
  as_of           TIMESTAMP NOT NULL DEFAULT now(),
  ttl_seconds     INT NOT NULL DEFAULT 30
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_fx_pair ON fx.fx_rates (base_currency, quote_currency);

-- A rate-lock: a firm quote held for a validity window, optionally executed into a conversion.
CREATE TABLE IF NOT EXISTS fx.fx_rate_locks (
  id              UUID PRIMARY KEY,
  tenant_id       UUID NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  sell_currency   VARCHAR(3) NOT NULL,
  buy_currency    VARCHAR(3) NOT NULL,
  sell_amount     NUMERIC(19,4) NOT NULL,
  buy_amount      NUMERIC(19,4) NOT NULL,
  locked_rate     NUMERIC(19,8) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'LOCKED', -- LOCKED, EXECUTED, EXPIRED, CANCELLED
  created_by      VARCHAR(255),
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  expires_at      TIMESTAMP NOT NULL,
  executed_at     TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_fx_lock_idem ON fx.fx_rate_locks (tenant_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_fx_lock_status     ON fx.fx_rate_locks (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_fx_lock_tenant     ON fx.fx_rate_locks (tenant_id, status);

-- An executed FX conversion (spot, or execution of a rate-lock / forward).
CREATE TABLE IF NOT EXISTS fx.fx_conversions (
  id              UUID PRIMARY KEY,
  tenant_id       UUID NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  sell_currency   VARCHAR(3) NOT NULL,
  buy_currency    VARCHAR(3) NOT NULL,
  sell_amount     NUMERIC(19,4) NOT NULL,
  buy_amount      NUMERIC(19,4) NOT NULL,
  rate            NUMERIC(19,8) NOT NULL,
  deal_type       VARCHAR(20) NOT NULL DEFAULT 'SPOT',   -- SPOT, RATE_LOCK, FORWARD
  rate_lock_id    UUID,
  forward_id      UUID,
  status          VARCHAR(20) NOT NULL DEFAULT 'EXECUTED', -- EXECUTED, SETTLED
  created_by      VARCHAR(255),
  created_at      TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_fx_conv_idem ON fx.fx_conversions (tenant_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_fx_conv_tenant     ON fx.fx_conversions (tenant_id, created_at);

-- A forward contract: a rate locked today for settlement on a future value date.
CREATE TABLE IF NOT EXISTS fx.fx_forwards (
  id                 UUID PRIMARY KEY,
  tenant_id          UUID NOT NULL,
  idempotency_key    VARCHAR(255) NOT NULL,
  sell_currency      VARCHAR(3) NOT NULL,
  buy_currency       VARCHAR(3) NOT NULL,
  notional_amount    NUMERIC(19,4) NOT NULL,             -- in sell currency
  spot_rate_at_book  NUMERIC(19,8) NOT NULL,
  forward_rate       NUMERIC(19,8) NOT NULL,
  forward_points     NUMERIC(19,8) NOT NULL DEFAULT 0,
  buy_amount         NUMERIC(19,4) NOT NULL,             -- notional * forward_rate
  value_date         DATE NOT NULL,
  tenor_days         INT NOT NULL,
  margin_rate        NUMERIC(9,6) NOT NULL DEFAULT 0,
  margin_amount      NUMERIC(19,4) NOT NULL DEFAULT 0,
  status             VARCHAR(20) NOT NULL DEFAULT 'BOOKED', -- BOOKED, SETTLED, CANCELLED
  created_by         VARCHAR(255),
  created_at         TIMESTAMP NOT NULL DEFAULT now(),
  settled_at         TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_fx_fwd_idem ON fx.fx_forwards (tenant_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_fx_fwd_status     ON fx.fx_forwards (status, value_date);
CREATE INDEX IF NOT EXISTS idx_fx_fwd_tenant     ON fx.fx_forwards (tenant_id, status);

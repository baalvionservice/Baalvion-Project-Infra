-- Wallet domain: per-holder multi-currency balances + an append-only movement ledger.
CREATE SCHEMA IF NOT EXISTS wallet;

-- A wallet belongs to a holder (user or organization) within a tenant.
CREATE TABLE IF NOT EXISTS wallet.wallets (
  id               UUID PRIMARY KEY,
  tenant_id        UUID NOT NULL,
  holder_id        UUID NOT NULL,
  holder_type      VARCHAR(20) NOT NULL DEFAULT 'USER',   -- USER, ORGANIZATION, MERCHANT, PLATFORM
  status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, FROZEN, CLOSED
  default_currency VARCHAR(3),
  label            VARCHAR(255),
  created_by       VARCHAR(255),
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMP NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_tenant_holder ON wallet.wallets (tenant_id, holder_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tenant ON wallet.wallets (tenant_id, status);

-- One balance row per (wallet, currency). available = spendable; held = reserved by active holds.
CREATE TABLE IF NOT EXISTS wallet.wallet_balances (
  id           UUID PRIMARY KEY,
  wallet_id    UUID NOT NULL REFERENCES wallet.wallets (id),
  tenant_id    UUID NOT NULL,
  currency     VARCHAR(3) NOT NULL,
  available    NUMERIC(19,4) NOT NULL DEFAULT 0,
  held         NUMERIC(19,4) NOT NULL DEFAULT 0,
  version      BIGINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT now(),
  updated_at   TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_balance_wallet_ccy ON wallet.wallet_balances (wallet_id, currency);
CREATE INDEX IF NOT EXISTS idx_balance_tenant ON wallet.wallet_balances (tenant_id, currency);

-- Append-only ledger of every balance movement.
CREATE TABLE IF NOT EXISTS wallet.wallet_entries (
  id               UUID PRIMARY KEY,
  wallet_id        UUID NOT NULL REFERENCES wallet.wallets (id),
  tenant_id        UUID NOT NULL,
  currency         VARCHAR(3) NOT NULL,
  direction        VARCHAR(8) NOT NULL,                   -- CREDIT, DEBIT
  entry_type       VARCHAR(20) NOT NULL,                  -- DEPOSIT, WITHDRAWAL, HOLD, RELEASE, CAPTURE, TRANSFER_IN, TRANSFER_OUT, CONVERT_IN, CONVERT_OUT, ADJUSTMENT
  amount           NUMERIC(19,4) NOT NULL,
  balance_after    NUMERIC(19,4) NOT NULL,
  idempotency_key  VARCHAR(255) NOT NULL,
  reference        VARCHAR(255),
  related_entry_id UUID,
  created_by       VARCHAR(255),
  created_at       TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_entry_tenant_idem ON wallet.wallet_entries (tenant_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_entry_wallet ON wallet.wallet_entries (wallet_id, created_at);

-- Reserved funds (e.g. pending payout / authorization), later captured or released.
CREATE TABLE IF NOT EXISTS wallet.wallet_holds (
  id           UUID PRIMARY KEY,
  wallet_id    UUID NOT NULL REFERENCES wallet.wallets (id),
  tenant_id    UUID NOT NULL,
  currency     VARCHAR(3) NOT NULL,
  amount       NUMERIC(19,4) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',     -- ACTIVE, RELEASED, CAPTURED, EXPIRED
  reference    VARCHAR(255),
  created_by   VARCHAR(255),
  created_at   TIMESTAMP NOT NULL DEFAULT now(),
  expires_at   TIMESTAMP,
  resolved_at  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hold_wallet ON wallet.wallet_holds (wallet_id, status);
CREATE INDEX IF NOT EXISTS idx_hold_status ON wallet.wallet_holds (status, expires_at);

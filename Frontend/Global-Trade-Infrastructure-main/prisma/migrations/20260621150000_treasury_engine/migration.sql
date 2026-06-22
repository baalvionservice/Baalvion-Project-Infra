-- Phase 2 Treasury Engine: wallets, treasury accounts, FX, fees, liquidity.
-- Built ON TOP of the immutable settlement ledger: wallet balances are DERIVED
-- from ledger accounts/entries. The only mutable balance rows are the cached
-- wallet_projections; liquidity_positions, fx_trades and fee_transactions are
-- append-only. Every row is tenant-owned (organizationId NOT NULL) and RLS-scoped.

-- ── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE "WalletType" AS ENUM (
  'USER', 'COMPANY', 'MERCHANT', 'ESCROW', 'RESERVE', 'TREASURY', 'VIRTUAL', 'SETTLEMENT', 'INTEREST'
);
CREATE TYPE "TreasuryAccountKind" AS ENUM (
  'OPERATING', 'SETTLEMENT', 'RESERVE', 'LIQUIDITY', 'ESCROW', 'INTEREST', 'FX', 'FEE', 'SUSPENSE'
);
CREATE TYPE "FeeType" AS ENUM ('FLAT', 'PERCENTAGE', 'TIER');
CREATE TYPE "FXQuoteStatus" AS ENUM ('QUOTED', 'LOCKED', 'EXPIRED', 'EXECUTED', 'CANCELLED');
CREATE TYPE "FXTradeStatus" AS ENUM ('EXECUTED', 'REVERSED');

-- ── treasury_accounts ────────────────────────────────────────────────────────
CREATE TABLE "treasury_accounts" (
  "id"              UUID NOT NULL,
  "organizationId"  UUID NOT NULL,
  "kind"            "TreasuryAccountKind" NOT NULL,
  "currency"        TEXT NOT NULL,
  "ledgerAccountId" UUID NOT NULL,
  "status"          TEXT NOT NULL DEFAULT 'ACTIVE',
  "metadata"        JSONB,
  "version"         INTEGER NOT NULL DEFAULT 1,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "deletedAt"       TIMESTAMP(3),
  CONSTRAINT "treasury_accounts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "treasury_accounts_organizationId_idx" ON "treasury_accounts"("organizationId");
CREATE INDEX "treasury_accounts_kind_idx" ON "treasury_accounts"("kind");
CREATE INDEX "treasury_accounts_currency_idx" ON "treasury_accounts"("currency");
CREATE INDEX "treasury_accounts_deletedAt_idx" ON "treasury_accounts"("deletedAt");
CREATE UNIQUE INDEX "treasury_accounts_org_kind_currency_uq"
  ON "treasury_accounts"("organizationId", "kind", "currency") WHERE "deletedAt" IS NULL;

-- ── wallets ──────────────────────────────────────────────────────────────────
CREATE TABLE "wallets" (
  "id"                 UUID NOT NULL,
  "organizationId"     UUID NOT NULL,
  "type"               "WalletType" NOT NULL,
  "ownerOrgId"         UUID,
  "ownerRef"           TEXT,
  "currency"           TEXT NOT NULL DEFAULT 'USD',
  "status"             TEXT NOT NULL DEFAULT 'ACTIVE',
  "reference"          TEXT,
  "availableAccountId" UUID NOT NULL,
  "heldAccountId"      UUID NOT NULL,
  "reservedAccountId"  UUID NOT NULL,
  "pendingAccountId"   UUID NOT NULL,
  "metadata"           JSONB,
  "version"            INTEGER NOT NULL DEFAULT 1,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,
  "deletedAt"          TIMESTAMP(3),
  CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "wallets_organizationId_idx" ON "wallets"("organizationId");
CREATE INDEX "wallets_type_idx" ON "wallets"("type");
CREATE INDEX "wallets_ownerOrgId_idx" ON "wallets"("ownerOrgId");
CREATE INDEX "wallets_currency_idx" ON "wallets"("currency");
CREATE INDEX "wallets_deletedAt_idx" ON "wallets"("deletedAt");
CREATE UNIQUE INDEX "wallets_org_reference_uq"
  ON "wallets"("organizationId", "reference") WHERE "reference" IS NOT NULL AND "deletedAt" IS NULL;

-- ── wallet_projections (cached, recomputable) ────────────────────────────────
CREATE TABLE "wallet_projections" (
  "id"               UUID NOT NULL,
  "organizationId"   UUID NOT NULL,
  "walletId"         UUID NOT NULL,
  "currency"         TEXT NOT NULL,
  "available"        DECIMAL(20,4) NOT NULL,
  "held"             DECIMAL(20,4) NOT NULL,
  "reserved"         DECIMAL(20,4) NOT NULL,
  "pending"          DECIMAL(20,4) NOT NULL,
  "incoming"         DECIMAL(20,4) NOT NULL,
  "outgoing"         DECIMAL(20,4) NOT NULL,
  "total"            DECIMAL(20,4) NOT NULL,
  "projected"        DECIMAL(20,4) NOT NULL,
  "computedAt"       TIMESTAMP(3) NOT NULL,
  "sourceEntryCount" INTEGER NOT NULL DEFAULT 0,
  "version"          INTEGER NOT NULL DEFAULT 1,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "wallet_projections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "wallet_projections_walletId_key" ON "wallet_projections"("walletId");
CREATE INDEX "wallet_projections_organizationId_idx" ON "wallet_projections"("organizationId");

-- ── fx_quotes ────────────────────────────────────────────────────────────────
CREATE TABLE "fx_quotes" (
  "id"             UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "reference"      TEXT,
  "baseCurrency"   TEXT NOT NULL,
  "quoteCurrency"  TEXT NOT NULL,
  "baseAmount"     DECIMAL(20,4),
  "midRate"        DECIMAL(20,8) NOT NULL,
  "spreadBps"      INTEGER NOT NULL,
  "marginBps"      INTEGER NOT NULL,
  "allInRate"      DECIMAL(20,8) NOT NULL,
  "quoteAmount"    DECIMAL(20,4),
  "status"         "FXQuoteStatus" NOT NULL DEFAULT 'QUOTED',
  "rateSource"     TEXT NOT NULL DEFAULT 'internal',
  "expiresAt"      TIMESTAMP(3) NOT NULL,
  "lockedUntil"    TIMESTAMP(3),
  "correlationId"  TEXT NOT NULL,
  "metadata"       JSONB,
  "version"        INTEGER NOT NULL DEFAULT 1,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "fx_quotes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fx_quotes_bps_nonneg" CHECK ("spreadBps" >= 0 AND "marginBps" >= 0),
  CONSTRAINT "fx_quotes_rates_positive" CHECK ("midRate" > 0 AND "allInRate" > 0)
);
CREATE INDEX "fx_quotes_organizationId_idx" ON "fx_quotes"("organizationId");
CREATE INDEX "fx_quotes_status_idx" ON "fx_quotes"("status");
CREATE INDEX "fx_quotes_baseCurrency_quoteCurrency_idx" ON "fx_quotes"("baseCurrency", "quoteCurrency");
CREATE INDEX "fx_quotes_createdAt_idx" ON "fx_quotes"("createdAt");
CREATE UNIQUE INDEX "fx_quotes_org_reference_uq"
  ON "fx_quotes"("organizationId", "reference") WHERE "reference" IS NOT NULL;

-- ── fx_trades (append-only; status may flip to REVERSED) ─────────────────────
CREATE TABLE "fx_trades" (
  "id"               UUID NOT NULL,
  "organizationId"   UUID NOT NULL,
  "quoteId"          UUID NOT NULL,
  "reference"        TEXT,
  "baseCurrency"     TEXT NOT NULL,
  "quoteCurrency"    TEXT NOT NULL,
  "baseAmount"       DECIMAL(20,4) NOT NULL,
  "quoteAmount"      DECIMAL(20,4) NOT NULL,
  "allInRate"        DECIMAL(20,8) NOT NULL,
  "status"           "FXTradeStatus" NOT NULL DEFAULT 'EXECUTED',
  "baseLedgerTxnId"  UUID NOT NULL,
  "quoteLedgerTxnId" UUID NOT NULL,
  "correlationId"    TEXT NOT NULL,
  "metadata"         JSONB,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fx_trades_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fx_trades_amounts_positive" CHECK ("baseAmount" > 0 AND "quoteAmount" > 0)
);
CREATE INDEX "fx_trades_organizationId_idx" ON "fx_trades"("organizationId");
CREATE INDEX "fx_trades_quoteId_idx" ON "fx_trades"("quoteId");
CREATE INDEX "fx_trades_status_idx" ON "fx_trades"("status");
CREATE INDEX "fx_trades_createdAt_idx" ON "fx_trades"("createdAt");
-- A quote executes at most once.
CREATE UNIQUE INDEX "fx_trades_quoteId_uq" ON "fx_trades"("quoteId");
CREATE UNIQUE INDEX "fx_trades_org_reference_uq"
  ON "fx_trades"("organizationId", "reference") WHERE "reference" IS NOT NULL;

-- ── liquidity_positions (append-only snapshots) ──────────────────────────────
CREATE TABLE "liquidity_positions" (
  "id"                 UUID NOT NULL,
  "organizationId"     UUID NOT NULL,
  "currency"           TEXT NOT NULL,
  "asOf"               TIMESTAMP(3) NOT NULL,
  "currentPosition"    DECIMAL(20,4) NOT NULL,
  "availableLiquidity" DECIMAL(20,4) NOT NULL,
  "reserved"           DECIMAL(20,4) NOT NULL,
  "exposure"           DECIMAL(20,4) NOT NULL,
  "forecast"           DECIMAL(20,4) NOT NULL,
  "reserveRatioBps"    INTEGER NOT NULL DEFAULT 0,
  "metadata"           JSONB,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "liquidity_positions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "liquidity_positions_organizationId_idx" ON "liquidity_positions"("organizationId");
CREATE INDEX "liquidity_positions_currency_idx" ON "liquidity_positions"("currency");
CREATE INDEX "liquidity_positions_asOf_idx" ON "liquidity_positions"("asOf");
CREATE UNIQUE INDEX "liquidity_positions_org_currency_asof_uq"
  ON "liquidity_positions"("organizationId", "currency", "asOf");

-- ── fee_rules ────────────────────────────────────────────────────────────────
CREATE TABLE "fee_rules" (
  "id"             UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "code"           TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "type"           "FeeType" NOT NULL,
  "scope"          TEXT NOT NULL,
  "currency"       TEXT NOT NULL,
  "basisPoints"    INTEGER,
  "flatAmount"     DECIMAL(20,4),
  "tiers"          JSONB,
  "minFee"         DECIMAL(20,4),
  "maxFee"         DECIMAL(20,4),
  "feeAccountId"   UUID,
  "country"        TEXT,
  "priority"       INTEGER NOT NULL DEFAULT 0,
  "status"         TEXT NOT NULL DEFAULT 'ACTIVE',
  "effectiveFrom"  TIMESTAMP(3),
  "effectiveTo"    TIMESTAMP(3),
  "metadata"       JSONB,
  "version"        INTEGER NOT NULL DEFAULT 1,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  "deletedAt"      TIMESTAMP(3),
  CONSTRAINT "fee_rules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fee_rules_bps_nonneg" CHECK ("basisPoints" IS NULL OR "basisPoints" >= 0)
);
CREATE INDEX "fee_rules_organizationId_idx" ON "fee_rules"("organizationId");
CREATE INDEX "fee_rules_scope_idx" ON "fee_rules"("scope");
CREATE INDEX "fee_rules_currency_idx" ON "fee_rules"("currency");
CREATE INDEX "fee_rules_status_idx" ON "fee_rules"("status");
CREATE INDEX "fee_rules_deletedAt_idx" ON "fee_rules"("deletedAt");
CREATE UNIQUE INDEX "fee_rules_org_code_uq"
  ON "fee_rules"("organizationId", "code") WHERE "deletedAt" IS NULL;

-- ── fee_transactions (append-only) ───────────────────────────────────────────
CREATE TABLE "fee_transactions" (
  "id"                  UUID NOT NULL,
  "organizationId"      UUID NOT NULL,
  "feeRuleId"           UUID,
  "reference"           TEXT,
  "scope"               TEXT NOT NULL,
  "baseAmount"          DECIMAL(20,4) NOT NULL,
  "feeAmount"           DECIMAL(20,4) NOT NULL,
  "currency"            TEXT NOT NULL,
  "ledgerTransactionId" UUID,
  "sourceType"          TEXT,
  "sourceId"            UUID,
  "correlationId"       TEXT NOT NULL,
  "metadata"            JSONB,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fee_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fee_transactions_amounts_nonneg" CHECK ("baseAmount" >= 0 AND "feeAmount" >= 0)
);
CREATE INDEX "fee_transactions_organizationId_idx" ON "fee_transactions"("organizationId");
CREATE INDEX "fee_transactions_feeRuleId_idx" ON "fee_transactions"("feeRuleId");
CREATE INDEX "fee_transactions_scope_idx" ON "fee_transactions"("scope");
CREATE INDEX "fee_transactions_createdAt_idx" ON "fee_transactions"("createdAt");
CREATE UNIQUE INDEX "fee_transactions_org_reference_uq"
  ON "fee_transactions"("organizationId", "reference") WHERE "reference" IS NOT NULL;

-- ── Least-privilege grants ───────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON
  "treasury_accounts", "wallets", "wallet_projections", "fx_quotes",
  "fx_trades", "liquidity_positions", "fee_rules", "fee_transactions"
  TO baalvion_app;

-- ── Row-Level Security: every row is strictly tenant-scoped ──────────────────
DO $rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'treasury_accounts', 'wallets', 'wallet_projections', 'fx_quotes',
    'fx_trades', 'liquidity_positions', 'fee_rules', 'fee_transactions'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($pol$
      CREATE POLICY tenant_read ON %I FOR SELECT USING (
        current_setting('app.current_tenant', true) IS NOT NULL
        AND current_setting('app.current_tenant', true) <> ''
        AND "organizationId" = current_setting('app.current_tenant', true)::uuid
      )
    $pol$, t);
    EXECUTE format($pol$
      CREATE POLICY tenant_insert ON %I FOR INSERT WITH CHECK (
        current_setting('app.current_tenant', true) IS NOT NULL
        AND current_setting('app.current_tenant', true) <> ''
        AND "organizationId" = current_setting('app.current_tenant', true)::uuid
      )
    $pol$, t);
    EXECUTE format($pol$
      CREATE POLICY tenant_update ON %I FOR UPDATE USING (
        current_setting('app.current_tenant', true) IS NOT NULL
        AND current_setting('app.current_tenant', true) <> ''
        AND "organizationId" = current_setting('app.current_tenant', true)::uuid
      )
    $pol$, t);
    EXECUTE format($pol$
      CREATE POLICY tenant_delete ON %I FOR DELETE USING (
        current_setting('app.current_tenant', true) IS NOT NULL
        AND current_setting('app.current_tenant', true) <> ''
        AND "organizationId" = current_setting('app.current_tenant', true)::uuid
      )
    $pol$, t);
  END LOOP;
END
$rls$;

-- ── Immutability ─────────────────────────────────────────────────────────────
-- liquidity_positions and fee_transactions are fully append-only (reuse
-- enforce_append_only() from the tenant-isolation migration).
CREATE TRIGGER liquidity_positions_no_mutate
  BEFORE UPDATE OR DELETE ON "liquidity_positions"
  FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
CREATE TRIGGER fee_transactions_no_mutate
  BEFORE UPDATE OR DELETE ON "fee_transactions"
  FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

-- fx_trades may flip status to REVERSED but are never deleted (reuse
-- enforce_no_delete() from the settlement-ledger migration).
CREATE TRIGGER fx_trades_no_delete
  BEFORE DELETE ON "fx_trades"
  FOR EACH ROW EXECUTE FUNCTION enforce_no_delete();

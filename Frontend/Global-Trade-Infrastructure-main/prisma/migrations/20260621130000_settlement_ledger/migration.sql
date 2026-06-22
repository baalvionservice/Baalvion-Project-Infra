-- Phase 2 Settlement Ledger: an immutable double-entry ledger and the
-- settlement-instruction state machine that posts to it.
--
-- Tables: ledger_accounts, ledger_transactions, ledger_entries,
-- settlement_instructions. Every row is tenant-owned (organizationId NOT NULL)
-- and RLS-scoped to its tenant. ledger_entries are append-only; a
-- ledger_transaction is immutable except for the reversal-linkage status flip
-- (DELETE is forbidden — corrections are made by a reversing transaction).

-- ── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE "LedgerAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
CREATE TYPE "LedgerNormalSide" AS ENUM ('DEBIT', 'CREDIT');
CREATE TYPE "LedgerEntryDirection" AS ENUM ('DEBIT', 'CREDIT');
CREATE TYPE "LedgerTxnStatus" AS ENUM ('POSTED', 'REVERSED');
CREATE TYPE "SettlementInstrStatus" AS ENUM (
  'CREATED', 'AUTHORIZED', 'CAPTURED', 'PARTIALLY_SETTLED', 'SETTLED', 'FAILED', 'CANCELLED', 'REVERSED'
);
CREATE TYPE "SettlementRail" AS ENUM (
  'INTERNAL', 'SWIFT', 'SEPA', 'FEDWIRE', 'RTGS', 'ACH', 'UPI', 'NEFT', 'IMPS', 'FPS', 'BACS'
);

-- ── ledger_accounts ──────────────────────────────────────────────────────────
CREATE TABLE "ledger_accounts" (
  "id"             UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "code"           TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "type"           "LedgerAccountType" NOT NULL,
  "purpose"        TEXT NOT NULL DEFAULT 'OPERATING',
  "normalSide"     "LedgerNormalSide" NOT NULL,
  "currency"       TEXT NOT NULL DEFAULT 'USD',
  "status"         TEXT NOT NULL DEFAULT 'ACTIVE',
  "allowNegative"  BOOLEAN NOT NULL DEFAULT false,
  "balance"        DECIMAL(20,4) NOT NULL DEFAULT 0,
  "ownerOrgId"     UUID,
  "metadata"       JSONB,
  "version"        INTEGER NOT NULL DEFAULT 1,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  "deletedAt"      TIMESTAMP(3),
  CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ledger_accounts_organizationId_idx" ON "ledger_accounts"("organizationId");
CREATE INDEX "ledger_accounts_code_idx" ON "ledger_accounts"("code");
CREATE INDEX "ledger_accounts_purpose_idx" ON "ledger_accounts"("purpose");
CREATE INDEX "ledger_accounts_ownerOrgId_idx" ON "ledger_accounts"("ownerOrgId");
CREATE INDEX "ledger_accounts_deletedAt_idx" ON "ledger_accounts"("deletedAt");
-- One live account code per tenant.
CREATE UNIQUE INDEX "ledger_accounts_org_code_uq" ON "ledger_accounts"("organizationId", "code") WHERE "deletedAt" IS NULL;

-- ── ledger_transactions (immutable; corrected by reversal) ───────────────────
CREATE TABLE "ledger_transactions" (
  "id"             UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "reference"      TEXT,
  "description"    TEXT,
  "status"         "LedgerTxnStatus" NOT NULL DEFAULT 'POSTED',
  "currency"       TEXT NOT NULL,
  "amount"         DECIMAL(20,4) NOT NULL,
  "tradeId"        UUID,
  "correlationId"  TEXT NOT NULL,
  "source"         TEXT NOT NULL DEFAULT 'ledger',
  "reversalOfId"   UUID,
  "reversedById"   UUID,
  "postedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata"       JSONB,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ledger_transactions_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "ledger_transactions_reversalOfId_fkey"
    FOREIGN KEY ("reversalOfId") REFERENCES "ledger_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ledger_transactions_organizationId_idx" ON "ledger_transactions"("organizationId");
CREATE INDEX "ledger_transactions_correlationId_idx" ON "ledger_transactions"("correlationId");
CREATE INDEX "ledger_transactions_tradeId_idx" ON "ledger_transactions"("tradeId");
CREATE INDEX "ledger_transactions_status_idx" ON "ledger_transactions"("status");
CREATE INDEX "ledger_transactions_createdAt_idx" ON "ledger_transactions"("createdAt");
-- Idempotent posting: one transaction per (tenant, external reference).
CREATE UNIQUE INDEX "ledger_transactions_org_reference_uq"
  ON "ledger_transactions"("organizationId", "reference") WHERE "reference" IS NOT NULL;

-- ── ledger_entries (append-only) ─────────────────────────────────────────────
CREATE TABLE "ledger_entries" (
  "id"             UUID NOT NULL,
  "transactionId"  UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "accountId"      UUID NOT NULL,
  "direction"      "LedgerEntryDirection" NOT NULL,
  "amount"         DECIMAL(20,4) NOT NULL,
  "currency"       TEXT NOT NULL,
  "balanceAfter"   DECIMAL(20,4) NOT NULL,
  "memo"           TEXT,
  "sequence"       INTEGER NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ledger_entries_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "ledger_entries_transactionId_fkey"
    FOREIGN KEY ("transactionId") REFERENCES "ledger_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ledger_entries_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "ledger_entries_transactionId_idx" ON "ledger_entries"("transactionId");
CREATE INDEX "ledger_entries_accountId_idx" ON "ledger_entries"("accountId");
CREATE INDEX "ledger_entries_organizationId_idx" ON "ledger_entries"("organizationId");
CREATE INDEX "ledger_entries_createdAt_idx" ON "ledger_entries"("createdAt");
-- Each account appears at most once per transaction (legs are pre-aggregated).
CREATE UNIQUE INDEX "ledger_entries_txn_account_uq" ON "ledger_entries"("transactionId", "accountId");

-- ── settlement_instructions ──────────────────────────────────────────────────
CREATE TABLE "settlement_instructions" (
  "id"                UUID NOT NULL,
  "organizationId"    UUID NOT NULL,
  "reference"         TEXT,
  "status"            "SettlementInstrStatus" NOT NULL DEFAULT 'CREATED',
  "rail"              "SettlementRail" NOT NULL DEFAULT 'INTERNAL',
  "currency"          TEXT NOT NULL DEFAULT 'USD',
  "amount"            DECIMAL(20,4) NOT NULL,
  "settledAmount"     DECIMAL(20,4) NOT NULL DEFAULT 0,
  "payerAccountId"    UUID NOT NULL,
  "clearingAccountId" UUID NOT NULL,
  "payeeAccountId"    UUID NOT NULL,
  "tradeId"           UUID,
  "escrowId"          UUID,
  "priority"          INTEGER NOT NULL DEFAULT 0,
  "scheduledAt"       TIMESTAMP(3),
  "correlationId"     TEXT NOT NULL,
  "metadata"          JSONB,
  "version"           INTEGER NOT NULL DEFAULT 1,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  "deletedAt"         TIMESTAMP(3),
  CONSTRAINT "settlement_instructions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "settlement_instructions_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "settlement_instructions_settled_bounds" CHECK ("settledAmount" >= 0 AND "settledAmount" <= "amount")
);
CREATE INDEX "settlement_instructions_organizationId_idx" ON "settlement_instructions"("organizationId");
CREATE INDEX "settlement_instructions_status_idx" ON "settlement_instructions"("status");
CREATE INDEX "settlement_instructions_tradeId_idx" ON "settlement_instructions"("tradeId");
CREATE INDEX "settlement_instructions_escrowId_idx" ON "settlement_instructions"("escrowId");
CREATE INDEX "settlement_instructions_deletedAt_idx" ON "settlement_instructions"("deletedAt");

-- ── Least-privilege grants (role from the tenant-isolation migration) ────────
GRANT SELECT, INSERT, UPDATE, DELETE ON
  "ledger_accounts", "ledger_transactions", "ledger_entries", "settlement_instructions"
  TO baalvion_app;

-- ── Row-Level Security: every row is strictly tenant-scoped ──────────────────
DO $rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ledger_accounts', 'ledger_transactions', 'ledger_entries', 'settlement_instructions']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($pol$
      CREATE POLICY tenant_read ON %I
        FOR SELECT
        USING (
          current_setting('app.current_tenant', true) IS NOT NULL
          AND current_setting('app.current_tenant', true) <> ''
          AND "organizationId" = current_setting('app.current_tenant', true)::uuid
        )
    $pol$, t);
    EXECUTE format($pol$
      CREATE POLICY tenant_insert ON %I
        FOR INSERT
        WITH CHECK (
          current_setting('app.current_tenant', true) IS NOT NULL
          AND current_setting('app.current_tenant', true) <> ''
          AND "organizationId" = current_setting('app.current_tenant', true)::uuid
        )
    $pol$, t);
    EXECUTE format($pol$
      CREATE POLICY tenant_update ON %I
        FOR UPDATE
        USING (
          current_setting('app.current_tenant', true) IS NOT NULL
          AND current_setting('app.current_tenant', true) <> ''
          AND "organizationId" = current_setting('app.current_tenant', true)::uuid
        )
    $pol$, t);
    EXECUTE format($pol$
      CREATE POLICY tenant_delete ON %I
        FOR DELETE
        USING (
          current_setting('app.current_tenant', true) IS NOT NULL
          AND current_setting('app.current_tenant', true) <> ''
          AND "organizationId" = current_setting('app.current_tenant', true)::uuid
        )
    $pol$, t);
  END LOOP;
END
$rls$;

-- ── Immutability ─────────────────────────────────────────────────────────────
-- ledger_entries are append-only (reuses enforce_append_only() from the
-- tenant-isolation migration: raises on any UPDATE or DELETE).
CREATE TRIGGER ledger_entries_no_mutate
  BEFORE UPDATE OR DELETE ON "ledger_entries"
  FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

-- ledger_transactions are never deleted; status may flip POSTED → REVERSED via
-- UPDATE, but the row itself is permanent.
CREATE OR REPLACE FUNCTION enforce_no_delete() RETURNS trigger AS $nd$
BEGIN
  RAISE EXCEPTION 'append_only_violation: % rows cannot be deleted', TG_TABLE_NAME;
END;
$nd$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_transactions_no_delete
  BEFORE DELETE ON "ledger_transactions"
  FOR EACH ROW EXECUTE FUNCTION enforce_no_delete();

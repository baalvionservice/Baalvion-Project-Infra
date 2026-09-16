-- 082 — Duty settlement rail (Clearance Compression, Phase 5).
--
-- Duty payment is a hidden 2–4 days in the baseline cycle, almost none of it
-- processing: it is "someone logs into a bank at 10am". A pre-funded account
-- turns it into a ledger debit.
--
-- THREE TABLES:
--
--   duty_accounts        the balance. reserved_minor is tracked SEPARATELY from
--                        balance_minor because an assessment is not a payment:
--                        funds are reserved at assessment and only debited at
--                        settlement. Without the split, four consignments each
--                        believe they own the same balance and the fourth
--                        payment bounces at the authority.
--
--   duty_ledger_entries  append-only history. idempotency_key is UNIQUE per
--                        account, which is what makes a retried settlement safe:
--                        the customs gateway retries, and a double debit here is
--                        real money.
--
--   fx_locks             the rate held from booking to settlement. Rates are
--                        stored as scaled INTEGERS, never decimals — a float
--                        conversion between currencies with different minor units
--                        drifts, and a payment one unit off the assessment is
--                        refused.
--
-- All amounts are integers in the account's minor unit. No money column in this
-- migration is a float, and none should ever become one.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks; RLS written per table.

CREATE TABLE IF NOT EXISTS tradeops.duty_accounts (
    id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           text          NOT NULL DEFAULT 'T-DEMO',
    org_id              text,
    label               text,
    account_type        text          NOT NULL DEFAULT 'prefunded_wallet',
    currency            text          NOT NULL DEFAULT 'USD',
    balance_minor       bigint        NOT NULL DEFAULT 0,
    reserved_minor      bigint        NOT NULL DEFAULT 0,
    credit_limit_minor  bigint        NOT NULL DEFAULT 0,
    status              text          NOT NULL DEFAULT 'active',
    guarantee_reference text,
    provider            text,
    metadata            jsonb         NOT NULL DEFAULT '{}'::jsonb,
    created_by          text,
    created_at          timestamptz   NOT NULL DEFAULT now(),
    updated_at          timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT chk_duty_accounts_type CHECK (account_type IN ('prefunded_wallet','deferred_account','broker_bond')),
    CONSTRAINT chk_duty_accounts_status CHECK (status IN ('active','suspended','closed')),
    -- Reservations can never be negative; a negative reservation would silently
    -- inflate available funds.
    CONSTRAINT chk_duty_accounts_reserved_non_negative CHECK (reserved_minor >= 0),
    CONSTRAINT chk_duty_accounts_credit_non_negative CHECK (credit_limit_minor >= 0)
);

CREATE INDEX IF NOT EXISTS idx_duty_accounts_tenant ON tradeops.duty_accounts (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_duty_accounts_org    ON tradeops.duty_accounts (org_id) WHERE org_id IS NOT NULL;

ALTER TABLE tradeops.duty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.duty_accounts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.duty_accounts;
CREATE POLICY tenant_isolation ON tradeops.duty_accounts
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

-- ─────────────────────────────────────────────────────────────────────────────
-- LEDGER ENTRIES (append-only; idempotency_key makes a retried settle safe)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.duty_ledger_entries (
    id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             text          NOT NULL DEFAULT 'T-DEMO',
    account_id            uuid          NOT NULL,
    entry_type            text          NOT NULL,
    amount_minor          bigint        NOT NULL,
    currency              text          NOT NULL DEFAULT 'USD',
    balance_after_minor   bigint,
    reserved_after_minor  bigint,
    consignment_id        uuid,
    submission_id         uuid,
    fx_lock_id            uuid,
    reference             text,
    description           text,
    idempotency_key       text,
    created_by            text,
    created_at            timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_duty_ledger_entries_account FOREIGN KEY (account_id) REFERENCES tradeops.duty_accounts (id) ON DELETE CASCADE,
    CONSTRAINT chk_duty_ledger_entries_type CHECK (entry_type IN ('deposit','reserve','release','settle','refund','fee','adjustment')),
    CONSTRAINT uq_duty_ledger_entries_idem UNIQUE (tenant_id, account_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_duty_ledger_entries_account     ON tradeops.duty_ledger_entries (account_id, created_at);
CREATE INDEX IF NOT EXISTS idx_duty_ledger_entries_consignment ON tradeops.duty_ledger_entries (consignment_id) WHERE consignment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_duty_ledger_entries_created_brin ON tradeops.duty_ledger_entries USING brin (created_at);

ALTER TABLE tradeops.duty_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.duty_ledger_entries FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.duty_ledger_entries;
CREATE POLICY tenant_isolation ON tradeops.duty_ledger_entries
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

-- ─────────────────────────────────────────────────────────────────────────────
-- FX LOCKS — rate held from booking to settlement, stored as a scaled integer
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.fx_locks (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text          NOT NULL DEFAULT 'T-DEMO',
    consignment_id  uuid,
    base_currency   text          NOT NULL,
    quote_currency  text          NOT NULL,
    rate_scaled     numeric(40,0) NOT NULL,
    rate_decimals   integer       NOT NULL DEFAULT 10,
    source          text,
    locked_at       timestamptz   NOT NULL DEFAULT now(),
    expires_at      timestamptz   NOT NULL,
    status          text          NOT NULL DEFAULT 'active',
    consumed_at     timestamptz,
    created_by      text,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT chk_fx_locks_status CHECK (status IN ('active','consumed','expired','cancelled')),
    CONSTRAINT chk_fx_locks_rate_positive CHECK (rate_scaled > 0),
    CONSTRAINT chk_fx_locks_window CHECK (expires_at > locked_at)
);

CREATE INDEX IF NOT EXISTS idx_fx_locks_consignment ON tradeops.fx_locks (consignment_id) WHERE consignment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fx_locks_active      ON tradeops.fx_locks (tenant_id, status, expires_at) WHERE status = 'active';

ALTER TABLE tradeops.fx_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.fx_locks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.fx_locks;
CREATE POLICY tenant_isolation ON tradeops.fx_locks
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

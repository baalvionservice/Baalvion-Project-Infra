-- 071 — Underwriters, binders and broker commission.
--
-- Until now the platform WAS the insurer: premiums landed in a platform ledger
-- account, claims were paid from it, and Baalvion carried 100% of every loss on its
-- own balance sheet — which in most jurisdictions also requires an insurance licence
-- and capital reserves it does not have. There was no concept of a carrier, a
-- binding authority, a capacity limit or a commission split.
--
-- This is the broker/MGA model instead: a licensed underwriter carries the risk
-- under a binder (a delegated authority to bind cover on their paper, up to a limit),
-- the platform places business into it and retains a commission on gross premium.
--
-- Nothing here forces an underwriter to exist. A policy with underwriter_id NULL is
-- carried by the platform itself — the status quo — but it is now explicitly
-- labelled as such rather than being an unexamined default.

CREATE TABLE IF NOT EXISTS "trade".insurance_underwriters (
    id                  varchar(64)  PRIMARY KEY,
    tenant_id           text,
    name                text         NOT NULL,
    legal_entity        text,
    -- Which adapter drives this relationship. 'manual' = quotes and bindings are
    -- exchanged out of band and recorded here; a named adapter talks to their API.
    adapter             text         NOT NULL DEFAULT 'manual',
    -- The binding authority agreement. Without one, the platform may not bind on
    -- this underwriter's paper at all.
    binder_reference    text,
    status              text         NOT NULL DEFAULT 'prospective',
    currency            varchar(10)  NOT NULL DEFAULT 'USD',
    -- Aggregate sum insured the binder allows across all live policies, and the
    -- ceiling on any single risk. Exceeding either is a breach of the authority.
    capacity_limit      numeric(20,2),
    per_risk_limit      numeric(20,2),
    -- Broker commission as a FRACTION of gross premium (0.15 = 15%). The remainder
    -- is remitted to the underwriter.
    commission_rate     numeric(6,5) NOT NULL DEFAULT 0,
    -- account-service account the net premium is remitted to.
    ledger_account_id   uuid,
    binder_start        timestamptz,
    binder_end          timestamptz,
    lines_of_business   jsonb        NOT NULL DEFAULT '["cargo"]'::jsonb,
    metadata            jsonb        NOT NULL DEFAULT '{}'::jsonb,
    created_at          timestamptz  NOT NULL DEFAULT now(),
    updated_at          timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT chk_underwriter_status CHECK (status IN ('prospective','bound','suspended','expired','terminated')),
    CONSTRAINT chk_underwriter_commission CHECK (commission_rate >= 0 AND commission_rate <= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_underwriters_binder ON "trade".insurance_underwriters (binder_reference) WHERE binder_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_underwriters_status ON "trade".insurance_underwriters (status);

ALTER TABLE "trade".insurance_underwriters ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trade".insurance_underwriters FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "trade".insurance_underwriters;
-- A platform-wide binder (tenant_id NULL) is visible to every tenant: it is the
-- paper their cover is written on, not another tenant's private record.
CREATE POLICY tenant_isolation ON "trade".insurance_underwriters
    USING (tenant_id IS NULL OR (current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

-- ── the placement on each policy ─────────────────────────────────────────────
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS underwriter_id varchar(64);
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS underwriter_policy_ref text;
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS placement_status varchar(20) NOT NULL DEFAULT 'unplaced';
-- premium is the GROSS the assured pays. These split it.
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS commission_rate numeric(6,5);
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS commission_amount numeric(20,2);
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS net_premium numeric(20,2);
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS remittance_ref varchar(120);

ALTER TABLE "trade".insurance_policies DROP CONSTRAINT IF EXISTS fk_insurance_policies_underwriter;
ALTER TABLE "trade".insurance_policies
    ADD CONSTRAINT fk_insurance_policies_underwriter FOREIGN KEY (underwriter_id) REFERENCES "trade".insurance_underwriters (id) ON DELETE SET NULL;

ALTER TABLE "trade".insurance_policies DROP CONSTRAINT IF EXISTS chk_policies_placement_status;
ALTER TABLE "trade".insurance_policies
    ADD CONSTRAINT chk_policies_placement_status CHECK (placement_status IN ('unplaced','referred','placed','declined','platform_retained'));

CREATE INDEX IF NOT EXISTS idx_insurance_policies_underwriter ON "trade".insurance_policies (underwriter_id, status);

-- Claims settle on the underwriter's paper too, so the recovery of a paid claim
-- from them has to be recordable separately from carrier subrogation.
ALTER TABLE "trade".insurance_claims ADD COLUMN IF NOT EXISTS underwriter_claim_ref text;
ALTER TABLE "trade".insurance_claims ADD COLUMN IF NOT EXISTS underwriter_settled_amount numeric(20,2);
ALTER TABLE "trade".insurance_claims ADD COLUMN IF NOT EXISTS underwriter_settled_at timestamptz;

-- 072 — The risks a broker keeps even after the underwriting risk is placed.
--
-- Placing a risk on a carrier's paper moves the LOSS to them. It does not move:
--   • binder breach       — binding outside the authority (territory, commodity,
--                           limit) lets the carrier walk away, leaving the loss with
--                           the broker. Limits were already enforced; territory and
--                           commodity were not, and they are the exclusions that
--                           actually void marine cargo cover.
--   • client money        — premium collected belongs to the underwriter from the
--                           moment it is paid. Most jurisdictions require it held in
--                           a SEGREGATED trust/IBA account, not mixed with operating
--                           funds. Spending it is misappropriation, not an accounting
--                           error.
--   • E&O / professional  — if the cover does not respond because of something the
--     indemnity             broker did, the assured sues the broker. Brokers do not
--                           fail because ships sink; they fail on E&O claims.
--
-- This migration makes all three representable and enforceable.

-- ── binder scope: what the authority actually permits ────────────────────────
-- Empty include-list = worldwide / all commodities. The exclude-lists always win.
ALTER TABLE "trade".insurance_underwriters ADD COLUMN IF NOT EXISTS territories_included jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "trade".insurance_underwriters ADD COLUMN IF NOT EXISTS territories_excluded jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "trade".insurance_underwriters ADD COLUMN IF NOT EXISTS commodities_excluded jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ── client money ─────────────────────────────────────────────────────────────
-- 'trust'  premium is collected into a segregated client-money account and remitted
--          from there — the default, because it is what regulators require.
-- 'direct' the carrier collects premium itself; the broker never holds it.
ALTER TABLE "trade".insurance_underwriters ADD COLUMN IF NOT EXISTS premium_handling text NOT NULL DEFAULT 'trust';
ALTER TABLE "trade".insurance_underwriters DROP CONSTRAINT IF EXISTS chk_underwriter_premium_handling;
ALTER TABLE "trade".insurance_underwriters
    ADD CONSTRAINT chk_underwriter_premium_handling CHECK (premium_handling IN ('trust', 'direct'));

-- Where the gross premium lands before it is split. Segregated from operating funds.
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS trust_account_id uuid;
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS premium_held_in_trust boolean NOT NULL DEFAULT false;
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS commission_drawn_at timestamptz;
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS commission_draw_ref varchar(120);

-- ── the broker's own professional indemnity ──────────────────────────────────
-- The broker is the INSURED on this one. Without it in force, a single E&O claim is
-- unfunded — which is why placement warns when it has lapsed.
CREATE TABLE IF NOT EXISTS "trade".broker_indemnity (
    id                varchar(64)  PRIMARY KEY,
    tenant_id         text,
    cover_type        text         NOT NULL DEFAULT 'professional_indemnity',
    insurer           text         NOT NULL,
    policy_number     text         NOT NULL,
    currency          varchar(10)  NOT NULL DEFAULT 'USD',
    limit_of_indemnity numeric(20,2),
    -- What the broker pays on each claim before the E&O policy responds.
    retention         numeric(20,2) NOT NULL DEFAULT 0,
    -- Claims-made cover only answers for claims NOTIFIED during the period, however
    -- old the act was — so the retroactive date matters as much as the period.
    basis             text         NOT NULL DEFAULT 'claims_made',
    retroactive_date  date,
    period_start      timestamptz,
    period_end        timestamptz,
    status            text         NOT NULL DEFAULT 'active',
    broker_notes      text,
    metadata          jsonb        NOT NULL DEFAULT '{}'::jsonb,
    created_at        timestamptz  NOT NULL DEFAULT now(),
    updated_at        timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT chk_broker_indemnity_type   CHECK (cover_type IN ('professional_indemnity','errors_omissions','fidelity','cyber')),
    CONSTRAINT chk_broker_indemnity_basis  CHECK (basis IN ('claims_made','losses_occurring')),
    CONSTRAINT chk_broker_indemnity_status CHECK (status IN ('active','lapsed','cancelled','pending'))
);

CREATE INDEX IF NOT EXISTS idx_broker_indemnity_status ON "trade".broker_indemnity (status, period_end);

ALTER TABLE "trade".broker_indemnity ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trade".broker_indemnity FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "trade".broker_indemnity;
CREATE POLICY tenant_isolation ON "trade".broker_indemnity
    USING (tenant_id IS NULL OR (current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

-- ── the basis on which cover was sold ────────────────────────────────────────
-- Recorded per policy because it is the broker's defence in an E&O claim: an
-- execution-only sale carries a far lower duty than a recommendation, and which one
-- happened has to be evidenced at the time, not argued about afterwards.
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS advice_basis varchar(20) NOT NULL DEFAULT 'non_advised';
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS disclosure_accepted_at timestamptz;
ALTER TABLE "trade".insurance_policies ADD COLUMN IF NOT EXISTS disclosure_version varchar(20);
ALTER TABLE "trade".insurance_policies DROP CONSTRAINT IF EXISTS chk_policies_advice_basis;
ALTER TABLE "trade".insurance_policies
    ADD CONSTRAINT chk_policies_advice_basis CHECK (advice_basis IN ('non_advised','advised','execution_only'));

-- 083 — Trusted trader / AEO (Clearance Compression, Phase 6).
--
-- Every other phase makes the PLATFORM faster. This is the only one that changes
-- what the AUTHORITY does, and it is what converts sub-4-hour paperwork into
-- same-day release: customs risk-scores the trader, not the shipment.
--
--   trader_accreditations  what an operator actually holds, WITH an expiry.
--                          Accreditation is revocable and periodically
--                          re-validated, so a lapsed row must read as
--                          unaccredited — pricing a fast lane against a status
--                          that quietly expired is how a customer gets an
--                          unexpected examination.
--
--   trader_risk_profiles   the record customs is effectively scoring: filing
--                          count, first-pass acceptance, prior examination
--                          findings, typical consignment value. Recomputed from
--                          observed history rather than self-declared.
--
-- Nothing in this migration grants anything. Accreditation is granted by an
-- authority after its own audit; these tables record and evidence it.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks; RLS written per table.

CREATE TABLE IF NOT EXISTS tradeops.trader_accreditations (
    id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      text          NOT NULL DEFAULT 'T-DEMO',
    org_id         text,
    programme      text          NOT NULL,
    status         text          NOT NULL DEFAULT 'in_progress',
    reference      text,
    authority      text,
    granted_at     date,
    expires_at     date,
    readiness_pct  numeric(5,2),
    evidence       jsonb         NOT NULL DEFAULT '{}'::jsonb,
    last_assessed  timestamptz,
    metadata       jsonb         NOT NULL DEFAULT '{}'::jsonb,
    created_by     text,
    created_at     timestamptz   NOT NULL DEFAULT now(),
    updated_at     timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT chk_trader_accreditations_status CHECK (status IN ('in_progress','applied','active','suspended','revoked','expired')),
    CONSTRAINT uq_trader_accreditations_org_programme UNIQUE (tenant_id, org_id, programme)
);

CREATE INDEX IF NOT EXISTS idx_trader_accreditations_org    ON tradeops.trader_accreditations (tenant_id, org_id);
CREATE INDEX IF NOT EXISTS idx_trader_accreditations_active ON tradeops.trader_accreditations (status, expires_at) WHERE status = 'active';

ALTER TABLE tradeops.trader_accreditations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.trader_accreditations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.trader_accreditations;
CREATE POLICY tenant_isolation ON tradeops.trader_accreditations
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

-- ─────────────────────────────────────────────────────────────────────────────
-- TRADER RISK PROFILE — the record an authority is effectively scoring
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.trader_risk_profiles (
    id                            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                     text          NOT NULL DEFAULT 'T-DEMO',
    org_id                        text,
    filings_count                 integer       NOT NULL DEFAULT 0,
    first_pass_rate               numeric(5,4),
    prior_exams                   integer       NOT NULL DEFAULT 0,
    prior_findings                integer       NOT NULL DEFAULT 0,
    average_consignment_value     numeric(20,2),
    known_counterparties          jsonb         NOT NULL DEFAULT '[]'::jsonb,
    months_trading                integer       NOT NULL DEFAULT 0,
    computed_at                   timestamptz   NOT NULL DEFAULT now(),
    created_at                    timestamptz   NOT NULL DEFAULT now(),
    updated_at                    timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT uq_trader_risk_profiles_org UNIQUE (tenant_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_trader_risk_profiles_org ON tradeops.trader_risk_profiles (tenant_id, org_id);

ALTER TABLE tradeops.trader_risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.trader_risk_profiles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.trader_risk_profiles;
CREATE POLICY tenant_isolation ON tradeops.trader_risk_profiles
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

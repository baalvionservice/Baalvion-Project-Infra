-- 084 — Delegated authority + coverage (Clearance Compression, Phase 7).
--
-- A large slice of the baseline cycle is not work; it is waiting for someone's
-- morning. A declaration ready at 18:00 in Mumbai and approved at 09:00 in
-- Hamburg spends fifteen hours in a queue that appears in nobody's process
-- documentation.
--
--   authority_delegations  pre-authorised limits: this corridor, this commodity,
--                          under this value, this counterparty. A decision inside
--                          them executes without a person.
--
--                          max_value_minor is NOT NULL with no default on
--                          purpose. A blank value limit that silently meant
--                          "unlimited" is the misconfiguration this table must
--                          not be able to express.
--
--   authority_decisions    every evaluation, approved or escalated, with the
--                          delegation that matched and the wait it incurred.
--                          That is what makes the automation rate and the hours
--                          lost to escalation measurable rather than anecdotal.
--
-- Some decisions are never delegable however generous the limits (a sanctions
-- hit, a controlled-goods licence, a valuation dispute). That list lives in
-- service/authority/policy.js and is checked BEFORE any delegation is consulted,
-- so no row in this table can override it.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks; RLS written per table.

CREATE TABLE IF NOT EXISTS tradeops.authority_delegations (
    id              text          PRIMARY KEY,
    tenant_id       text          NOT NULL DEFAULT 'T-DEMO',
    org_id          text,
    label           text,
    decision        text          NOT NULL,
    status          text          NOT NULL DEFAULT 'active',
    scope           jsonb         NOT NULL DEFAULT '{}'::jsonb,
    max_value_minor bigint        NOT NULL,
    currency        text          NOT NULL DEFAULT 'USD',
    delegate        text,
    granted_by      text,
    effective_from  timestamptz,
    expires_at      timestamptz,
    metadata        jsonb         NOT NULL DEFAULT '{}'::jsonb,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT chk_authority_delegations_status CHECK (status IN ('active','suspended','revoked','expired')),
    CONSTRAINT chk_authority_delegations_decision CHECK (decision IN ('file_declaration','settle_duty','approve_amendment','accept_duty_variance','release_cargo','waive_finding','respond_to_query')),
    CONSTRAINT chk_authority_delegations_limit_non_negative CHECK (max_value_minor >= 0)
);

CREATE INDEX IF NOT EXISTS idx_authority_delegations_lookup ON tradeops.authority_delegations (tenant_id, org_id, decision, status);

ALTER TABLE tradeops.authority_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.authority_delegations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.authority_delegations;
CREATE POLICY tenant_isolation ON tradeops.authority_delegations
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

-- ─────────────────────────────────────────────────────────────────────────────
-- COVERAGE ROTA — recurring weekly windows in UTC
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.authority_rota (
    id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    text          NOT NULL DEFAULT 'T-DEMO',
    name         text          NOT NULL,
    roles        jsonb         NOT NULL DEFAULT '[]'::jsonb,
    days         jsonb         NOT NULL DEFAULT '[]'::jsonb,
    start_hour   numeric(4,2)  NOT NULL,
    end_hour     numeric(4,2)  NOT NULL,
    timezone_note text,
    active       boolean       NOT NULL DEFAULT true,
    created_at   timestamptz   NOT NULL DEFAULT now(),
    updated_at   timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT chk_authority_rota_hours CHECK (start_hour >= 0 AND start_hour < 24 AND end_hour >= 0 AND end_hour <= 24)
);

CREATE INDEX IF NOT EXISTS idx_authority_rota_tenant ON tradeops.authority_rota (tenant_id, active);

ALTER TABLE tradeops.authority_rota ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.authority_rota FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.authority_rota;
CREATE POLICY tenant_isolation ON tradeops.authority_rota
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

-- ─────────────────────────────────────────────────────────────────────────────
-- DECISION AUDIT — approved or escalated, and what the wait cost
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.authority_decisions (
    id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             text          NOT NULL DEFAULT 'T-DEMO',
    org_id                text,
    consignment_id        uuid,
    decision              text          NOT NULL,
    outcome               text          NOT NULL,
    auto_approved         boolean       NOT NULL DEFAULT false,
    matched_delegation_id text,
    amount_minor          bigint,
    currency              text,
    request               jsonb         NOT NULL DEFAULT '{}'::jsonb,
    reasons               jsonb         NOT NULL DEFAULT '[]'::jsonb,
    blocked_by            jsonb         NOT NULL DEFAULT '[]'::jsonb,
    coverage              jsonb         NOT NULL DEFAULT '{}'::jsonb,
    escalation_wait_hours numeric(10,2),
    resolved_at           timestamptz,
    resolved_by           text,
    policy_version        text,
    created_by            text,
    created_at            timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT chk_authority_decisions_outcome CHECK (outcome IN ('auto_approved','needs_human','refused'))
);

CREATE INDEX IF NOT EXISTS idx_authority_decisions_tenant    ON tradeops.authority_decisions (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_authority_decisions_pending   ON tradeops.authority_decisions (tenant_id, outcome) WHERE outcome = 'needs_human' AND resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_authority_decisions_created_brin ON tradeops.authority_decisions USING brin (created_at);

ALTER TABLE tradeops.authority_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.authority_decisions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.authority_decisions;
CREATE POLICY tenant_isolation ON tradeops.authority_decisions
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

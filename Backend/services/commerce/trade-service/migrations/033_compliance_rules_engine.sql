-- 033 — Phase 2 Trust/Verification/Compliance Foundation: Compliance Engine.
--
-- Data-driven onboarding/compliance checks, layered ON TOP of (not replacing) the
-- existing sanctions/KYC/AML screening engine (migration 014,
-- /v1/compliance_screening) — one seeded rule cross-references its latest
-- ComplianceScreening decision. Adding a new check later is a row insert into
-- tradeops.compliance_rules, not a code change (service/verification/
-- complianceRules.js interprets a small `condition` DSL: required_categories_
-- approved / no_expired_items / country_not_restricted / sanctions_clear).
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.compliance_rules (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code       text          NOT NULL,
    category        text          NOT NULL,
    description     text,
    condition       jsonb         NOT NULL DEFAULT '{}'::jsonb,
    severity        text          NOT NULL DEFAULT 'warning',
    is_active       boolean       NOT NULL DEFAULT true,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT uq_compliance_rules_code UNIQUE (rule_code),
    CONSTRAINT chk_compliance_rules_category CHECK (category IN ('document_completeness', 'license_expiry', 'profile_completeness', 'country_restriction', 'internal_policy')),
    CONSTRAINT chk_compliance_rules_severity CHECK (severity IN ('info', 'warning', 'blocking'))
);

CREATE TABLE IF NOT EXISTS tradeops.compliance_rule_evaluations (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text          NOT NULL DEFAULT 'T-DEMO',
    org_id          integer       NOT NULL,
    rule_id         uuid          NOT NULL,
    passed          boolean       NOT NULL,
    details         jsonb         NOT NULL DEFAULT '{}'::jsonb,
    evaluated_at    timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_compliance_rule_evaluations_org FOREIGN KEY (org_id) REFERENCES trade.organizations (id) ON DELETE CASCADE,
    CONSTRAINT fk_compliance_rule_evaluations_rule FOREIGN KEY (rule_id) REFERENCES tradeops.compliance_rules (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_compliance_rule_evaluations_org_rule ON tradeops.compliance_rule_evaluations (org_id, rule_id, evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_rule_evaluations_tenant   ON tradeops.compliance_rule_evaluations (tenant_id);

ALTER TABLE tradeops.compliance_rule_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.compliance_rule_evaluations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.compliance_rule_evaluations;
CREATE POLICY tenant_isolation ON tradeops.compliance_rule_evaluations
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

INSERT INTO tradeops.compliance_rules (rule_code, category, description, condition, severity) VALUES
    ('mandatory_documents_complete', 'document_completeness', 'All required verification documents must be approved', '{"type": "required_categories_approved", "params": {"categories": ["documents"]}}'::jsonb, 'blocking'),
    ('no_expired_verifications', 'license_expiry', 'No verification item may be in an expired state', '{"type": "no_expired_items", "params": {}}'::jsonb, 'warning'),
    ('profile_complete', 'profile_completeness', 'Company and identity verification must be complete', '{"type": "required_categories_approved", "params": {"categories": ["company", "identity"]}}'::jsonb, 'blocking'),
    ('country_allowed', 'country_restriction', 'Organization country must not be on the restricted list', '{"type": "country_not_restricted", "params": {"blockedCountries": ["KP", "IR", "SY", "CU"]}}'::jsonb, 'blocking'),
    ('sanctions_clear', 'internal_policy', 'Latest sanctions/KYC screening decision must not be blocking', '{"type": "sanctions_clear", "params": {}}'::jsonb, 'blocking')
ON CONFLICT (rule_code) DO NOTHING;

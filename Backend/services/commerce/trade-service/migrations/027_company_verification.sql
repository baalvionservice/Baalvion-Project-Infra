-- 027 — Phase 2 Trust/Verification/Compliance Foundation: Company Verification +
-- Director/Beneficial-Owner Verification.
--
--   • tradeops.company_verifications — the workflow wrapper around an org's legal
--     profile (1:1 with trade.organizations). registered_address_id /
--     operational_address_id are plain UUID columns here (no FK yet) because
--     tradeops.verified_addresses doesn't exist until migration 028 — that
--     migration adds the FK constraints once the table exists (additive, matching
--     the migration-023 style of layering constraints on in a later file).
--   • tradeops.company_stakeholders — directors/owners/shareholders/authorized
--     signatories, each optionally linked to their own identity_verification.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.company_verifications (
    id                              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                       text          NOT NULL DEFAULT 'T-DEMO',
    org_id                          integer       NOT NULL,
    legal_company_name              text,
    registration_number             text,
    incorporation_date              date,
    business_type                   text,
    registered_address_id           uuid,
    operational_address_id          uuid,
    company_website                 text,
    authorized_representative_user_id integer,
    status                          text          NOT NULL DEFAULT 'submitted',
    submitted_at                    timestamptz   NOT NULL DEFAULT now(),
    reviewed_by                     text,
    reviewed_at                     timestamptz,
    rejection_reason                text,
    renewal_due_at                  timestamptz,
    metadata                        jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version                         integer       NOT NULL DEFAULT 1,
    created_by                      text,
    updated_by                      text,
    deleted_by                      text,
    created_at                      timestamptz   NOT NULL DEFAULT now(),
    updated_at                      timestamptz   NOT NULL DEFAULT now(),
    deleted_at                      timestamptz,
    CONSTRAINT fk_company_verifications_org FOREIGN KEY (org_id) REFERENCES trade.organizations (id) ON DELETE CASCADE,
    CONSTRAINT fk_company_verifications_rep FOREIGN KEY (authorized_representative_user_id) REFERENCES trade.users (id) ON DELETE SET NULL,
    CONSTRAINT chk_company_verifications_status CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'expired'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_company_verifications_org ON tradeops.company_verifications (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_company_verifications_tenant    ON tradeops.company_verifications (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_company_verifications_status    ON tradeops.company_verifications (status) WHERE deleted_at IS NULL;

ALTER TABLE tradeops.company_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.company_verifications FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.company_verifications;
CREATE POLICY tenant_isolation ON tradeops.company_verifications
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.company_stakeholders (
    id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               text          NOT NULL DEFAULT 'T-DEMO',
    org_id                  integer       NOT NULL,
    person_name             text          NOT NULL,
    role                    text          NOT NULL,
    ownership_percentage    numeric(5,2),
    identity_verification_id uuid,
    status                  text          NOT NULL DEFAULT 'submitted',
    reviewed_by             text,
    reviewed_at             timestamptz,
    rejection_reason        text,
    metadata                jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version                 integer       NOT NULL DEFAULT 1,
    created_by              text,
    updated_by              text,
    deleted_by               text,
    created_at              timestamptz   NOT NULL DEFAULT now(),
    updated_at              timestamptz   NOT NULL DEFAULT now(),
    deleted_at               timestamptz,
    CONSTRAINT fk_company_stakeholders_org FOREIGN KEY (org_id) REFERENCES trade.organizations (id) ON DELETE CASCADE,
    CONSTRAINT fk_company_stakeholders_identity FOREIGN KEY (identity_verification_id) REFERENCES tradeops.identity_verifications (id) ON DELETE SET NULL,
    CONSTRAINT chk_company_stakeholders_role CHECK (role IN ('director', 'owner', 'shareholder', 'authorized_signatory')),
    CONSTRAINT chk_company_stakeholders_ownership CHECK (ownership_percentage IS NULL OR (ownership_percentage >= 0 AND ownership_percentage <= 100)),
    CONSTRAINT chk_company_stakeholders_status CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_company_stakeholders_org      ON tradeops.company_stakeholders (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_company_stakeholders_tenant   ON tradeops.company_stakeholders (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_company_stakeholders_status   ON tradeops.company_stakeholders (status) WHERE deleted_at IS NULL;

ALTER TABLE tradeops.company_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.company_stakeholders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.company_stakeholders;
CREATE POLICY tenant_isolation ON tradeops.company_stakeholders
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

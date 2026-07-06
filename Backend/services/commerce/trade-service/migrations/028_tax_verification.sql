-- 028 — Phase 2 Trust/Verification/Compliance Foundation: Tax Verification.
--
-- tradeops.tax_registrations — an org's tax identifiers, keyed against the
-- country-configurable tradeops.tax_id_types catalog seeded in migration 025 (add
-- a country's identifier there as a data insert; this table just references it).
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.tax_registrations (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text          NOT NULL DEFAULT 'T-DEMO',
    org_id          integer       NOT NULL,
    tax_id_type_id  uuid          NOT NULL,
    tax_id_value    text          NOT NULL,
    document_id     uuid,
    status          text          NOT NULL DEFAULT 'submitted',
    verified_at     timestamptz,
    expires_at      timestamptz,
    reviewed_by     text,
    reviewed_at     timestamptz,
    rejection_reason text,
    metadata        jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version         integer       NOT NULL DEFAULT 1,
    created_by      text,
    updated_by      text,
    deleted_by      text,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz   NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    CONSTRAINT fk_tax_registrations_org FOREIGN KEY (org_id) REFERENCES trade.organizations (id) ON DELETE CASCADE,
    CONSTRAINT fk_tax_registrations_type FOREIGN KEY (tax_id_type_id) REFERENCES tradeops.tax_id_types (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tax_registrations_document FOREIGN KEY (document_id) REFERENCES tradeops.documents (id) ON DELETE SET NULL,
    CONSTRAINT chk_tax_registrations_status CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'expired'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tax_registrations_org_type ON tradeops.tax_registrations (org_id, tax_id_type_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tax_registrations_tenant         ON tradeops.tax_registrations (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tax_registrations_status         ON tradeops.tax_registrations (status) WHERE deleted_at IS NULL;

ALTER TABLE tradeops.tax_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.tax_registrations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.tax_registrations;
CREATE POLICY tenant_isolation ON tradeops.tax_registrations
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

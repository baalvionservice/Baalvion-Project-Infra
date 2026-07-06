-- 030 — Phase 2 Trust/Verification/Compliance Foundation: Address Verification.
--
--   • tradeops.verified_addresses — registered office / corporate office / factory /
--     warehouse / branch addresses. Factory/warehouse rows are also the location a
--     migration-031 Facility record points at.
--   • tradeops.address_evidence — join table linking an address to the supporting
--     documents (utility bill / lease / tax document) proving it, reusing the
--     existing Document Management engine rather than a parallel upload path.
--   • Backfills the FK constraints migration 027 deferred on
--     tradeops.company_verifications.registered_address_id/operational_address_id,
--     now that verified_addresses exists (additive, migration-023 style).
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.verified_addresses (
    id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           text          NOT NULL DEFAULT 'T-DEMO',
    org_id              integer       NOT NULL,
    address_type        text          NOT NULL,
    line1               text          NOT NULL,
    line2               text,
    city                text,
    state               text,
    postal_code         text,
    country             text,
    latitude            numeric(9,6),
    longitude           numeric(9,6),
    status              text          NOT NULL DEFAULT 'submitted',
    reviewed_by         text,
    reviewed_at         timestamptz,
    rejection_reason    text,
    metadata            jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version             integer       NOT NULL DEFAULT 1,
    created_by          text,
    updated_by          text,
    deleted_by          text,
    created_at          timestamptz   NOT NULL DEFAULT now(),
    updated_at          timestamptz   NOT NULL DEFAULT now(),
    deleted_at          timestamptz,
    CONSTRAINT fk_verified_addresses_org FOREIGN KEY (org_id) REFERENCES trade.organizations (id) ON DELETE CASCADE,
    CONSTRAINT chk_verified_addresses_type CHECK (address_type IN ('registered_office', 'corporate_office', 'factory', 'warehouse', 'branch')),
    CONSTRAINT chk_verified_addresses_status CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_verified_addresses_org      ON tradeops.verified_addresses (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_verified_addresses_tenant   ON tradeops.verified_addresses (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_verified_addresses_type     ON tradeops.verified_addresses (org_id, address_type) WHERE deleted_at IS NULL;

ALTER TABLE tradeops.verified_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.verified_addresses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.verified_addresses;
CREATE POLICY tenant_isolation ON tradeops.verified_addresses
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

CREATE TABLE IF NOT EXISTS tradeops.address_evidence (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text          NOT NULL DEFAULT 'T-DEMO',
    address_id      uuid          NOT NULL,
    document_id     uuid          NOT NULL,
    evidence_type   text          NOT NULL,
    created_by      text,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_address_evidence_address FOREIGN KEY (address_id) REFERENCES tradeops.verified_addresses (id) ON DELETE CASCADE,
    CONSTRAINT fk_address_evidence_document FOREIGN KEY (document_id) REFERENCES tradeops.documents (id) ON DELETE CASCADE,
    CONSTRAINT chk_address_evidence_type CHECK (evidence_type IN ('utility_bill', 'lease', 'tax_document'))
);

CREATE INDEX IF NOT EXISTS idx_address_evidence_address ON tradeops.address_evidence (address_id);

ALTER TABLE tradeops.address_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.address_evidence FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.address_evidence;
CREATE POLICY tenant_isolation ON tradeops.address_evidence
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

ALTER TABLE tradeops.company_verifications DROP CONSTRAINT IF EXISTS fk_company_verifications_registered_address;
ALTER TABLE tradeops.company_verifications ADD CONSTRAINT fk_company_verifications_registered_address FOREIGN KEY (registered_address_id) REFERENCES tradeops.verified_addresses (id) ON DELETE SET NULL;

ALTER TABLE tradeops.company_verifications DROP CONSTRAINT IF EXISTS fk_company_verifications_operational_address;
ALTER TABLE tradeops.company_verifications ADD CONSTRAINT fk_company_verifications_operational_address FOREIGN KEY (operational_address_id) REFERENCES tradeops.verified_addresses (id) ON DELETE SET NULL;

-- 032 — Phase 2 Trust/Verification/Compliance Foundation: Product & Certificate
-- Verification.
--
-- tradeops.product_certificates — quality/safety/product certificates + country of
-- origin per product, optionally classified against the existing HS Code
-- Intelligence Engine (migration 013) rather than duplicating HS lookup logic.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.product_certificates (
    id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           text          NOT NULL DEFAULT 'T-DEMO',
    org_id              integer       NOT NULL,
    product_name        text          NOT NULL,
    hs_code_id          uuid,
    certificate_type    text          NOT NULL,
    country_of_origin   text,
    document_id         uuid,
    issued_at           timestamptz,
    expires_at          timestamptz,
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
    CONSTRAINT fk_product_certificates_org FOREIGN KEY (org_id) REFERENCES trade.organizations (id) ON DELETE CASCADE,
    CONSTRAINT fk_product_certificates_hs_code FOREIGN KEY (hs_code_id) REFERENCES tradeops.hs_codes (id) ON DELETE SET NULL,
    CONSTRAINT fk_product_certificates_document FOREIGN KEY (document_id) REFERENCES tradeops.documents (id) ON DELETE SET NULL,
    CONSTRAINT chk_product_certificates_type CHECK (certificate_type IN ('quality', 'safety', 'product', 'other')),
    CONSTRAINT chk_product_certificates_status CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_product_certificates_org    ON tradeops.product_certificates (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_certificates_tenant ON tradeops.product_certificates (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_certificates_status ON tradeops.product_certificates (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_certificates_expiry ON tradeops.product_certificates (expires_at) WHERE deleted_at IS NULL AND expires_at IS NOT NULL;

ALTER TABLE tradeops.product_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.product_certificates FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.product_certificates;
CREATE POLICY tenant_isolation ON tradeops.product_certificates
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

-- 025 — Phase 2 Trust/Verification/Compliance foundation: the Verification Center.
--
-- First slice of the Phase 2 spec (identity/company/tax/bank/address/factory/
-- warehouse/products/documents/compliance/risk/trust-score verification, feeding a
-- single "Verification Center" dashboard per organization). This migration lays the
-- foundation everything else in Phase 2 builds on:
--
--   • tradeops.verification_checklist_items — denormalized per-org-per-category
--     status cache the Verification Center dashboard reads (one row per category,
--     recomputed by the app layer whenever an underlying verification record
--     changes — see service/verification/checklist.js).
--   • tradeops.tax_id_types — country-configurable tax-identifier catalog (config
--     data, not code) seeded with the identifiers named in the spec: IN GSTIN/PAN/
--     IEC, AE VAT, US EIN, CN USCC. Adding a country later is a data insert.
--   • tradeops.documents.doc_type — additively extended with the KYC/verification
--     document types (govt ID, passport, tax certificate, bank letter, ...) so the
--     existing AES-256-GCM Document Management engine (migration 011) is reused
--     as-is rather than duplicated for verification uploads.
--   • trade.organizations — verified_badge / badge_issued_at (the final rollup the
--     rest of the platform reads once every checklist category is approved).
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; every RLS policy is written out explicitly per table (migration-009 style).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. verification_checklist_items
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.verification_checklist_items (
    id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          text          NOT NULL DEFAULT 'T-DEMO',
    org_id             integer       NOT NULL,
    category           text          NOT NULL,
    status             text          NOT NULL DEFAULT 'not_started',
    item_count         integer       NOT NULL DEFAULT 0,
    approved_count     integer       NOT NULL DEFAULT 0,
    last_submitted_at  timestamptz,
    last_reviewed_at   timestamptz,
    reviewed_by        text,
    rejection_reason   text,
    expires_at         timestamptz,
    metadata           jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version            integer       NOT NULL DEFAULT 1,
    created_by         text,
    updated_by         text,
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_verification_checklist_items_org FOREIGN KEY (org_id) REFERENCES trade.organizations (id) ON DELETE CASCADE,
    CONSTRAINT chk_verification_checklist_items_category CHECK (category IN (
        'identity','company','business_registration','tax','bank','address',
        'directors','documents','factory','warehouse','products','certificates',
        'compliance','risk','trust_score'
    )),
    CONSTRAINT chk_verification_checklist_items_status CHECK (status IN (
        'not_started','submitted','under_review','approved','rejected','expired'
    ))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_verification_checklist_items_org_category ON tradeops.verification_checklist_items (org_id, category);
CREATE INDEX IF NOT EXISTS idx_verification_checklist_items_tenant             ON tradeops.verification_checklist_items (tenant_id);
CREATE INDEX IF NOT EXISTS idx_verification_checklist_items_status             ON tradeops.verification_checklist_items (category, status);

ALTER TABLE tradeops.verification_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.verification_checklist_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.verification_checklist_items;
CREATE POLICY tenant_isolation ON tradeops.verification_checklist_items
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. tax_id_types — global reference/config data (no tenant_id, like hs_codes).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.tax_id_types (
    id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code       text          NOT NULL,
    type_code          text          NOT NULL,
    label              text          NOT NULL,
    validation_regex   text,
    is_active          boolean       NOT NULL DEFAULT true,
    metadata           jsonb         NOT NULL DEFAULT '{}'::jsonb,
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT uq_tax_id_types_country_type UNIQUE (country_code, type_code)
);

INSERT INTO tradeops.tax_id_types (country_code, type_code, label, validation_regex) VALUES
    ('IN', 'GSTIN', 'GST Identification Number', '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'),
    ('IN', 'PAN',   'Permanent Account Number',  '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),
    ('IN', 'IEC',   'Import Export Code',        '^[A-Z0-9]{10}$'),
    ('AE', 'VAT',   'VAT Registration Number',   '^[0-9]{15}$'),
    ('US', 'EIN',   'Employer Identification Number', '^[0-9]{2}-[0-9]{7}$'),
    ('CN', 'USCC',  'Unified Social Credit Code', '^[0-9A-Z]{18}$')
ON CONFLICT (country_code, type_code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Extend the existing Document Management engine's doc_type taxonomy so KYC/
--    verification uploads (identity, tax, bank, facility, product certs) reuse the
--    AES-256-GCM engine instead of a parallel document store.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE tradeops.documents DROP CONSTRAINT IF EXISTS chk_documents_doc_type;
ALTER TABLE tradeops.documents ADD CONSTRAINT chk_documents_doc_type CHECK (doc_type IN (
    'commercial_invoice','packing_list','bill_of_lading','certificate_of_origin','insurance_document','other',
    'government_id','passport','driving_license','selfie',
    'tax_certificate','bank_letter','utility_bill','lease_agreement',
    'product_certificate','quality_certificate','safety_certificate','inspection_report'
));

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Verified badge rollup on the organization record.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE trade.organizations ADD COLUMN IF NOT EXISTS verified_badge boolean NOT NULL DEFAULT false;
ALTER TABLE trade.organizations ADD COLUMN IF NOT EXISTS badge_issued_at timestamptz;

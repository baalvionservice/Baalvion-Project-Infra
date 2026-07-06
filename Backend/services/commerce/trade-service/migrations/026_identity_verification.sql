-- 026 — Phase 2 Trust/Verification/Compliance Foundation: Identity Verification.
--
-- Per-user KYC (spec: "Applicable to all users" — full name, DOB, nationality,
-- government ID/passport/driving license, selfie, liveness check). The actual ID
-- scan / selfie files are NOT stored here — they are uploaded through the existing
-- AES-256-GCM Document Management engine (migration 011, extended in 025 with the
-- government_id/passport/driving_license/selfie doc_types) and only referenced by
-- id here. Only the last 4 digits of the ID number are persisted for display; the
-- authoritative copy lives in the encrypted document.
--
-- org_id is nullable and optional — most identity submissions happen "in context"
-- of a company signup (the authorized representative or a stakeholder), in which
-- case the row is tagged with that org so the Verification Center 'identity'
-- checklist category can be recomputed immediately. Pure personal KYC with no org
-- context is also valid (org_id NULL).
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.identity_verifications (
    id                     uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id              text          NOT NULL DEFAULT 'T-DEMO',
    user_id                integer       NOT NULL,
    org_id                 integer,
    full_name              text          NOT NULL,
    date_of_birth          date,
    nationality            text,
    id_type                text          NOT NULL,
    id_number_last4        text,
    id_document_id         uuid,
    selfie_document_id     uuid,
    liveness_check_status  text          NOT NULL DEFAULT 'pending',
    liveness_provider      text,
    liveness_reference     text,
    status                 text          NOT NULL DEFAULT 'submitted',
    reviewed_by            text,
    reviewed_at            timestamptz,
    rejection_reason       text,
    expires_at             timestamptz,
    metadata               jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version                integer       NOT NULL DEFAULT 1,
    created_by             text,
    updated_by             text,
    deleted_by             text,
    created_at             timestamptz   NOT NULL DEFAULT now(),
    updated_at             timestamptz   NOT NULL DEFAULT now(),
    deleted_at             timestamptz,
    CONSTRAINT fk_identity_verifications_user FOREIGN KEY (user_id) REFERENCES trade.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_identity_verifications_org FOREIGN KEY (org_id) REFERENCES trade.organizations (id) ON DELETE SET NULL,
    CONSTRAINT fk_identity_verifications_id_document FOREIGN KEY (id_document_id) REFERENCES tradeops.documents (id) ON DELETE SET NULL,
    CONSTRAINT fk_identity_verifications_selfie_document FOREIGN KEY (selfie_document_id) REFERENCES tradeops.documents (id) ON DELETE SET NULL,
    CONSTRAINT chk_identity_verifications_id_type CHECK (id_type IN ('government_id', 'passport', 'driving_license')),
    CONSTRAINT chk_identity_verifications_liveness_status CHECK (liveness_check_status IN ('not_required', 'pending', 'passed', 'failed')),
    CONSTRAINT chk_identity_verifications_status CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'expired'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_identity_verifications_user   ON tradeops.identity_verifications (user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_identity_verifications_tenant       ON tradeops.identity_verifications (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_identity_verifications_org          ON tradeops.identity_verifications (org_id) WHERE org_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_identity_verifications_status       ON tradeops.identity_verifications (status) WHERE deleted_at IS NULL;

ALTER TABLE tradeops.identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.identity_verifications FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.identity_verifications;
CREATE POLICY tenant_isolation ON tradeops.identity_verifications
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

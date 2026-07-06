-- 029 — Phase 2 Trust/Verification/Compliance Foundation: Bank Verification.
--
-- tradeops.bank_accounts — multiple verified payment accounts per org. The raw
-- account number is envelope-encrypted at the app layer with the same AES-256-GCM
-- helper the Document Management engine uses (lib/encryption.js) before it ever
-- reaches this table; only the ciphertext + last 4 digits (for display) are
-- persisted. IBAN/SWIFT/IFSC are routing identifiers, not sufficient alone to move
-- money, so they're stored in plaintext like the rest of the trade schema.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

CREATE TABLE IF NOT EXISTS tradeops.bank_accounts (
    id                          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   text          NOT NULL DEFAULT 'T-DEMO',
    org_id                      integer       NOT NULL,
    bank_name                   text          NOT NULL,
    account_holder_name         text          NOT NULL,
    account_number_last4        text,
    account_number_ciphertext   text,
    account_number_iv           text,
    account_number_tag          text,
    account_number_algo         text          NOT NULL DEFAULT 'none',
    swift_bic                   text,
    iban                        text,
    ifsc                        text,
    currency                    text,
    is_primary                  boolean       NOT NULL DEFAULT false,
    document_id                 uuid,
    status                      text          NOT NULL DEFAULT 'submitted',
    verified_at                 timestamptz,
    reviewed_by                 text,
    reviewed_at                 timestamptz,
    rejection_reason            text,
    metadata                    jsonb         NOT NULL DEFAULT '{}'::jsonb,
    version                     integer       NOT NULL DEFAULT 1,
    created_by                  text,
    updated_by                  text,
    deleted_by                  text,
    created_at                  timestamptz   NOT NULL DEFAULT now(),
    updated_at                  timestamptz   NOT NULL DEFAULT now(),
    deleted_at                  timestamptz,
    CONSTRAINT fk_bank_accounts_org FOREIGN KEY (org_id) REFERENCES trade.organizations (id) ON DELETE CASCADE,
    CONSTRAINT fk_bank_accounts_document FOREIGN KEY (document_id) REFERENCES tradeops.documents (id) ON DELETE SET NULL,
    CONSTRAINT chk_bank_accounts_status CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_org      ON tradeops.bank_accounts (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bank_accounts_tenant    ON tradeops.bank_accounts (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bank_accounts_status    ON tradeops.bank_accounts (status) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_bank_accounts_org_primary ON tradeops.bank_accounts (org_id) WHERE is_primary AND deleted_at IS NULL;

ALTER TABLE tradeops.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.bank_accounts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.bank_accounts;
CREATE POLICY tenant_isolation ON tradeops.bank_accounts
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

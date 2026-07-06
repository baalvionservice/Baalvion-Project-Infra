-- 034 — Phase 2 Trust/Verification/Compliance Foundation: Fraud Detection.
--
--   • tradeops.fraud_signals — alerts for manual review (duplicate company/tax-ID/
--     bank-account, suspicious login activity, excessive failed logins,
--     multi-account-same-identity, suspicious document submissions).
--   • tradeops.bank_accounts.account_number_fingerprint — a deterministic HMAC-
--     SHA256 of the raw account number (service/verification/bank.js), added so
--     duplicate-bank-account detection doesn't require decrypting the AES-256-GCM
--     ciphertext (which uses a fresh random IV per row and therefore never matches
--     across rows even for identical plaintext).
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function
-- bodies; RLS policy written out explicitly (migration-009 style).

ALTER TABLE tradeops.bank_accounts ADD COLUMN IF NOT EXISTS account_number_fingerprint text;
CREATE INDEX IF NOT EXISTS idx_bank_accounts_fingerprint ON tradeops.bank_accounts (account_number_fingerprint) WHERE deleted_at IS NULL AND account_number_fingerprint IS NOT NULL;

CREATE TABLE IF NOT EXISTS tradeops.fraud_signals (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       text          NOT NULL DEFAULT 'T-DEMO',
    org_id          integer,
    user_id         integer,
    signal_type     text          NOT NULL,
    severity        text          NOT NULL DEFAULT 'medium',
    status          text          NOT NULL DEFAULT 'open',
    details         jsonb         NOT NULL DEFAULT '{}'::jsonb,
    reviewed_by     text,
    reviewed_at     timestamptz,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_fraud_signals_org FOREIGN KEY (org_id) REFERENCES trade.organizations (id) ON DELETE CASCADE,
    CONSTRAINT fk_fraud_signals_user FOREIGN KEY (user_id) REFERENCES trade.users (id) ON DELETE CASCADE,
    CONSTRAINT chk_fraud_signals_type CHECK (signal_type IN (
        'duplicate_company', 'duplicate_tax_id', 'duplicate_bank_account', 'suspicious_login',
        'excessive_failed_logins', 'multi_account_same_identity', 'suspicious_document'
    )),
    CONSTRAINT chk_fraud_signals_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT chk_fraud_signals_status CHECK (status IN ('open', 'reviewing', 'confirmed', 'dismissed'))
);

CREATE INDEX IF NOT EXISTS idx_fraud_signals_org      ON tradeops.fraud_signals (org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fraud_signals_user      ON tradeops.fraud_signals (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fraud_signals_tenant    ON tradeops.fraud_signals (tenant_id);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_status    ON tradeops.fraud_signals (status, severity);
CREATE UNIQUE INDEX IF NOT EXISTS uq_fraud_signals_open_org_type ON tradeops.fraud_signals (org_id, signal_type) WHERE status = 'open' AND org_id IS NOT NULL;

ALTER TABLE tradeops.fraud_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeops.fraud_signals FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tradeops.fraud_signals;
CREATE POLICY tenant_isolation ON tradeops.fraud_signals
    USING ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)))
    WITH CHECK ((current_setting('app.tenant_bypass', true) = 'on' AND current_user <> 'baalvion_app') OR (current_setting('app.current_tenant', true) IS NOT NULL AND current_setting('app.current_tenant', true) <> '' AND tenant_id::text = current_setting('app.current_tenant', true)));

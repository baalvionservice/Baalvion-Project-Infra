-- 070 — Wire the KYC provider adapter layer to the verification records.
--
-- service/verification/kycProviders/ defined a clean vendor interface and registry
-- (submitIdentity / submitCompany / parseWebhookVerdict, selected by KYC_PROVIDER)
-- but NOTHING imported it: setting KYC_PROVIDER=<vendor> changed no behaviour at
-- all, and every decision stayed 100% human. Wiring it needs somewhere to record
-- which vendor holds a case and under what reference, and that reference has to be
-- indexed because a vendor webhook identifies the case by its own id, not ours.
--
-- Deliberately NOT nullable-with-default: a record with no provider_ref is one the
-- manual queue owns, which stays the correct behaviour when no vendor is configured.

ALTER TABLE tradeops.identity_verifications ADD COLUMN IF NOT EXISTS provider_name text;
ALTER TABLE tradeops.identity_verifications ADD COLUMN IF NOT EXISTS provider_ref text;
ALTER TABLE tradeops.identity_verifications ADD COLUMN IF NOT EXISTS provider_submitted_at timestamptz;
ALTER TABLE tradeops.identity_verifications ADD COLUMN IF NOT EXISTS provider_result jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE tradeops.company_verifications ADD COLUMN IF NOT EXISTS provider_name text;
ALTER TABLE tradeops.company_verifications ADD COLUMN IF NOT EXISTS provider_ref text;
ALTER TABLE tradeops.company_verifications ADD COLUMN IF NOT EXISTS provider_submitted_at timestamptz;
ALTER TABLE tradeops.company_verifications ADD COLUMN IF NOT EXISTS provider_result jsonb NOT NULL DEFAULT '{}'::jsonb;

-- A webhook arrives keyed by the vendor's reference; without these it would be a
-- full scan per callback.
CREATE INDEX IF NOT EXISTS idx_identity_verifications_provider_ref ON tradeops.identity_verifications (provider_name, provider_ref);
CREATE INDEX IF NOT EXISTS idx_company_verifications_provider_ref  ON tradeops.company_verifications (provider_name, provider_ref);

-- Revert 070.
DROP INDEX IF EXISTS tradeops.idx_identity_verifications_provider_ref;
DROP INDEX IF EXISTS tradeops.idx_company_verifications_provider_ref;

ALTER TABLE tradeops.identity_verifications DROP COLUMN IF EXISTS provider_name;
ALTER TABLE tradeops.identity_verifications DROP COLUMN IF EXISTS provider_ref;
ALTER TABLE tradeops.identity_verifications DROP COLUMN IF EXISTS provider_submitted_at;
ALTER TABLE tradeops.identity_verifications DROP COLUMN IF EXISTS provider_result;

ALTER TABLE tradeops.company_verifications DROP COLUMN IF EXISTS provider_name;
ALTER TABLE tradeops.company_verifications DROP COLUMN IF EXISTS provider_ref;
ALTER TABLE tradeops.company_verifications DROP COLUMN IF EXISTS provider_submitted_at;
ALTER TABLE tradeops.company_verifications DROP COLUMN IF EXISTS provider_result;

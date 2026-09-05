-- Revert 071.
ALTER TABLE "trade".insurance_policies DROP CONSTRAINT IF EXISTS fk_insurance_policies_underwriter;
ALTER TABLE "trade".insurance_policies DROP CONSTRAINT IF EXISTS chk_policies_placement_status;
DROP INDEX IF EXISTS "trade".idx_insurance_policies_underwriter;

ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS underwriter_id;
ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS underwriter_policy_ref;
ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS placement_status;
ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS commission_rate;
ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS commission_amount;
ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS net_premium;
ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS remittance_ref;

ALTER TABLE "trade".insurance_claims DROP COLUMN IF EXISTS underwriter_claim_ref;
ALTER TABLE "trade".insurance_claims DROP COLUMN IF EXISTS underwriter_settled_amount;
ALTER TABLE "trade".insurance_claims DROP COLUMN IF EXISTS underwriter_settled_at;

DROP TABLE IF EXISTS "trade".insurance_underwriters;

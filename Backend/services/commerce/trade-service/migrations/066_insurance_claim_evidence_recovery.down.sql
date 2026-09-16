-- Revert 066. Drop the FK from claims to GA first, then the GA tables (children
-- cascade), then the evidence file, then the additive columns/constraints.

ALTER TABLE "trade".insurance_claims DROP CONSTRAINT IF EXISTS fk_insurance_claims_ga;

DROP TABLE IF EXISTS "trade".general_average_contributions;
DROP TABLE IF EXISTS "trade".general_average_declarations;
DROP TABLE IF EXISTS "trade".insurance_claim_documents;

ALTER TABLE "trade".insurance_claims DROP CONSTRAINT IF EXISTS fk_insurance_claims_incident;
ALTER TABLE "trade".insurance_claims DROP CONSTRAINT IF EXISTS fk_insurance_claims_container;
ALTER TABLE "trade".insurance_claims DROP CONSTRAINT IF EXISTS chk_insurance_claims_status;
ALTER TABLE "trade".insurance_claims DROP CONSTRAINT IF EXISTS chk_insurance_claims_loss_type;
ALTER TABLE "trade".insurance_claims DROP CONSTRAINT IF EXISTS chk_insurance_claims_subrogation;

DROP INDEX IF EXISTS "trade".idx_insurance_claims_incident;
DROP INDEX IF EXISTS "trade".idx_insurance_claims_ga;

ALTER TABLE "trade".insurance_claims DROP COLUMN IF EXISTS incident_id;
ALTER TABLE "trade".insurance_claims DROP COLUMN IF EXISTS container_id;
ALTER TABLE "trade".insurance_claims DROP COLUMN IF EXISTS loss_date;
ALTER TABLE "trade".insurance_claims DROP COLUMN IF EXISTS loss_type;
ALTER TABLE "trade".insurance_claims DROP COLUMN IF EXISTS gross_loss;
ALTER TABLE "trade".insurance_claims DROP COLUMN IF EXISTS deductible_applied;
ALTER TABLE "trade".insurance_claims DROP COLUMN IF EXISTS required_documents;
ALTER TABLE "trade".insurance_claims DROP COLUMN IF EXISTS evidence_complete;
ALTER TABLE "trade".insurance_claims DROP COLUMN IF EXISTS subrogation_status;
ALTER TABLE "trade".insurance_claims DROP COLUMN IF EXISTS subrogation_recovered;
ALTER TABLE "trade".insurance_claims DROP COLUMN IF EXISTS subrogation_ref;
ALTER TABLE "trade".insurance_claims DROP COLUMN IF EXISTS general_average_id;

ALTER TABLE "trade".insurance_policies DROP CONSTRAINT IF EXISTS chk_insurance_policies_status;
ALTER TABLE "trade".insurance_policies DROP CONSTRAINT IF EXISTS chk_insurance_policies_basis;
DROP INDEX IF EXISTS "trade".idx_insurance_policies_expiry;
ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS expired_at;
ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS coverage_basis;
ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS risk_assessment;

-- Revert 072.
DROP TABLE IF EXISTS "trade".broker_indemnity;

ALTER TABLE "trade".insurance_underwriters DROP CONSTRAINT IF EXISTS chk_underwriter_premium_handling;
ALTER TABLE "trade".insurance_underwriters DROP COLUMN IF EXISTS territories_included;
ALTER TABLE "trade".insurance_underwriters DROP COLUMN IF EXISTS territories_excluded;
ALTER TABLE "trade".insurance_underwriters DROP COLUMN IF EXISTS commodities_excluded;
ALTER TABLE "trade".insurance_underwriters DROP COLUMN IF EXISTS premium_handling;

ALTER TABLE "trade".insurance_policies DROP CONSTRAINT IF EXISTS chk_policies_advice_basis;
ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS trust_account_id;
ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS premium_held_in_trust;
ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS commission_drawn_at;
ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS commission_draw_ref;
ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS advice_basis;
ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS disclosure_accepted_at;
ALTER TABLE "trade".insurance_policies DROP COLUMN IF EXISTS disclosure_version;

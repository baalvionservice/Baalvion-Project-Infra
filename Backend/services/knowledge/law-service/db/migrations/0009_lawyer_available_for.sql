-- 0009_lawyer_available_for.sql — public-profile "Available for" flags
-- (Consultation / Case Referral / International Collaboration).

ALTER TABLE legal.lawyers ADD COLUMN IF NOT EXISTS available_for JSONB NOT NULL DEFAULT '{"consultation": true, "case_referral": false, "international_collaboration": false}';

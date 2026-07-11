-- 0013_review_dimensions.sql — 4-dimension ratings (spec area 8): Professionalism,
-- Communication, Expertise, Timeliness, in addition to the existing overall
-- `rating`. Backward-compatible by construction: `rating` is kept and
-- backfilled as the average of the four dimensions when they're supplied
-- (see reviewController.js), so every existing consumer (the lawyer rating
-- rollup, profile display, admin `reviews` resource) keeps reading one
-- number unchanged. Reviews with only `rating` (no dimensions) still work.
--
-- Also lets a review attach to a completed case_referral (lawyer-to-lawyer
-- collaboration) instead of only a client's booking — booking_id/client_id
-- become nullable, and reviewer_lawyer_id/case_referral_id are added for
-- that path.

ALTER TABLE legal.reviews ALTER COLUMN booking_id DROP NOT NULL;
ALTER TABLE legal.reviews ALTER COLUMN client_id DROP NOT NULL;
-- rating was INTEGER; the 4-dimension average (e.g. (5+4+5+3)/4 = 4.25) needs
-- fractional precision. Matches legal.lawyers.rating's existing NUMERIC(3,2).
ALTER TABLE legal.reviews ALTER COLUMN rating TYPE NUMERIC(3,2);

ALTER TABLE legal.reviews ADD COLUMN IF NOT EXISTS professionalism SMALLINT;
ALTER TABLE legal.reviews ADD COLUMN IF NOT EXISTS communication   SMALLINT;
ALTER TABLE legal.reviews ADD COLUMN IF NOT EXISTS expertise       SMALLINT;
ALTER TABLE legal.reviews ADD COLUMN IF NOT EXISTS timeliness      SMALLINT;
ALTER TABLE legal.reviews ADD COLUMN IF NOT EXISTS case_referral_id   INTEGER REFERENCES legal.case_referrals(id);
ALTER TABLE legal.reviews ADD COLUMN IF NOT EXISTS reviewer_lawyer_id INTEGER REFERENCES legal.lawyers(id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_legal_reviews_referral_reviewer
    ON legal.reviews (case_referral_id, reviewer_lawyer_id)
    WHERE case_referral_id IS NOT NULL;

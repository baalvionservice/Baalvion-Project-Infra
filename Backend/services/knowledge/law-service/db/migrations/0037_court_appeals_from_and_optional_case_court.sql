-- 0037_court_appeals_from_and_optional_case_court.sql — two changes completing
-- the multi-court case chain (site's types/legal.ts Court.appealsFromCourtSlug
-- / LegalCase.courtSlug):
--
-- 1. court_profiles.appeals_from_court_slug: the court whose rulings this one
--    reviews on appeal (walk it repeatedly for a full trial -> appellate ->
--    supreme chain). No FK constraint -- courts are seeded/admin-managed data,
--    not strictly referentially enforced elsewhere in this schema either.
--
-- 2. case_profiles.court_slug is no longer NOT NULL: a case can now be
--    created the moment something newsworthy happens (e.g. an arrest)
--    before any court is on record, with the court filled in once known.
--    Which specific court(s) a case actually passed through can be recorded
--    per timeline entry (timeline is JSONB, so no schema change needed there).

ALTER TABLE legal.court_profiles
    ADD COLUMN IF NOT EXISTS appeals_from_court_slug VARCHAR(200);

ALTER TABLE legal.case_profiles
    ALTER COLUMN court_slug DROP NOT NULL;

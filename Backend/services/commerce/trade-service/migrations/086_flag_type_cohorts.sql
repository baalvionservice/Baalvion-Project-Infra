-- 086 — the flag × type cross-cut as its own cohort dimension.
--
-- "Panama-flagged ships" (9,598 hulls) and "bulk carriers" (6,890) are both true of
-- thousands of pages each and read as generic. "Panama-flagged bulk carriers" narrows to
-- something specific, and there are 274 such combinations holding 25 or more vessels,
-- covering 26,143 hulls between them. That is 274 pages of genuine list intent that
-- currently exist only as a two-parameter search view carrying noindex.
--
-- Stored as a cohort rather than computed per request for the same reason as 071: the
-- aggregate is a scan, which is fine once per ingest and not fine once per page view. The
-- 25-vessel floor is deliberate — below it a page has too few rows to be worth a crawl,
-- and 5,512 possible combinations would mostly be near-empty.

ALTER TABLE tradeops.vessel_cohort_stats DROP CONSTRAINT IF EXISTS chk_vessel_cohort_dimension;
ALTER TABLE tradeops.vessel_cohort_stats ADD CONSTRAINT chk_vessel_cohort_dimension
    CHECK (dimension IN ('global', 'type', 'flag', 'year', 'builder', 'decade', 'flag_type'));

-- The page filters on both columns at once; without this it is a sequential scan per view.
CREATE INDEX IF NOT EXISTS idx_vessels_flag_type ON tradeops.vessels (flag_country, vessel_type);

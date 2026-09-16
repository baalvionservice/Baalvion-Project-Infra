-- 085 — give the cohorts addressable URLs.
--
-- build-context.js already computes 1,165 shipbuilder cohorts and 212 flag-state cohorts,
-- with counts, medians and date ranges for each. None of them had a page: a builder was
-- reachable only as `/ships?q=Hyundai` and a flag only as `/ships?flag=Panama`, both of
-- which are filtered search views that carry noindex and that a crawler treats as
-- permutations of one page rather than as destinations.
--
-- That is ~1,380 entity pages with real list intent ("Panama flagged ships",
-- "Hyundai Heavy Industries built ships") sitting unbuilt on data we already hold. The
-- slug is stored rather than derived at request time so the URL is stable across ingests
-- and a lookup is an index hit rather than a scan over slugified names.

ALTER TABLE tradeops.vessel_cohort_stats ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_cohort_stats_slug
    ON tradeops.vessel_cohort_stats (dimension, slug) WHERE slug IS NOT NULL;

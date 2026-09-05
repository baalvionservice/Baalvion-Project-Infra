DROP INDEX IF EXISTS tradeops.uq_cohort_stats_slug;
ALTER TABLE tradeops.vessel_cohort_stats DROP COLUMN IF EXISTS slug;

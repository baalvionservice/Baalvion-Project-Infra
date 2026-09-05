DELETE FROM tradeops.vessel_cohort_stats WHERE dimension = 'flag_type';
DROP INDEX IF EXISTS tradeops.idx_vessels_flag_type;
ALTER TABLE tradeops.vessel_cohort_stats DROP CONSTRAINT IF EXISTS chk_vessel_cohort_dimension;
ALTER TABLE tradeops.vessel_cohort_stats ADD CONSTRAINT chk_vessel_cohort_dimension
    CHECK (dimension IN ('global', 'type', 'flag', 'year', 'builder', 'decade'));

DROP TABLE IF EXISTS tradeops.vessel_cohort_stats;
ALTER TABLE tradeops.vessels
    DROP COLUMN IF EXISTS gt_rank_global, DROP COLUMN IF EXISTS gt_rank_in_type,
    DROP COLUMN IF EXISTS gt_rank_in_flag, DROP COLUMN IF EXISTS gt_rank_in_year,
    DROP COLUMN IF EXISTS gt_pct_in_type, DROP COLUMN IF EXISTS context_built_at;
ALTER TABLE tradeops.carriers
    DROP COLUMN IF EXISTS fleet_rank_global, DROP COLUMN IF EXISTS fleet_rank_in_country,
    DROP COLUMN IF EXISTS country_carrier_count, DROP COLUMN IF EXISTS context_built_at;

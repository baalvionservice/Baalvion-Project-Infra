-- 071 — precomputed cohort position, so every vessel page can say something true and
-- SPECIFIC about the hull it describes.
--
-- 52,364 of 95,871 vessel pages carry no photograph, no summary, no builder and no
-- operator. They are a name, an IMO number and a flag on a shared template — roughly 40
-- unique words. Pages like that do not get indexed, and 52,000 of them is the shape
-- Google's scaled-content policy exists to catch.
--
-- The fix is not more words. It is more DIFFERENT words: where this hull sits among the
-- ships of its type, its flag, its build year and its builder is a genuine, verifiable
-- fact that differs for every one of the 95,871 rows, and it is already implicit in the
-- registry. This migration makes it explicit.
--
-- Computed in the rollup, not at render time: the cohort aggregate is a 400ms sequential
-- scan, which is fine once per ingest and not fine once per page view.
--
-- NOTHING HERE IS AN ESTIMATE. Every column is a count, a rank or a percentile over rows
-- actually held. A vessel with no recorded tonnage gets NULL ranks and its page says so
-- rather than placing it somewhere plausible.

ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS gt_rank_global   integer;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS gt_rank_in_type  integer;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS gt_rank_in_flag  integer;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS gt_rank_in_year  integer;
-- Percentile of this hull's tonnage within its type, 0-100. Stored rather than derived so
-- the page and the sitemap cannot disagree about what "larger than 78%" means.
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS gt_pct_in_type   numeric(5,2);
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS context_built_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_vessels_gt_rank_type ON tradeops.vessels (vessel_type, gt_rank_in_type);

-- One row per cohort the vessel pages compare against.
CREATE TABLE IF NOT EXISTS tradeops.vessel_cohort_stats (
    dimension     text NOT NULL,
    cohort_key    text NOT NULL,
    n             integer NOT NULL DEFAULT 0,
    with_gt       integer NOT NULL DEFAULT 0,
    median_gt     bigint,
    p10_gt        bigint,
    p90_gt        bigint,
    max_gt        bigint,
    median_year   integer,
    oldest_year   integer,
    newest_year   integer,
    median_length numeric(8,2),
    top_flag      text,
    top_flag_n    integer,
    top_type      text,
    top_type_n    integer,
    top_builder   text,
    top_builder_n integer,
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_vessel_cohort_stats PRIMARY KEY (dimension, cohort_key),
    CONSTRAINT chk_vessel_cohort_dimension CHECK (dimension IN ('global', 'type', 'flag', 'year', 'builder', 'decade'))
);

-- Carrier position, for the company pages that hold little else.
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS fleet_rank_global     integer;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS fleet_rank_in_country integer;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS country_carrier_count integer;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS context_built_at      timestamptz;

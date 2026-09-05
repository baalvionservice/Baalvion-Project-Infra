-- 067 — World Shipping Company Directory: the public "every shipping company and its
-- ships" layer. Extends the two tables that already own this data rather than adding a
-- parallel registry:
--   tradeops.carriers  (047) — the company
--   tradeops.vessels   (065) — the ship, keyed by its permanent IMO number
--
-- PROVENANCE IS THE POINT OF THIS MIGRATION. Two different numbers get confused in this
-- domain and must never be merged into one column:
--
--   registry_vessel_count  — ships WE actually hold a row for, counted from
--                            tradeops.vessels. Verifiable, always an undercount.
--   reported_fleet_size    — the fleet size the company/industry itself publishes,
--                            copied from a named source with a URL and an as-of date.
--
-- Wikidata links only ~6.3k of its ~90k IMO-numbered ships to an operator, so a counted
-- fleet says MSC runs ~44 ships when it runs ~1,000. Showing a counted number where a
-- reported one belongs is a factual error, so every reported figure carries
-- reported_source / reported_source_url / reported_as_of and is rendered as a citation.
--
-- migrate.js NOTE — splits on ";\n", so NO DO-blocks / multi-statement function bodies.

-- ─────────────────────────────────────────────────────────────────────────────
-- CARRIERS — directory/company-profile columns
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS slug                 text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS wikidata_qid         text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS legal_name           text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS description          text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS website              text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS headquarters         text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS country_code         text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS founded_year         integer;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS company_type         text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS employee_count       integer;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS parent_name          text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS alliance             text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS data_source          text NOT NULL DEFAULT 'manual';
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS source_url           text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS last_ingested_at     timestamptz;

-- Counted from tradeops.vessels — refreshed by the ingest, never hand-written.
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS registry_vessel_count integer NOT NULL DEFAULT 0;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS registry_teu          bigint;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS registry_dwt          bigint;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS registry_gt           bigint;

-- Published by the company / industry press. Meaningless without its citation, so the
-- source columns travel with it.
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS reported_fleet_size  integer;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS reported_teu         bigint;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS market_share_pct     numeric(6,3);
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS reported_source      text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS reported_source_url  text;
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS reported_as_of       date;

-- Rank by published TEU capacity (container lines only) — null where no reported figure
-- exists, so an unranked company is never silently shown as "last".
ALTER TABLE tradeops.carriers ADD COLUMN IF NOT EXISTS capacity_rank        integer;

CREATE UNIQUE INDEX IF NOT EXISTS uq_carriers_slug     ON tradeops.carriers (slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_carriers_qid      ON tradeops.carriers (wikidata_qid) WHERE wikidata_qid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_carriers_country_code   ON tradeops.carriers (country_code);
CREATE INDEX IF NOT EXISTS idx_carriers_capacity_rank  ON tradeops.carriers (capacity_rank) WHERE capacity_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_carriers_vessel_count   ON tradeops.carriers (registry_vessel_count DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- VESSELS — directory/ship-profile columns
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS slug            text;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS wikidata_qid    text;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS carrier_id      uuid;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS owner_name      text;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS builder_name    text;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS home_port       text;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS call_sign       text;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS gross_tonnage   integer;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS length_m        numeric(8,2);
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS beam_m          numeric(8,2);
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS draft_m         numeric(8,2);
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS vessel_class    text;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS status          text NOT NULL DEFAULT 'in_service';
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS decommissioned_year integer;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS image_url       text;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS source_url      text;
ALTER TABLE tradeops.vessels ADD COLUMN IF NOT EXISTS last_ingested_at timestamptz;

ALTER TABLE tradeops.vessels DROP CONSTRAINT IF EXISTS fk_vessels_carrier;
ALTER TABLE tradeops.vessels ADD CONSTRAINT fk_vessels_carrier FOREIGN KEY (carrier_id) REFERENCES tradeops.carriers (id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_vessels_slug ON tradeops.vessels (slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_vessels_qid  ON tradeops.vessels (wikidata_qid) WHERE wikidata_qid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vessels_carrier_id  ON tradeops.vessels (carrier_id);
CREATE INDEX IF NOT EXISTS idx_vessels_year_built  ON tradeops.vessels (year_built);
CREATE INDEX IF NOT EXISTS idx_vessels_gt          ON tradeops.vessels (gross_tonnage DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_vessels_teu         ON tradeops.vessels (capacity_teu DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_vessels_type_status ON tradeops.vessels (vessel_type, status);

-- The existing 065 type CHECK is too narrow for a whole-world registry (Wikidata has
-- fishing vessels, tugs, supply vessels, rigs, naval auxiliaries...). Widen it.
ALTER TABLE tradeops.vessels DROP CONSTRAINT IF EXISTS chk_vessels_type;
ALTER TABLE tradeops.vessels ADD CONSTRAINT chk_vessels_type CHECK (vessel_type IN (
    'container', 'bulk_carrier', 'tanker', 'oil_tanker', 'chemical_tanker', 'lng_carrier',
    'lpg_carrier', 'roro', 'car_carrier', 'general_cargo', 'multi_purpose', 'reefer',
    'cruise', 'ferry', 'passenger', 'tug', 'offshore_supply', 'fishing', 'research',
    'dredger', 'heavy_lift', 'barge', 'naval', 'rig', 'other'
));

ALTER TABLE tradeops.vessels DROP CONSTRAINT IF EXISTS chk_vessels_status;
ALTER TABLE tradeops.vessels ADD CONSTRAINT chk_vessels_status CHECK (status IN (
    'in_service', 'laid_up', 'scrapped', 'lost', 'under_construction', 'unknown'
));

-- ─────────────────────────────────────────────────────────────────────────────
-- CARRIER FLEET HISTORY — the per-year track record shown on a company page.
-- Rows are DERIVED (vessels delivered in a year, from real year_built values) or
-- REPORTED (a published capacity/fleet figure for that year). `basis` says which, so
-- the UI never presents a derived count as a company disclosure.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradeops.carrier_fleet_history (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id            uuid NOT NULL REFERENCES tradeops.carriers (id) ON DELETE CASCADE,
    year                  integer NOT NULL,
    basis                 text NOT NULL DEFAULT 'derived',
    vessels_delivered     integer NOT NULL DEFAULT 0,
    cumulative_vessels    integer NOT NULL DEFAULT 0,
    teu_delivered         bigint,
    cumulative_teu        bigint,
    gt_delivered          bigint,
    reported_fleet_size   integer,
    reported_teu          bigint,
    note                  text,
    data_source           text NOT NULL DEFAULT 'wikidata',
    source_url            text,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_fleet_history_basis CHECK (basis IN ('derived', 'reported'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_fleet_history_carrier_year_basis
    ON tradeops.carrier_fleet_history (carrier_id, year, basis);
CREATE INDEX IF NOT EXISTS idx_fleet_history_year ON tradeops.carrier_fleet_history (year);

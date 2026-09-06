-- Provenance + primary-record tables for investors ingested from public filings.
--
-- The directory's claim is "this is what the public record says", so every ingested row has to
-- carry where it came from and when it was last confirmed. Anything without provenance is
-- hand-entered and is labelled as such in the UI.
SET search_path TO insiders, public;

ALTER TABLE investors
  ADD COLUMN IF NOT EXISTS source            TEXT,          -- 'sec_form_d' | 'manual' | 'seed'
  ADD COLUMN IF NOT EXISTS source_id         TEXT,          -- stable id at the source (SEC CIK)
  ADD COLUMN IF NOT EXISTS source_url        TEXT,          -- deep link to the record itself
  ADD COLUMN IF NOT EXISTS entity_type       TEXT,          -- Limited Partnership, LLC, …
  ADD COLUMN IF NOT EXISTS year_founded      INTEGER,
  ADD COLUMN IF NOT EXISTS fund_count        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_raised_usd  NUMERIC,       -- summed across that firm's filings
  ADD COLUMN IF NOT EXISTS first_filing_date DATE,
  ADD COLUMN IF NOT EXISTS last_filing_date  DATE,
  ADD COLUMN IF NOT EXISTS last_verified_at  TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS investors_source_key_idx ON investors (source, source_id)
  WHERE source IS NOT NULL AND source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS investors_last_filing_idx ON investors (last_filing_date DESC NULLS LAST);

-- One row per filing: the primary record behind every claim on a firm's profile.
CREATE TABLE IF NOT EXISTS investor_funds (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id      UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  fund_name        TEXT NOT NULL,
  cik              TEXT,
  accession_number TEXT NOT NULL UNIQUE,     -- the filing's own identifier at the SEC
  fund_type        TEXT,                     -- Venture Capital Fund, Private Equity Fund, …
  industry_group   TEXT,
  entity_type      TEXT,
  jurisdiction     TEXT,
  year_of_inc      INTEGER,
  total_offering_usd NUMERIC,
  total_sold_usd     NUMERIC,
  remaining_usd      NUMERIC,
  min_investment_usd NUMERIC,
  investor_count     INTEGER,                -- number who had already invested at filing time
  first_sale_date  DATE,
  filing_date      DATE,
  is_amendment     BOOLEAN DEFAULT FALSE,
  city             TEXT,
  state_or_country TEXT,
  source_url       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS investor_funds_investor_idx ON investor_funds (investor_id, filing_date DESC);

-- Named people the filings attach to a firm (executive officers, directors, promoters).
CREATE TABLE IF NOT EXISTS investor_people (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id   UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  relationships TEXT[],                      -- Executive Officer / Director / Promoter
  city          TEXT,
  state_or_country TEXT,
  filings_count INTEGER DEFAULT 1,
  first_seen    DATE,
  last_seen     DATE,
  source_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS investor_people_unique_idx ON investor_people (investor_id, full_name);

DROP TRIGGER IF EXISTS investor_funds_updated_at ON investor_funds;
CREATE TRIGGER investor_funds_updated_at BEFORE UPDATE ON investor_funds FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
DROP TRIGGER IF EXISTS investor_people_updated_at ON investor_people;
CREATE TRIGGER investor_people_updated_at BEFORE UPDATE ON investor_people FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Operating companies raising capital, and the people named on their filings.
--
-- Kept separate from `profiles`: a profile is a member account someone controls, a company here
-- is a public record about a business that has never heard of us. Merging them would make it
-- impossible to tell "this founder joined" from "this company appears in a filing".
SET search_path TO insiders, public;

CREATE TABLE IF NOT EXISTS companies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  cik               TEXT,
  source            TEXT,                 -- 'sec_form_d'
  source_id         TEXT,
  source_url        TEXT,
  entity_type       TEXT,
  jurisdiction      TEXT,
  year_founded      INTEGER,
  industry_group    TEXT,
  revenue_range     TEXT,
  street            TEXT,
  location          TEXT,
  country           TEXT, country_slug TEXT,
  state             TEXT, state_slug   TEXT,
  city              TEXT, city_slug    TEXT,
  filing_count      INTEGER DEFAULT 0,
  total_raised_usd  NUMERIC,
  largest_round_usd NUMERIC,
  first_filing_date DATE,
  last_filing_date  DATE,
  last_verified_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS companies_source_key_idx ON companies (source, source_id)
  WHERE source IS NOT NULL AND source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS companies_country_idx  ON companies (country_slug);
CREATE INDEX IF NOT EXISTS companies_state_idx    ON companies (state_slug);
CREATE INDEX IF NOT EXISTS companies_city_idx     ON companies (city_slug);
CREATE INDEX IF NOT EXISTS companies_industry_idx ON companies (industry_group);
CREATE INDEX IF NOT EXISTS companies_last_filing_idx ON companies (last_filing_date DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS company_filings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  accession_number   TEXT NOT NULL UNIQUE,
  cik                TEXT,
  entity_name        TEXT,
  industry_group     TEXT,
  revenue_range      TEXT,
  entity_type        TEXT,
  jurisdiction       TEXT,
  year_of_inc        INTEGER,
  total_offering_usd NUMERIC,
  total_sold_usd     NUMERIC,
  remaining_usd      NUMERIC,
  min_investment_usd NUMERIC,
  investor_count     INTEGER,
  has_non_accredited BOOLEAN,
  first_sale_date    DATE,
  filing_date        DATE,
  is_amendment       BOOLEAN DEFAULT FALSE,
  city               TEXT,
  state_or_country   TEXT,
  source_url         TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS company_filings_company_idx ON company_filings (company_id, filing_date DESC);

-- Executives, directors and promoters named on a company's filings. For an early-stage company
-- these are, in practice, its founders — but the column says what the filing says, not more.
CREATE TABLE IF NOT EXISTS company_people (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  relationships TEXT[],
  city          TEXT,
  state_or_country TEXT,
  filings_count INTEGER DEFAULT 1,
  first_seen    DATE,
  last_seen     DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS company_people_unique_idx ON company_people (company_id, full_name);
CREATE INDEX IF NOT EXISTS company_people_name_idx ON company_people (full_name);

-- People search spans both sides of the directory, so it needs one place to look.
CREATE INDEX IF NOT EXISTS investor_people_name_idx ON investor_people (full_name);

DROP TRIGGER IF EXISTS companies_updated_at ON companies;
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
DROP TRIGGER IF EXISTS company_filings_updated_at ON company_filings;
CREATE TRIGGER company_filings_updated_at BEFORE UPDATE ON company_filings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
DROP TRIGGER IF EXISTS company_people_updated_at ON company_people;
CREATE TRIGGER company_people_updated_at BEFORE UPDATE ON company_people FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

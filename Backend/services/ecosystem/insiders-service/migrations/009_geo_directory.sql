-- Structured geography for the public directory. Resolved from free-text `location` on write
-- (models/index.js hook + data/gazetteer.js), never matched as text at read time.
SET search_path TO insiders, public;

ALTER TABLE investors
  ADD COLUMN IF NOT EXISTS country      TEXT,
  ADD COLUMN IF NOT EXISTS country_slug TEXT,
  ADD COLUMN IF NOT EXISTS state        TEXT,
  ADD COLUMN IF NOT EXISTS state_slug   TEXT,
  ADD COLUMN IF NOT EXISTS city         TEXT,
  ADD COLUMN IF NOT EXISTS city_slug    TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS location     TEXT,
  ADD COLUMN IF NOT EXISTS country      TEXT,
  ADD COLUMN IF NOT EXISTS country_slug TEXT,
  ADD COLUMN IF NOT EXISTS state        TEXT,
  ADD COLUMN IF NOT EXISTS state_slug   TEXT,
  ADD COLUMN IF NOT EXISTS city         TEXT,
  ADD COLUMN IF NOT EXISTS city_slug    TEXT;

CREATE INDEX IF NOT EXISTS investors_country_slug_idx ON investors (country_slug);
CREATE INDEX IF NOT EXISTS investors_state_slug_idx   ON investors (state_slug);
CREATE INDEX IF NOT EXISTS investors_city_slug_idx    ON investors (city_slug);
CREATE INDEX IF NOT EXISTS profiles_country_slug_idx  ON profiles (country_slug);
CREATE INDEX IF NOT EXISTS profiles_state_slug_idx    ON profiles (state_slug);
CREATE INDEX IF NOT EXISTS profiles_city_slug_idx     ON profiles (city_slug);

-- International coverage. SEC Form D is a US filing regime, so reaching founders outside the US
-- means reading national company registers directly. Each register is a distinct source with its
-- own identifiers, so the provenance columns generalise rather than assuming Form D.
SET search_path TO insiders, public;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS registry_name    TEXT,     -- display name of the register
  ADD COLUMN IF NOT EXISTS registry_number  TEXT,     -- org number / business id in that register
  ADD COLUMN IF NOT EXISTS industry_code    TEXT,     -- NACE or national equivalent, as published
  ADD COLUMN IF NOT EXISTS legal_form       TEXT,
  ADD COLUMN IF NOT EXISTS status           TEXT,
  ADD COLUMN IF NOT EXISTS founded_on       DATE,
  ADD COLUMN IF NOT EXISTS website          TEXT,
  ADD COLUMN IF NOT EXISTS employees        INTEGER;

CREATE INDEX IF NOT EXISTS companies_source_idx ON companies (source);
CREATE INDEX IF NOT EXISTS companies_registry_number_idx ON companies (registry_number);

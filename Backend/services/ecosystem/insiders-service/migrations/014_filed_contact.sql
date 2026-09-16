-- Business contact as filed. Form D carries no email and no website, but every filer must give a
-- business address and telephone number for regulatory contact, and EDGAR publishes both. Without
-- these the directory can say who funds companies like yours and offer no way to reach them.
SET search_path TO insiders, public;

ALTER TABLE investors
  ADD COLUMN IF NOT EXISTS street      TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT;
-- investors.phone already exists (migration 003) and has never been populated.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS phone       TEXT;

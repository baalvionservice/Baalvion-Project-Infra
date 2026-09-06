-- Compiled records cannot simply be deleted: the next ingest would recreate them. A suppression
-- flag lets an admin take a wrong merge or a junk row off the public directory permanently, and
-- the ingest deliberately never writes this column.
SET search_path TO insiders, public;

ALTER TABLE investors ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS investors_visible_idx ON investors (last_filing_date DESC NULLS LAST) WHERE is_hidden = FALSE;
CREATE INDEX IF NOT EXISTS companies_visible_idx ON companies (last_filing_date DESC NULLS LAST) WHERE is_hidden = FALSE;

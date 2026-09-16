-- Some addresses are fund administrators and registered agents, not offices. Hundreds of unrelated
-- firms file from one suite, which put 1,415 "venture firms" in one Seattle building and 240 in a
-- Claymont mail drop. The firms are real; the city is not theirs.
--
-- We keep the filed address (it is what the record says) but stop treating it as a location, so
-- these firms no longer appear on city or state pages claiming to be there.
SET search_path TO insiders, public;

ALTER TABLE investors ADD COLUMN IF NOT EXISTS address_is_service BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address_is_service BOOLEAN NOT NULL DEFAULT FALSE;

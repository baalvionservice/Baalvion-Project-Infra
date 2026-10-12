-- 088 — Real sanctions-list provenance (Compliance engine).
--
-- compliance_sanctioned_parties was seeded with a handful of illustrative rows.
-- It now holds the official OFAC SDN, UN Security Council and EU consolidated
-- lists, imported by service/compliance/lists. Every imported row needs to say
-- which publisher record it is, which publication it came from, and when we last
-- saw it — and a party the publisher removes must be deactivated, never deleted,
-- so a past screening can still be explained.
--
--   source_id          the publisher's own id (OFAC uid, UN reference number, EU
--                      logicalId). NULL for the hand-curated country-level rows.
--   source_list_date   publication date of the file the row last came from.
--   last_seen_at       last import in which the publisher still listed it.
--   delisted_at        set when a later import no longer lists it (active=false).
--
-- The old uniqueness (list_source, party_type, name, country) cannot hold for real
-- lists: publishers legitimately list distinct records with the same name and
-- country. Imported rows are keyed by (list_source, source_id) instead, and the
-- original rule is kept for the rows that have no source id.

ALTER TABLE tradeops.compliance_sanctioned_parties ADD COLUMN IF NOT EXISTS source_id text;
ALTER TABLE tradeops.compliance_sanctioned_parties ADD COLUMN IF NOT EXISTS source_list_date date;
ALTER TABLE tradeops.compliance_sanctioned_parties ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
ALTER TABLE tradeops.compliance_sanctioned_parties ADD COLUMN IF NOT EXISTS delisted_at timestamptz;
ALTER TABLE tradeops.compliance_sanctioned_parties DROP CONSTRAINT IF EXISTS uq_sanctioned_parties;
CREATE UNIQUE INDEX IF NOT EXISTS uq_sanctioned_parties_curated ON tradeops.compliance_sanctioned_parties (list_source, party_type, name, country) WHERE source_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_sanctioned_parties_source ON tradeops.compliance_sanctioned_parties (list_source, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sanctioned_parties_active_source ON tradeops.compliance_sanctioned_parties (list_source, active);

-- One row per import attempt: what was downloaded, what changed, and why a run
-- was refused. This is the audit trail for "what list were we screening against".
CREATE TABLE IF NOT EXISTS tradeops.compliance_list_imports (
    id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    list_source       text         NOT NULL,
    source_url        text,
    source_list_date  date,
    source_sha256     text,
    records_parsed    integer      NOT NULL DEFAULT 0,
    records_added     integer      NOT NULL DEFAULT 0,
    records_updated   integer      NOT NULL DEFAULT 0,
    records_delisted  integer      NOT NULL DEFAULT 0,
    status            text         NOT NULL,
    detail            text,
    started_at        timestamptz  NOT NULL DEFAULT now(),
    finished_at       timestamptz,
    CONSTRAINT chk_list_imports_status CHECK (status IN ('succeeded','unchanged','refused','failed'))
);

CREATE INDEX IF NOT EXISTS idx_list_imports_source ON tradeops.compliance_list_imports (list_source, started_at DESC);

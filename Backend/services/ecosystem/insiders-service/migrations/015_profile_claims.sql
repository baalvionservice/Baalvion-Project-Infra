-- Claiming a compiled profile.
--
-- Every record here was compiled from a public filing; nobody on it chose to be listed. A claim is
-- the only honest route from "listed" to "reachable": the firm itself asks for the record, proves
-- who it is, and then owns what appears on it.
SET search_path TO insiders, public;

CREATE TABLE IF NOT EXISTS profile_claims (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type    TEXT NOT NULL CHECK (entity_type IN ('investor','company')),
  entity_id      UUID NOT NULL,
  entity_name    TEXT,
  claimant_name  TEXT NOT NULL,
  claimant_email TEXT NOT NULL,
  claimant_role  TEXT,
  claimant_phone TEXT,
  evidence_url   TEXT,
  message        TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_note    TEXT,
  reviewed_by    UUID,
  reviewed_at    TIMESTAMPTZ,
  ip_hash        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS profile_claims_status_idx ON profile_claims (status, created_at DESC);
CREATE INDEX IF NOT EXISTS profile_claims_entity_idx ON profile_claims (entity_type, entity_id);
-- One live claim per profile: a second pending request on the same record is a duplicate, not a
-- competing claim to adjudicate.
CREATE UNIQUE INDEX IF NOT EXISTS profile_claims_one_pending_idx
  ON profile_claims (entity_type, entity_id) WHERE status = 'pending';

ALTER TABLE investors
  ADD COLUMN IF NOT EXISTS claimed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claimed_by   TEXT;
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS claimed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claimed_by   TEXT;

DROP TRIGGER IF EXISTS profile_claims_updated_at ON profile_claims;
CREATE TRIGGER profile_claims_updated_at BEFORE UPDATE ON profile_claims FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Shareable, single-use case invitations.
--
-- The original flow required the owner to type the invitee's account UUID, which is safe but
-- unusable. This replaces it with a code the owner can hand over by whatever channel they
-- already trust, without the platform learning anything about the recipient.
--
-- What this table deliberately does NOT hold: no email, no phone, no name — the same rule as
-- case_participants. An invitation names a RELATION and a case, never a person. Whoever
-- redeems the code identifies themselves by signing in, and only then does a participant row
-- appear.
--
-- Only a hash of the token is stored, on the same reasoning as a password or an API key: a
-- reader of this table cannot use what they find to accept an invitation. The raw code is
-- returned exactly once, at creation.
SET search_path TO canwemarry, public;

CREATE TABLE IF NOT EXISTS case_invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  relation     TEXT NOT NULL CHECK (relation IN ('PARTNER','FAMILY_MEMBER','MEDIATOR','LEGAL_ADVISOR','COUNSELLOR','OTHER')),
  status       TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACCEPTED','DECLINED','REVOKED')),
  created_by   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Set only once somebody redeems it. Until then the invitation identifies nobody.
  accepted_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT case_invitations_accepted_has_user CHECK (status <> 'ACCEPTED' OR accepted_by IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_case_invitations_case ON case_invitations(case_id, created_at DESC);
-- The redemption lookup is by hash and must stay a single index probe: it is the one
-- endpoint an attacker would guess against.
CREATE INDEX IF NOT EXISTS idx_case_invitations_pending ON case_invitations(token_hash) WHERE status = 'PENDING';

DROP TRIGGER IF EXISTS case_invitations_updated_at ON case_invitations;
CREATE TRIGGER case_invitations_updated_at BEFORE UPDATE ON case_invitations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Communities gained a stated purpose and rules, so members can tell before joining what a
-- group is for and what is expected of them.
ALTER TABLE communities ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS rules TEXT;

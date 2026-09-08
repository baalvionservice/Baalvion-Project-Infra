-- Asking to become a supporter.
--
-- `case:support` belongs to SUPPORTER and above, never to a plain USER — offering to stand
-- with someone in a family crisis is a standing you are given, not a checkbox a stranger
-- ticks on their first afternoon. That was the right decision and it was also a dead end:
-- the only way to acquire the role was for a moderator to notice you, and nothing in the
-- product ever put a name in front of one. So the platform's central act — reading somebody's
-- case and offering to help — was closed to every account that ever signed up.
--
-- This table is the missing half. A member asks in writing, a moderator reads the reason and
-- decides. The vetting intent survives; the dead end does not.
SET search_path TO canwemarry, public;

CREATE TABLE IF NOT EXISTS role_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Only the two roles a moderator may confer. ADMIN and MODERATOR are deliberately absent:
  -- a request table that could ask for them would be a way to nominate yourself for power.
  role          TEXT NOT NULL CHECK (role IN ('SUPPORTER','VOLUNTEER')),
  -- The applicant's own words. Read by moderators only; never shown next to a case.
  reason        TEXT NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 40 AND 2000),
  status        TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','DECLINED','WITHDRAWN')),
  decided_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  decided_at    TIMESTAMPTZ,
  -- Why it was refused, in the moderator's words. Shown to the applicant, so a decline is
  -- answerable rather than a silent wall.
  decision_note TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One open request per person per role. A partial unique index rather than a plain one, so a
-- declined request does not block someone from ever asking again — people's circumstances
-- change, and a refusal in March should not be permanent.
CREATE UNIQUE INDEX IF NOT EXISTS uq_role_requests_open
  ON role_requests(user_id, role) WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_role_requests_queue ON role_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_role_requests_user  ON role_requests(user_id, created_at DESC);

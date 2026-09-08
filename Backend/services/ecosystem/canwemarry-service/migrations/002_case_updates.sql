-- Owner-authored progress notes on a case.
--
-- Distinct from comments on purpose: a comment is a conversation anyone in the case can
-- join, whereas an update is the owner's own account of how the situation has moved. They
-- read differently and are authored by different people, so conflating them would make a
-- case's history unreadable.
SET search_path TO canwemarry, public;

CREATE TABLE IF NOT EXISTS case_updates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id    UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_case_updates_case ON case_updates(case_id, created_at DESC);

DROP TRIGGER IF EXISTS case_updates_updated_at ON case_updates;
CREATE TRIGGER case_updates_updated_at BEFORE UPDATE ON case_updates
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

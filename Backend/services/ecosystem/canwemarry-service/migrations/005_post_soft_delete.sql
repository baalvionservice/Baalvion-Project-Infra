-- Author-deleted posts become tombstones rather than disappearing.
--
-- A hard DELETE removed the row entirely, which satisfied "the body must not be readable"
-- but broke the other half: reports and moderation actions address content by
-- (target_type, target_id) with no foreign key, so a moderator reviewing a report about a
-- deleted post was left holding a UUID that resolved to nothing.
--
-- The tombstone keeps the row addressable while the CONTENT is genuinely gone — the title
-- and body are overwritten at delete time, not merely hidden behind a flag, so the original
-- text is not recoverable from this table by anyone.
SET search_path TO canwemarry, public;

ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Every read path filters on this, so keep it in the covering index.
DROP INDEX IF EXISTS idx_posts_community;
CREATE INDEX IF NOT EXISTS idx_posts_community ON posts(community_id, moderation_state, created_at DESC)
  WHERE deleted_at IS NULL;

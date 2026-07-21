-- Migration 037: Community thread metadata (Q&A type + accepted answer)
-- Run once against baalvion_db after migration 036.
--
-- NodeBB remains the system of record for actual thread/post CONTENT (see migration 031's
-- header) — this table only layers platform-owned metadata on top of a NodeBB topic id (tid):
-- whether the thread was started as a "question" vs a plain "discussion", and (for questions)
-- whether it has an accepted answer and which NodeBB post id (pid) that is. Community-service's
-- contentController merges this onto NodeBB's topic/post payloads before returning them.

CREATE TABLE IF NOT EXISTS community.community_threads (
    tid              INTEGER PRIMARY KEY,
    community_id     UUID NOT NULL REFERENCES community.communities(id) ON DELETE CASCADE,
    thread_type      VARCHAR(20) NOT NULL DEFAULT 'discussion'
                     CHECK (thread_type IN ('discussion', 'question')),
    is_answered      BOOLEAN NOT NULL DEFAULT false,
    accepted_pid     INTEGER,
    author_user_id   UUID NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_threads_community ON community.community_threads (community_id);
CREATE INDEX IF NOT EXISTS idx_community_threads_author ON community.community_threads (author_user_id);

-- 0012_discussion_groups.sql — legal communities + Q&A (spec area 5).
-- Q&A is modeled as group_posts with post_type + a nullable parent_post_id
-- (answers reference the question they answer), rather than a separate
-- subsystem — one posts table serves "share legal updates", "ask legal
-- questions", and "answer questions".

CREATE TABLE IF NOT EXISTS legal.discussion_groups (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    slug         VARCHAR(200) NOT NULL UNIQUE,
    description  TEXT,
    created_by   INTEGER REFERENCES legal.lawyers(id),
    is_active    BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legal.group_members (
    id         SERIAL PRIMARY KEY,
    group_id   INTEGER NOT NULL REFERENCES legal.discussion_groups(id) ON DELETE CASCADE,
    lawyer_id  INTEGER NOT NULL REFERENCES legal.lawyers(id) ON DELETE CASCADE,
    role       VARCHAR(20) NOT NULL DEFAULT 'member', -- member | moderator
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (group_id, lawyer_id)
);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON legal.group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_lawyer ON legal.group_members (lawyer_id);

CREATE TABLE IF NOT EXISTS legal.group_posts (
    id               SERIAL PRIMARY KEY,
    group_id         INTEGER NOT NULL REFERENCES legal.discussion_groups(id) ON DELETE CASCADE,
    author_id        INTEGER NOT NULL REFERENCES legal.lawyers(id) ON DELETE CASCADE,
    post_type        VARCHAR(20) NOT NULL DEFAULT 'update', -- update | question | answer
    parent_post_id   INTEGER REFERENCES legal.group_posts(id) ON DELETE CASCADE,
    content          TEXT NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_group_posts_group ON legal.group_posts (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_posts_parent ON legal.group_posts (parent_post_id);

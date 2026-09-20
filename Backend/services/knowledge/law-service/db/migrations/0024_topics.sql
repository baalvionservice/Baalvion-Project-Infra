-- 0024_topics.sql — admin-managed topics for Law Elite Network. A topic is a
-- cross-cutting tag (Olympics, Constitutional Law...) that the site's tagger
-- matches against article text by name and alias, so editors can add a new
-- topic without a code change. `description` is editor-written text shown on
-- the topic page. Never hard-deleted; archive instead.

CREATE TABLE IF NOT EXISTS legal.topics (
    id           SERIAL PRIMARY KEY,
    slug         VARCHAR(200) NOT NULL UNIQUE,
    name         VARCHAR(200) NOT NULL,
    pillar       VARCHAR(20)  NOT NULL DEFAULT 'general',
    aliases      JSONB NOT NULL DEFAULT '[]',
    description  TEXT NOT NULL DEFAULT '',
    published    BOOLEAN NOT NULL DEFAULT false,
    indexable    BOOLEAN NOT NULL DEFAULT false,
    archived     BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

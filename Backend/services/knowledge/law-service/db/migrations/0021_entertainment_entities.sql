-- 0021_entertainment_entities.sql — admin-managed entertainment reference
-- profiles (movies, TV, streaming, music, albums, songs, awards, events) for
-- Law Elite Network's Entertainment pillar. Never hard-deleted; archive instead.
-- Editorial/reference data only: no box-office, revenue or budget fields.

CREATE TABLE IF NOT EXISTS legal.entertainment_entities (
    id                     SERIAL PRIMARY KEY,
    slug                   VARCHAR(200) NOT NULL UNIQUE,
    title                  VARCHAR(400) NOT NULL,
    type                   VARCHAR(30)  NOT NULL,
    release_date           VARCHAR(20),
    description            TEXT NOT NULL DEFAULT '',
    people_involved        JSONB NOT NULL DEFAULT '[]',
    related_entities       JSONB NOT NULL DEFAULT '[]',
    related_article_slugs  JSONB NOT NULL DEFAULT '[]',
    videos                 JSONB NOT NULL DEFAULT '[]',
    interviews             JSONB NOT NULL DEFAULT '[]',
    seo_title              VARCHAR(200),
    seo_description        VARCHAR(400),
    verified               BOOLEAN NOT NULL DEFAULT false,
    source_note            TEXT,
    last_reviewed_at       TIMESTAMPTZ,
    published              BOOLEAN NOT NULL DEFAULT false,
    indexable              BOOLEAN NOT NULL DEFAULT false,
    archived               BOOLEAN NOT NULL DEFAULT false,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_entertainment_type ON legal.entertainment_entities (type) WHERE published AND NOT archived;

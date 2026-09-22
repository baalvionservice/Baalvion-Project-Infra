-- 0031_podcast_shows.sql — admin-managed podcast directory for /podcasts. `rank` is an
-- editorial position in the "Top 10" list (NULL = listed but not ranked). Never hard-deleted.

CREATE TABLE IF NOT EXISTS legal.podcast_shows (
    id           SERIAL PRIMARY KEY,
    slug         VARCHAR(200) NOT NULL UNIQUE,
    title        VARCHAR(200) NOT NULL,
    host         VARCHAR(300),
    publisher    VARCHAR(200),
    description  TEXT NOT NULL DEFAULT '',
    category     VARCHAR(60),
    country_code VARCHAR(10),
    language     VARCHAR(40),
    listen_url   TEXT,
    website_url  TEXT,
    cover_url    TEXT,
    cover_credit TEXT,
    rank         INTEGER,
    ranking_note TEXT,
    published    BOOLEAN NOT NULL DEFAULT false,
    archived     BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS podcast_shows_live_idx ON legal.podcast_shows (published, archived, rank);

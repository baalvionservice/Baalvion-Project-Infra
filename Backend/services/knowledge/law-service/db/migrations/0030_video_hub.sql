-- 0030_video_hub.sql — admin-managed video hub for /videos: shows (a programme or
-- series, national or international) and the videos inside them. Nothing is
-- generated: the page lists only published, non-archived rows. Never hard-deleted.

CREATE TABLE IF NOT EXISTS legal.video_shows (
    id           SERIAL PRIMARY KEY,
    slug         VARCHAR(200) NOT NULL UNIQUE,
    name         VARCHAR(200) NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    scope        VARCHAR(15)  NOT NULL DEFAULT 'national',
    country_code VARCHAR(10),
    network      VARCHAR(200),
    cover_url    TEXT,
    cover_credit TEXT,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    featured     BOOLEAN NOT NULL DEFAULT false,
    published    BOOLEAN NOT NULL DEFAULT false,
    archived     BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS video_shows_live_idx ON legal.video_shows (published, archived, sort_order);

CREATE TABLE IF NOT EXISTS legal.video_items (
    id             SERIAL PRIMARY KEY,
    slug           VARCHAR(200) NOT NULL UNIQUE,
    title          VARCHAR(300) NOT NULL,
    description    TEXT NOT NULL DEFAULT '',
    video_url      TEXT NOT NULL,
    thumbnail_url  TEXT,
    thumbnail_credit TEXT,
    source_name    VARCHAR(200),
    show_slug      VARCHAR(200),
    category       VARCHAR(60),
    scope          VARCHAR(15)  NOT NULL DEFAULT 'national',
    country_code   VARCHAR(10),
    duration_seconds INTEGER,
    published_at   TIMESTAMPTZ,
    people_slugs   JSONB NOT NULL DEFAULT '[]',
    sort_order     INTEGER NOT NULL DEFAULT 0,
    featured       BOOLEAN NOT NULL DEFAULT false,
    published      BOOLEAN NOT NULL DEFAULT false,
    archived       BOOLEAN NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS video_items_live_idx ON legal.video_items (published, archived, published_at DESC);
CREATE INDEX IF NOT EXISTS video_items_show_idx ON legal.video_items (show_slug);

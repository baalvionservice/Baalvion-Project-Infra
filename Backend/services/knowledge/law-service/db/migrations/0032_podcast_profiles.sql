-- 0032_podcast_profiles.sql — long-form profile fields for each podcast's own page.
-- `overview` holds the editor's written piece (paragraphs separated by a blank line).
-- A page is only indexable once an editor has written it and switched `indexable` on.

ALTER TABLE legal.podcast_shows
    ADD COLUMN IF NOT EXISTS overview        TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS first_aired     VARCHAR(20),
    ADD COLUMN IF NOT EXISTS frequency       VARCHAR(80),
    ADD COLUMN IF NOT EXISTS format          TEXT,
    ADD COLUMN IF NOT EXISTS best_for        TEXT,
    ADD COLUMN IF NOT EXISTS faq             JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS sources         JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS seo_title       VARCHAR(200),
    ADD COLUMN IF NOT EXISTS seo_description VARCHAR(320),
    ADD COLUMN IF NOT EXISTS reviewed_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS indexable       BOOLEAN NOT NULL DEFAULT false;

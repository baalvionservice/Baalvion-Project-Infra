-- 0035_video_show_profiles.sql — long-form profile for a video show's own page: written overview, at-a-glance
-- facts, per-season results and participants, quick answers and sources. A page is only indexable once written.

ALTER TABLE legal.video_shows
    ADD COLUMN IF NOT EXISTS overview        TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS facts           JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS seasons         JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS faq             JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS sources         JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS seo_title       VARCHAR(200),
    ADD COLUMN IF NOT EXISTS seo_description VARCHAR(320),
    ADD COLUMN IF NOT EXISTS reviewed_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS indexable       BOOLEAN NOT NULL DEFAULT false;

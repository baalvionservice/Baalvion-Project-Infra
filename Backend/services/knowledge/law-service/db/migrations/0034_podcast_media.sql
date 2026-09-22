-- 0034_podcast_media.sql — videos (YouTube/Vimeo embeds or links) and hand-picked "start here"
-- episodes on a podcast's own page. Photos live in legal.entity_photos (entity_type 'podcast'),
-- which already enforces a credit and a free licence.

ALTER TABLE legal.podcast_shows
    ADD COLUMN IF NOT EXISTS videos   JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS episodes JSONB NOT NULL DEFAULT '[]';

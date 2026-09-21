-- 0033_podcast_links_hosts.sql — several places to listen (not one), a written background for each
-- host, and hand-picked site articles for a podcast's own page.

ALTER TABLE legal.podcast_shows
    ADD COLUMN IF NOT EXISTS listen_links          JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS hosts                 JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS related_article_slugs JSONB NOT NULL DEFAULT '[]';

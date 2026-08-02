-- 0017_article_metadata.sql — jurisdiction metadata for the /countries
-- section (frontend URL restructure). legal.articles has no migration
-- history at all (created by sequelize.sync() at boot, empty on prod), but
-- sync() never alters an *existing* table -- these columns need a real,
-- tracked migration to land once the table has real rows.

ALTER TABLE legal.articles
    ADD COLUMN IF NOT EXISTS country  VARCHAR(120),
    ADD COLUMN IF NOT EXISTS state    VARCHAR(120),
    ADD COLUMN IF NOT EXISTS city     VARCHAR(120),
    ADD COLUMN IF NOT EXISTS court    VARCHAR(255),
    ADD COLUMN IF NOT EXISTS language VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_articles_country ON legal.articles (country);

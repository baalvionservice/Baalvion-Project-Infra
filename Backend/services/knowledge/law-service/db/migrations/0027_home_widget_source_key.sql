-- 0027_home_widget_source_key.sql — identifies an entry that the official-source
-- fetcher drafted (e.g. 'courtlistener:10973388'). The unique key is what stops
-- the same item being drafted again on the next run, including after an editor
-- archived it. Hand-written entries leave it NULL.

ALTER TABLE legal.home_widget_items ADD COLUMN IF NOT EXISTS source_key VARCHAR(300);
CREATE UNIQUE INDEX IF NOT EXISTS home_widget_items_source_key_uq ON legal.home_widget_items (source_key) WHERE source_key IS NOT NULL;

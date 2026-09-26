-- 0029_home_widget_region.sql — country (ISO code, or INTL) of an entry, as a real column so the
-- console can filter and group by it. Fetched entries already carry it in extra->>'region'; backfill from there.

ALTER TABLE legal.home_widget_items ADD COLUMN IF NOT EXISTS region VARCHAR(10);
UPDATE legal.home_widget_items SET region = extra->>'region' WHERE region IS NULL AND extra ->> 'region' IS NOT NULL;
-- Rows fetched before a region was recorded: the source key says where they came from.
UPDATE legal.home_widget_items SET region = CASE split_part(source_key, ':', 1)
    WHEN 'courtlistener' THEN 'US' WHEN 'uscourts' THEN 'US' WHEN 'doj' THEN 'US'
    WHEN 'govuk' THEN 'GB' WHEN 'ukjud' THEN 'GB' WHEN 'kejud' THEN 'KE'
    WHEN 'un' THEN 'INTL' WHEN 'icc' THEN 'INTL' END
  WHERE region IS NULL AND source_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS home_widget_items_region_idx ON legal.home_widget_items (region);

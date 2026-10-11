-- Per-venue SEO and content fields edited in the admin panel. sync({ alter: false }) never alters an existing table, so this is applied by hand. Safe to re-run.
ALTER TABLE community.night_clubs
  ADD COLUMN IF NOT EXISTS seo_title varchar(160),
  ADD COLUMN IF NOT EXISTS seo_description varchar(320),
  ADD COLUMN IF NOT EXISTS about text,
  ADD COLUMN IF NOT EXISTS faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS price_range varchar(8);

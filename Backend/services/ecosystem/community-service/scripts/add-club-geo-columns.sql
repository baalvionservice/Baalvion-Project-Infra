-- Real venue facts for the directory pages (location, website, phone, opening hours, venue type, where the record came from).
-- sync({ alter: false }) never alters an existing table, so this is applied by hand. Safe to re-run.
ALTER TABLE community.night_clubs
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS website varchar(300),
  ADD COLUMN IF NOT EXISTS phone varchar(80),
  ADD COLUMN IF NOT EXISTS opening_hours varchar(300),
  ADD COLUMN IF NOT EXISTS venue_type varchar(20),
  ADD COLUMN IF NOT EXISTS osm_ref varchar(30);
CREATE UNIQUE INDEX IF NOT EXISTS night_clubs_osm_ref_uq ON community.night_clubs (osm_ref) WHERE osm_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS night_clubs_city_suburb_idx ON community.night_clubs (city, suburb);

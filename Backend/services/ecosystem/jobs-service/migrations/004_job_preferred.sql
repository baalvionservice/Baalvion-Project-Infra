-- "Preferred" as against "required".
--
-- Merging the two is how a posting ends up with a wall of demands that puts off exactly
-- the candidates worth attracting. Keeping them apart lets the required list stay honest
-- about what we would actually turn somebody down for.

ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS preferred_qualifications TEXT;

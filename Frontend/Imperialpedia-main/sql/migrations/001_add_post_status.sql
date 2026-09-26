-- Adds a draft/published gate to `post` (previously every inserted post was
-- immediately public with no review step) and a uniqueness constraint on
-- `uri` (previously enforced only in application code, not the schema).
--
-- Apply manually against both the local dev DB and production, e.g.:
--   docker exec -i imperial_db mysql -u root -p<password> <database> < 001_add_post_status.sql
-- This does NOT run automatically via docker/init-db, which only seeds a
-- fresh empty database volume.

ALTER TABLE post
  ADD COLUMN status ENUM('draft','published') NOT NULL DEFAULT 'draft' AFTER post_desc;

-- Existing rows predate the draft/published concept — treat them as already live.
UPDATE post SET status = 'published';

ALTER TABLE post
  ADD UNIQUE KEY uri_unique (uri(255));

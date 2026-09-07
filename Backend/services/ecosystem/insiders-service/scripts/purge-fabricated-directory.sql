-- Purge fabricated investor-directory content — PROVENANCE-SCOPED.
--
-- HISTORY, because it matters for how this script is written:
-- The first version of this file blanket-deleted whole tables (DELETE FROM insiders.investors,
-- …). It was written against a dataset of 8 seeded investors. By the time it ran, the directory
-- had been repopulated with 21,660 real SEC Form D records, and `investors` cascades to
-- investor_funds and investor_people — so it removed ~92,000 real rows, and the fabricated rows
-- it was written to remove were no longer there at all. Everything was restored from a
-- pg_dump taken immediately beforehand.
--
-- So: never blanket-delete a table to remove specific rows. Target the rows by what makes them
-- fabricated — no source provenance — and refuse to run if the blast radius looks wrong.
--
-- Real records carry source='sec_form_d' (or another ingest source) and a source_url. The
-- seeded ones carried neither, and were marked enrichment_status='enriched' with invented
-- email/phone, plus news and investments citing real publications for stories that do not exist.
--
-- Take a backup first, always:
--   docker exec baalvion-postgres pg_dump -U baalvion -d baalvion_db --schema=insiders --data-only > insiders-backup.sql
--
-- Run:
--   docker exec -i baalvion-postgres psql -U baalvion -d baalvion_db < scripts/purge-fabricated-directory.sql

\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  fabricated integer;
  total      integer;
BEGIN
  SELECT count(*) INTO fabricated FROM insiders.investors WHERE source IS NULL;
  SELECT count(*) INTO total      FROM insiders.investors;

  RAISE NOTICE 'investors: % total, % without ingest provenance', total, fabricated;

  IF fabricated = 0 THEN
    RAISE NOTICE 'Nothing to purge — every investor row has a source. Leaving the table untouched.';
    RETURN;
  END IF;

  -- Guard: the seeded set was a handful of rows. If this matches a large share of the table,
  -- the assumption behind the script no longer holds — stop rather than cascade through
  -- investor_funds and investor_people, which is exactly what went wrong before.
  IF fabricated > 100 OR fabricated::numeric / greatest(total, 1) > 0.10 THEN
    RAISE EXCEPTION 'Refusing to purge: % of % investor rows lack provenance. That is too many to be the seed set — investigate before deleting anything.', fabricated, total;
  END IF;

  DELETE FROM insiders.investors WHERE source IS NULL;
  RAISE NOTICE 'Removed % fabricated investor row(s) (cascades to their funds, people, news, socials and investments).', fabricated;
END $$;

-- Seeded founder-side content, identified the same way: attached to the demo deals rather than
-- to anything ingested. Scoped by id, never by table.
DELETE FROM insiders.traction_metrics
 WHERE source IN ('Stripe', 'Analytics')
   AND verified IS TRUE
   AND founder_id IN (SELECT id FROM insiders.profiles WHERE username IN ('marcuschen','sarahw','jpatterson','elenar','davidkim'));

DELETE FROM insiders.verifications
 WHERE status = 'verified'
   AND (evidence IS NULL OR evidence = '{}'::jsonb)
   AND user_id IN (SELECT id FROM insiders.profiles WHERE username IN ('marcuschen','sarahw','jpatterson','elenar','davidkim'));

COMMIT;

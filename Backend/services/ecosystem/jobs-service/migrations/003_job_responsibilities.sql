-- What the job actually involves, day to day.
--
-- `requirements` already covers what a candidate needs to bring. It was carrying both
-- jobs, which is why postings read as a list of demands with no description of the work.
-- Split them: responsibilities is what you would do, requirements is what you need.
--
-- Same shape as requirements — one bullet per line — so the same parser handles both.

ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS responsibilities TEXT;

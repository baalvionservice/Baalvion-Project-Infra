-- Candidate/Employee reference codes + the candidate↔recruiter message thread.
-- Idempotent: this file is replayed on every boot by scripts/migrate.js.

CREATE SCHEMA IF NOT EXISTS jobs;

-- ── Reference codes ──────────────────────────────────────────────────────────
-- Human-quotable IDs the candidate sees on their dashboard and in every email.
-- Sequences (not a MAX()+1 read) so two concurrent applications can never collide.
CREATE SEQUENCE IF NOT EXISTS jobs.candidate_reference_seq START 1001;
CREATE SEQUENCE IF NOT EXISTS jobs.employee_reference_seq  START 101;

ALTER TABLE jobs.candidates ADD COLUMN IF NOT EXISTS reference_code VARCHAR(32);
ALTER TABLE jobs.candidates ADD COLUMN IF NOT EXISTS employee_code  VARCHAR(32);
ALTER TABLE jobs.candidates ADD COLUMN IF NOT EXISTS employee_code_issued_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS candidates_reference_code_key ON jobs.candidates (reference_code);
CREATE UNIQUE INDEX IF NOT EXISTS candidates_employee_code_key  ON jobs.candidates (employee_code);

-- ── Application messages ─────────────────────────────────────────────────────
-- One thread per application. `sender_type` is the authority on who wrote a row;
-- candidate rows are written only through the email-scoped /me/* surface.
CREATE TABLE IF NOT EXISTS jobs.application_messages (
    id             BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES jobs.applications (id) ON DELETE CASCADE,
    org_id         UUID NOT NULL,
    sender_type    VARCHAR(16) NOT NULL CHECK (sender_type IN ('candidate', 'staff')),
    sender_name    VARCHAR(255),
    sender_email   VARCHAR(255),
    body           TEXT NOT NULL,
    read_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS application_messages_application_id_idx ON jobs.application_messages (application_id, created_at);
CREATE INDEX IF NOT EXISTS application_messages_org_id_idx         ON jobs.application_messages (org_id);

-- ── Job location ─────────────────────────────────────────────────────────────
-- `location` is the display string ("Kochi, Kerala, India"). city/region are the
-- structured parts, so a role can be posted in any town or state and still be
-- filtered — the country list is now all of ISO-3166, not a fixed nine.
ALTER TABLE jobs.job_listings ADD COLUMN IF NOT EXISTS city   VARCHAR(120);
ALTER TABLE jobs.job_listings ADD COLUMN IF NOT EXISTS region VARCHAR(120);

CREATE INDEX IF NOT EXISTS job_listings_country_id_idx ON jobs.job_listings (country_id);
CREATE INDEX IF NOT EXISTS job_listings_city_idx       ON jobs.job_listings (city);

-- ── Resolved location ────────────────────────────────────────────────────────
-- The city a recruiter types is free text ("Virar"), which is right for input but
-- useless for "show me everything around Mumbai" — a Virar posting contains no
-- "Mumbai" anywhere. These hold the gazetteer's answer: which place this is, and
-- which metro it commutes into. Both are set on write and used for filtering,
-- location landing pages and the sitemap.
ALTER TABLE jobs.job_listings ADD COLUMN IF NOT EXISTS place_slug VARCHAR(80);
ALTER TABLE jobs.job_listings ADD COLUMN IF NOT EXISTS metro_slug VARCHAR(80);

CREATE INDEX IF NOT EXISTS job_listings_place_slug_idx ON jobs.job_listings (place_slug);
CREATE INDEX IF NOT EXISTS job_listings_metro_slug_idx ON jobs.job_listings (metro_slug);

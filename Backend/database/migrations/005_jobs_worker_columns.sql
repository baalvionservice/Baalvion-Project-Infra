-- Migration 005: Add BullMQ worker columns to jobs schema
-- Run once against baalvion_db

-- applications: scoring and resume parsing
ALTER TABLE jobs.applications
    ADD COLUMN IF NOT EXISTS score              INTEGER,
    ADD COLUMN IF NOT EXISTS score_breakdown    JSONB,
    ADD COLUMN IF NOT EXISTS resume_skills      TEXT[],
    ADD COLUMN IF NOT EXISTS resume_parsed_at   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS notes              TEXT;

-- job_listings: SEO indexing and scheduling
ALTER TABLE jobs.job_listings
    ADD COLUMN IF NOT EXISTS published_at    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS closes_at       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS seo_json_ld     JSONB,
    ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(10) DEFAULT 'INR';

-- candidates: scoring inputs
ALTER TABLE jobs.candidates
    ADD COLUMN IF NOT EXISTS skills              TEXT[]  DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS headline            VARCHAR(255),
    ADD COLUMN IF NOT EXISTS bio                 TEXT,
    ADD COLUMN IF NOT EXISTS location            VARCHAR(255),
    ADD COLUMN IF NOT EXISTS years_of_experience NUMERIC(4,1);

-- Index for fast score-based ranking
CREATE INDEX IF NOT EXISTS idx_applications_score ON jobs.applications (score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_applications_org_status ON jobs.applications (org_id, status);
CREATE INDEX IF NOT EXISTS idx_job_listings_published_at ON jobs.job_listings (published_at DESC NULLS LAST);

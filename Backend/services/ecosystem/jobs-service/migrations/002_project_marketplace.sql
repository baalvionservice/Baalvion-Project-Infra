-- Project marketplace: public listings, and people applying to work on them either
-- alone or as an assembled team. Idempotent — replayed on every boot.

-- ── Visibility ───────────────────────────────────────────────────────────────
-- A project is only listed publicly when someone deliberately publishes it. Existing
-- rows stay private until reviewed, rather than being exposed by a schema change.
ALTER TABLE jobs.projects ADD COLUMN IF NOT EXISTS is_public   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE jobs.projects ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE jobs.projects ADD COLUMN IF NOT EXISTS slug        VARCHAR(180);
ALTER TABLE jobs.projects ADD COLUMN IF NOT EXISTS summary     TEXT;
-- 'solo' | 'team' | 'either' — what the poster will actually accept.
ALTER TABLE jobs.projects ADD COLUMN IF NOT EXISTS collaboration_mode VARCHAR(16) NOT NULL DEFAULT 'either';
ALTER TABLE jobs.projects ADD COLUMN IF NOT EXISTS applications_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs.projects ADD COLUMN IF NOT EXISTS deadline    DATE;

CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_key       ON jobs.projects (slug);
CREATE INDEX        IF NOT EXISTS projects_is_public_idx  ON jobs.projects (is_public, status);

-- ── Applications ─────────────────────────────────────────────────────────────
-- One row per bid. A team bid keeps its members inline: they are named collaborators
-- on this proposal, not portal accounts, and inventing user records for them would be
-- wrong. `lead_candidate_id` is the person who submitted and who we correspond with.
CREATE TABLE IF NOT EXISTS jobs.project_applications (
    id                BIGSERIAL PRIMARY KEY,
    project_id        BIGINT NOT NULL REFERENCES jobs.projects (id) ON DELETE CASCADE,
    org_id            UUID NOT NULL,
    lead_candidate_id BIGINT NOT NULL REFERENCES jobs.candidates (id) ON DELETE CASCADE,
    mode              VARCHAR(8) NOT NULL CHECK (mode IN ('solo', 'team')),
    team_name         VARCHAR(160),
    team_members      JSONB NOT NULL DEFAULT '[]'::jsonb,
    role_applied      VARCHAR(160),
    pitch             TEXT NOT NULL,
    portfolio_url     TEXT,
    expected_rate     BIGINT,
    currency          VARCHAR(10),
    availability      VARCHAR(120),
    status            VARCHAR(16) NOT NULL DEFAULT 'submitted'
                      CHECK (status IN ('submitted', 'shortlisted', 'accepted', 'rejected', 'withdrawn')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One bid per person per project: a second submission is an edit, not a new entry.
CREATE UNIQUE INDEX IF NOT EXISTS project_applications_unique_bid
    ON jobs.project_applications (project_id, lead_candidate_id);
CREATE INDEX IF NOT EXISTS project_applications_project_idx ON jobs.project_applications (project_id, created_at);
CREATE INDEX IF NOT EXISTS project_applications_org_idx     ON jobs.project_applications (org_id);

-- ── Salary period ────────────────────────────────────────────────────────────
-- Internships are paid a monthly stipend; salaried roles are quoted annually.
-- Storing only an amount forced every figure to be read as "per year", which turned
-- a ₹40,000/month stipend into a nonsensical annual number on the posting.
ALTER TABLE jobs.job_listings
    ADD COLUMN IF NOT EXISTS salary_period VARCHAR(10) NOT NULL DEFAULT 'year';

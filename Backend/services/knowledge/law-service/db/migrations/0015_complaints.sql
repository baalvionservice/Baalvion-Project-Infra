-- 0015_complaints.sql — admin moderation queue (spec area 9). States/cities/
-- practice_areas/verification_documents were already added to the admin
-- resource registry in Phase 1 (migrations 0005-0007); complaints is the one
-- genuinely missing management surface.

CREATE TABLE IF NOT EXISTS legal.complaints (
    id                 SERIAL PRIMARY KEY,
    reporter_user_id   TEXT NOT NULL,
    subject_lawyer_id  INTEGER REFERENCES legal.lawyers(id) ON DELETE SET NULL,
    category           VARCHAR(40) NOT NULL DEFAULT 'other',
    description        TEXT NOT NULL,
    status             VARCHAR(20) NOT NULL DEFAULT 'open',
    resolution         TEXT,
    resolved_by        TEXT,
    resolved_at        TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON legal.complaints (status);
CREATE INDEX IF NOT EXISTS idx_complaints_subject_lawyer ON legal.complaints (subject_lawyer_id);

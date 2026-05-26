-- Migration 006: Campus recruitment tables (colleges, students, placements)
-- Run once against baalvion_db

-- ─── Colleges ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs.colleges (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    city            VARCHAR(100),
    state           VARCHAR(100),
    country         VARCHAR(100) DEFAULT 'India',
    accreditation   VARCHAR(20),
    website         VARCHAR(500),
    contact_email   VARCHAR(255),
    contact_phone   VARCHAR(30),
    is_active       BOOLEAN DEFAULT true,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_colleges_name ON jobs.colleges (name);
CREATE INDEX IF NOT EXISTS idx_colleges_is_active ON jobs.colleges (is_active);

-- ─── Students ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs.students (
    id               SERIAL PRIMARY KEY,
    college_id       INTEGER REFERENCES jobs.colleges(id) ON DELETE SET NULL,
    name             VARCHAR(200) NOT NULL,
    email            VARCHAR(255) NOT NULL UNIQUE,
    phone            VARCHAR(30),
    course           VARCHAR(200),
    degree           VARCHAR(100),
    graduation_year  INTEGER,
    cgpa             NUMERIC(4, 2),
    is_placed        BOOLEAN DEFAULT false,
    status           VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    ai_score         NUMERIC(5, 2),
    verified         BOOLEAN DEFAULT false,
    company          VARCHAR(200),
    role             VARCHAR(200),
    documents        JSONB DEFAULT '{}',
    skills           TEXT[] DEFAULT '{}',
    metadata         JSONB DEFAULT '{}',
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_college_id ON jobs.students (college_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON jobs.students (email);
CREATE INDEX IF NOT EXISTS idx_students_status ON jobs.students (status);
CREATE INDEX IF NOT EXISTS idx_students_is_placed ON jobs.students (is_placed);
CREATE INDEX IF NOT EXISTS idx_students_ai_score ON jobs.students (ai_score DESC NULLS LAST);

-- ─── Placements ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs.placements (
    id                      SERIAL PRIMARY KEY,
    student_id              INTEGER NOT NULL REFERENCES jobs.students(id) ON DELETE CASCADE,
    college_id              INTEGER REFERENCES jobs.colleges(id) ON DELETE SET NULL,
    company_name            VARCHAR(200) NOT NULL,
    role                    VARCHAR(200) NOT NULL,
    package_lpa             NUMERIC(8, 2),
    offer_letter_url        TEXT,
    joining_date            DATE,
    approved                BOOLEAN DEFAULT false,
    verified_by_admin_id    INTEGER,
    audit_logs              JSONB DEFAULT '[]',
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_placements_student_id ON jobs.placements (student_id);
CREATE INDEX IF NOT EXISTS idx_placements_college_id ON jobs.placements (college_id);
CREATE INDEX IF NOT EXISTS idx_placements_approved ON jobs.placements (approved);

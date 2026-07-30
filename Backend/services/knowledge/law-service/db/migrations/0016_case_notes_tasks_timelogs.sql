-- 0016_case_notes_tasks_timelogs.sql — real persistence for per-case private
-- notes, workflow tasks, and billable time logs. These previously existed
-- only as a frontend localStorage mock (services/cases/case.mock.ts) that
-- silently no-op'd for every real case (its lookup only ever matched mock-
-- created cases), so a client or lawyer using these features believed their
-- note/task/time entry was saved when it was actually discarded.

CREATE TABLE IF NOT EXISTS legal.case_notes (
    id           SERIAL PRIMARY KEY,
    case_id      INTEGER NOT NULL REFERENCES legal.cases(id) ON DELETE CASCADE,
    author_id    INTEGER NOT NULL REFERENCES legal.users(id),
    text         TEXT NOT NULL,
    tags         TEXT[] NOT NULL DEFAULT '{}',
    is_private   BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_case_notes_case ON legal.case_notes (case_id);

CREATE TABLE IF NOT EXISTS legal.case_tasks (
    id           SERIAL PRIMARY KEY,
    case_id      INTEGER NOT NULL REFERENCES legal.cases(id) ON DELETE CASCADE,
    title        VARCHAR(500) NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_case_tasks_case ON legal.case_tasks (case_id);

CREATE TABLE IF NOT EXISTS legal.case_time_logs (
    id                SERIAL PRIMARY KEY,
    case_id           INTEGER NOT NULL REFERENCES legal.cases(id) ON DELETE CASCADE,
    author_id         INTEGER NOT NULL REFERENCES legal.users(id),
    duration_minutes  INTEGER NOT NULL CHECK (duration_minutes > 0),
    is_billable       BOOLEAN NOT NULL DEFAULT true,
    category          VARCHAR(50),
    description       TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_case_time_logs_case ON legal.case_time_logs (case_id);

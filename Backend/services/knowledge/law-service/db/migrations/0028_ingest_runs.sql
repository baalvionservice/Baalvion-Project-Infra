-- 0028_ingest_runs.sql — one row per official-source fetch, so the console can show whether each
-- feed worked on the last run and when (a feed that quietly starts failing is otherwise invisible).

CREATE TABLE IF NOT EXISTS legal.ingest_runs (
    id        SERIAL PRIMARY KEY,
    ran_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created   INTEGER NOT NULL DEFAULT 0,
    report    JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS ingest_runs_ran_at_idx ON legal.ingest_runs (ran_at DESC);

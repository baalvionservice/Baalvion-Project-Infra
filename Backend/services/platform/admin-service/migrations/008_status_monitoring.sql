-- Status monitoring: probe history, current state, and incidents.
--
-- Three tables rather than one, because they answer different questions and age differently:
--   probe_results  append-only history      -> "is it down NOW, or has it been down 3 days?"
--   probe_state    one row per target       -> the edge-detection anchor (cheap to read+write)
--   incidents      one row per outage       -> what to show, what was alerted, what recovered
--
-- Without probe_results there is no uptime %, and no way to distinguish a blip from an outage.
-- Without probe_state every tick would have to scan history to decide whether anything changed.

CREATE SCHEMA IF NOT EXISTS admin;

-- ── Current state per target ─────────────────────────────────────────────────
-- target_id is a stable synthetic key: '<kind>:<name>' e.g. 'service:auth-service',
-- 'website:imperialpedia.com', 'datastore:postgres', 'auth:law', 'money:ctm'.
CREATE TABLE IF NOT EXISTS admin.probe_state (
    target_id           TEXT PRIMARY KEY,
    kind                TEXT NOT NULL CHECK (kind IN ('service','website','datastore','auth','money','seo')),
    site_id             TEXT,
    status              TEXT NOT NULL CHECK (status IN ('up','degraded','down','not_deployed','not_configured','unknown')),
    -- Consecutive counters drive flap suppression: an alert fires only after N consecutive
    -- failures, and clears only after N consecutive successes. A single blip changes neither
    -- the incident nor the notification.
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    consecutive_successes INTEGER NOT NULL DEFAULT 0,
    latency_ms          INTEGER,
    detail              JSONB,
    last_ok_at          TIMESTAMPTZ,
    changed_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    checked_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Append-only history ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin.probe_results (
    id          BIGSERIAL PRIMARY KEY,
    target_id   TEXT        NOT NULL,
    kind        TEXT        NOT NULL,
    site_id     TEXT,
    status      TEXT        NOT NULL,
    latency_ms  INTEGER,
    detail      JSONB,
    checked_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- The two access patterns: one target's timeline (uptime %, sparkline) and a global prune.
CREATE INDEX IF NOT EXISTS probe_results_target_time_idx ON admin.probe_results (target_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS probe_results_checked_at_idx  ON admin.probe_results (checked_at);
CREATE INDEX IF NOT EXISTS probe_results_site_idx        ON admin.probe_results (site_id, checked_at DESC) WHERE site_id IS NOT NULL;

-- ── Incidents ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin.status_incidents (
    id            BIGSERIAL PRIMARY KEY,
    target_id     TEXT        NOT NULL,
    kind          TEXT        NOT NULL,
    site_id       TEXT,
    severity      TEXT        NOT NULL CHECK (severity IN ('critical','warning','info')),
    status        TEXT        NOT NULL CHECK (status IN ('open','resolved')),
    cause         TEXT,
    detail        JSONB,
    opened_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at   TIMESTAMPTZ,
    -- Records whether the phone actually buzzed, so a silent notification failure is visible
    -- in the console instead of being mistaken for "nothing broke".
    alert_sent_at TIMESTAMPTZ,
    alert_error   TEXT
);
CREATE INDEX IF NOT EXISTS status_incidents_open_idx ON admin.status_incidents (target_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS status_incidents_time_idx ON admin.status_incidents (opened_at DESC);
CREATE INDEX IF NOT EXISTS status_incidents_site_idx ON admin.status_incidents (site_id, opened_at DESC);

-- At most one open incident per target. Without this, a restart of the prober mid-outage
-- would open a second incident for the same outage and alert again.
CREATE UNIQUE INDEX IF NOT EXISTS status_incidents_one_open_per_target
    ON admin.status_incidents (target_id) WHERE status = 'open';

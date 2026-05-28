-- Baalvion usage time-series store (TimescaleDB).
-- Chosen over ClickHouse because the platform is already Postgres + `pg`:
-- TimescaleDB adds hypertables, continuous aggregates, native compression and
-- retention without operating a second datastore. Apply to the timeseries DB
-- (TIMESERIES_DATABASE_URL), which MAY be the same Postgres instance.
--
-- ClickHouse alternative: a MergeTree `usage_events` + AggregatingMergeTree
-- materialized views keyed by (org_id, toStartOfHour(ts)) — same shape.

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ── Raw metering events (idempotent on event_id) ─────────────────────────────
CREATE TABLE IF NOT EXISTS usage_events (
  event_id    TEXT        NOT NULL,   -- Redis stream entry id (dedup key)
  ts          TIMESTAMPTZ NOT NULL,
  org_id      UUID        NOT NULL,
  api_key_id  UUID,
  session_id  TEXT,
  provider    TEXT        NOT NULL DEFAULT 'unknown',
  country     TEXT        NOT NULL DEFAULT '',
  dest_host   TEXT,
  bytes_in    BIGINT      NOT NULL DEFAULT 0,
  bytes_out   BIGINT      NOT NULL DEFAULT 0,
  requests    INTEGER     NOT NULL DEFAULT 1,
  latency_ms  INTEGER     NOT NULL DEFAULT 0,
  status      INTEGER     NOT NULL DEFAULT 0,
  success     BOOLEAN     NOT NULL DEFAULT TRUE
);

SELECT create_hypertable('usage_events', 'ts', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE);

-- Dedup: unique index must include the partitioning column (ts). event_id is
-- deterministic per source event, so (event_id, ts) gives exactly-once insert.
CREATE UNIQUE INDEX IF NOT EXISTS uq_usage_events_id ON usage_events (event_id, ts);
CREATE INDEX IF NOT EXISTS idx_usage_events_org_ts ON usage_events (org_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_provider_ts ON usage_events (provider, ts DESC);

-- ── Continuous aggregates (the real-time "workers" Timescale maintains) ──────
CREATE MATERIALIZED VIEW IF NOT EXISTS org_usage_hourly
WITH (timescaledb.continuous) AS
SELECT org_id,
       time_bucket('1 hour', ts) AS bucket,
       sum(bytes_in)                       AS bytes_in,
       sum(bytes_out)                      AS bytes_out,
       sum(bytes_in + bytes_out)           AS bytes_total,
       sum(requests)                       AS requests,
       sum(CASE WHEN success THEN 0 ELSE 1 END) AS failures,
       avg(latency_ms)                     AS avg_latency
FROM usage_events
GROUP BY org_id, bucket
WITH NO DATA;

CREATE MATERIALIZED VIEW IF NOT EXISTS org_usage_daily
WITH (timescaledb.continuous) AS
SELECT org_id,
       time_bucket('1 day', ts) AS bucket,
       sum(bytes_in)             AS bytes_in,
       sum(bytes_out)            AS bytes_out,
       sum(bytes_in + bytes_out) AS bytes_total,
       sum(requests)             AS requests,
       sum(CASE WHEN success THEN 0 ELSE 1 END) AS failures,
       avg(latency_ms)           AS avg_latency
FROM usage_events
GROUP BY org_id, bucket
WITH NO DATA;

CREATE MATERIALIZED VIEW IF NOT EXISTS provider_usage_daily
WITH (timescaledb.continuous) AS
SELECT provider,
       org_id,
       time_bucket('1 day', ts) AS bucket,
       sum(bytes_in + bytes_out) AS bytes_total,
       sum(requests)             AS requests
FROM usage_events
GROUP BY provider, org_id, bucket
WITH NO DATA;

CREATE MATERIALIZED VIEW IF NOT EXISTS geo_usage_hourly
WITH (timescaledb.continuous) AS
SELECT org_id,
       country,
       time_bucket('1 hour', ts) AS bucket,
       sum(bytes_in + bytes_out) AS bytes_total,
       sum(requests)             AS requests
FROM usage_events
GROUP BY org_id, country, bucket
WITH NO DATA;

-- ── Refresh policies (near-real-time materialization) ────────────────────────
SELECT add_continuous_aggregate_policy('org_usage_hourly',
  start_offset => INTERVAL '3 hours', end_offset => INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute', if_not_exists => TRUE);
SELECT add_continuous_aggregate_policy('org_usage_daily',
  start_offset => INTERVAL '2 days', end_offset => INTERVAL '1 minute',
  schedule_interval => INTERVAL '5 minutes', if_not_exists => TRUE);
SELECT add_continuous_aggregate_policy('provider_usage_daily',
  start_offset => INTERVAL '2 days', end_offset => INTERVAL '1 minute',
  schedule_interval => INTERVAL '5 minutes', if_not_exists => TRUE);
SELECT add_continuous_aggregate_policy('geo_usage_hourly',
  start_offset => INTERVAL '3 hours', end_offset => INTERVAL '1 minute',
  schedule_interval => INTERVAL '2 minutes', if_not_exists => TRUE);

-- ── Compression + retention ──────────────────────────────────────────────────
ALTER TABLE usage_events SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'org_id',
  timescaledb.compress_orderby = 'ts DESC'
);
SELECT add_compression_policy('usage_events', INTERVAL '7 days', if_not_exists => TRUE);
SELECT add_retention_policy('usage_events', INTERVAL '90 days', if_not_exists => TRUE);
-- Aggregates retained far longer for billing history / analytics.
SELECT add_retention_policy('org_usage_daily', INTERVAL '800 days', if_not_exists => TRUE);

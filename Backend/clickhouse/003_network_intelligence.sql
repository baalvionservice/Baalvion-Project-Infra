-- Baalvion network-intelligence telemetry (ClickHouse).
-- Richer per-attempt telemetry for the AI layer (adds CAPTCHA, connect/TTFB
-- timings, tunnel stability) plus AggregatingMergeTree rollups that ARE the
-- training datasets + realtime feature sources for ban prediction, anomaly
-- detection, geo-latency modelling and provider scoring.
-- Fed by the Node feature pipeline (chClient.insertTelemetry) from usage:events
-- + orchestrator outcomes. ClickHouse is optional: when CLICKHOUSE_URL is unset,
-- the intelligence layer falls back to TimescaleDB aggregates.

CREATE DATABASE IF NOT EXISTS baalvion;

-- ── Raw routing telemetry (one row per upstream attempt) ──────────────────────
CREATE TABLE IF NOT EXISTS baalvion.routing_telemetry
(
    ts            DateTime64(3) DEFAULT now64(3),
    org_id        String,
    provider      LowCardinality(String),
    exit_ip       String,
    asn           UInt32,
    country       LowCardinality(String),
    target        String,
    target_class  LowCardinality(String),          -- ecommerce|social|search|generic ...
    proxy_type    LowCardinality(String),
    session_id    String,
    bytes_in      UInt64,
    bytes_out     UInt64,
    connect_ms    UInt32,                           -- upstream dial + handshake
    ttfb_ms       UInt32,                           -- time to first byte
    latency_ms    UInt32,
    status        UInt16,
    success       UInt8,
    banned        UInt8,
    captcha       UInt8,                            -- CAPTCHA / challenge observed
    tunnel_stable UInt8                             -- 1 if no mid-stream reset
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (provider, target_class, country, ts)
TTL toDateTime(ts) + INTERVAL 180 DAY;

-- ── Ban-prediction TRAINING DATASET: hourly aggregates with engineered features
-- and the label (ban_rate). Read directly by the trainer (Node + sklearn).
CREATE TABLE IF NOT EXISTS baalvion.ban_features_hourly
(
    hour          DateTime,
    provider      LowCardinality(String),
    country       LowCardinality(String),
    asn           UInt32,
    target_class  LowCardinality(String),
    requests      UInt64,
    failures      UInt64,
    bans          UInt64,
    captchas      UInt64,
    err_4xx       UInt64,
    err_5xx       UInt64,
    avg_latency   AggregateFunction(avg, UInt32),
    avg_ttfb      AggregateFunction(avg, UInt32)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(hour)
ORDER BY (provider, country, asn, target_class, hour)
TTL hour + INTERVAL 180 DAY;

CREATE MATERIALIZED VIEW IF NOT EXISTS baalvion.ban_features_hourly_mv
TO baalvion.ban_features_hourly AS
SELECT
    toStartOfHour(ts)                            AS hour,
    provider, country, asn, target_class,
    count()                                      AS requests,
    countIf(success = 0)                         AS failures,
    countIf(banned = 1)                          AS bans,
    countIf(captcha = 1)                         AS captchas,
    countIf(status >= 400 AND status < 500)      AS err_4xx,
    countIf(status >= 500)                       AS err_5xx,
    avgState(latency_ms)                         AS avg_latency,
    avgState(ttfb_ms)                            AS avg_ttfb
FROM baalvion.routing_telemetry
GROUP BY hour, provider, country, asn, target_class;

-- ── Provider feature hourly (success/ban/latency quantiles/throughput) ────────
CREATE TABLE IF NOT EXISTS baalvion.provider_feature_hourly
(
    hour          DateTime,
    provider      LowCardinality(String),
    requests      UInt64,
    failures      UInt64,
    bans          UInt64,
    bytes_total   UInt64,
    lat_quantiles AggregateFunction(quantiles(0.5, 0.95, 0.99), UInt32),
    connect_q     AggregateFunction(quantiles(0.5, 0.95), UInt32)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(hour)
ORDER BY (provider, hour)
TTL hour + INTERVAL 180 DAY;

CREATE MATERIALIZED VIEW IF NOT EXISTS baalvion.provider_feature_hourly_mv
TO baalvion.provider_feature_hourly AS
SELECT
    toStartOfHour(ts)                                  AS hour,
    provider,
    count()                                            AS requests,
    countIf(success = 0)                               AS failures,
    countIf(banned = 1)                                AS bans,
    sum(bytes_in + bytes_out)                          AS bytes_total,
    quantilesState(0.5, 0.95, 0.99)(latency_ms)        AS lat_quantiles,
    quantilesState(0.5, 0.95)(connect_ms)              AS connect_q
FROM baalvion.routing_telemetry
GROUP BY hour, provider;

-- ── Geo latency quantiles per country (geo-latency models) ────────────────────
CREATE TABLE IF NOT EXISTS baalvion.geo_latency_daily
(
    day           Date,
    country       LowCardinality(String),
    requests      UInt64,
    lat_quantiles AggregateFunction(quantiles(0.5, 0.95, 0.99), UInt32)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(day)
ORDER BY (country, day)
TTL day + INTERVAL 365 DAY;

CREATE MATERIALIZED VIEW IF NOT EXISTS baalvion.geo_latency_daily_mv
TO baalvion.geo_latency_daily AS
SELECT
    toDate(ts)                                   AS day,
    country,
    count()                                      AS requests,
    quantilesState(0.5, 0.95, 0.99)(latency_ms)  AS lat_quantiles
FROM baalvion.routing_telemetry
GROUP BY day, country;

-- ── Org bandwidth minutely (anomaly-detection baseline source) ────────────────
CREATE TABLE IF NOT EXISTS baalvion.org_bandwidth_minutely
(
    minute        DateTime,
    org_id        String,
    bytes_total   UInt64,
    requests      UInt64,
    distinct_targets AggregateFunction(uniq, String)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMMDD(minute)
ORDER BY (org_id, minute)
TTL minute + INTERVAL 30 DAY;

CREATE MATERIALIZED VIEW IF NOT EXISTS baalvion.org_bandwidth_minutely_mv
TO baalvion.org_bandwidth_minutely AS
SELECT
    toStartOfMinute(ts)          AS minute,
    org_id,
    sum(bytes_in + bytes_out)    AS bytes_total,
    count()                      AS requests,
    uniqState(target)            AS distinct_targets
FROM baalvion.routing_telemetry
GROUP BY minute, org_id;

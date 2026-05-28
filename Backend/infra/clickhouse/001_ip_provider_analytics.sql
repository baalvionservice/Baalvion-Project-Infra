-- Baalvion IP + provider analytics (ClickHouse).
-- High-cardinality, high-volume analytics (per-exit-IP, per-(provider,target))
-- that don't belong in Postgres/TimescaleDB. Fed by the metering consumer /
-- orchestrator outcome stream. TimescaleDB remains the billing aggregate store;
-- ClickHouse is the routing-intelligence analytics store.

CREATE DATABASE IF NOT EXISTS baalvion;

-- Raw routing outcome events (one per upstream attempt).
CREATE TABLE IF NOT EXISTS baalvion.ip_events
(
    ts          DateTime64(3) DEFAULT now64(3),
    org_id      String,
    provider    LowCardinality(String),
    exit_ip     String,
    asn         UInt32,
    country     LowCardinality(String),
    target      String,
    proxy_type  LowCardinality(String),
    bytes_in    UInt64,
    bytes_out   UInt64,
    latency_ms  UInt32,
    status      UInt16,
    success     UInt8,
    banned      UInt8
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (provider, country, ts)
TTL toDateTime(ts) + INTERVAL 180 DAY;

-- Per-(provider, target) success/ban rollup for ban heuristics.
CREATE TABLE IF NOT EXISTS baalvion.provider_target_stats
(
    day          Date,
    provider     LowCardinality(String),
    target       String,
    requests     UInt64,
    failures     UInt64,
    bans         UInt64,
    avg_latency  AggregateFunction(avg, UInt32)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(day)
ORDER BY (provider, target, day)
TTL day + INTERVAL 180 DAY;

CREATE MATERIALIZED VIEW IF NOT EXISTS baalvion.provider_target_stats_mv
TO baalvion.provider_target_stats AS
SELECT
    toDate(ts)                       AS day,
    provider,
    target,
    count()                          AS requests,
    countIf(success = 0)             AS failures,
    countIf(banned = 1)              AS bans,
    avgState(latency_ms)             AS avg_latency
FROM baalvion.ip_events
GROUP BY day, provider, target;

-- Per-(provider, country, ASN) health rollup for capability scoring.
CREATE TABLE IF NOT EXISTS baalvion.provider_geo_stats
(
    day          Date,
    provider     LowCardinality(String),
    country      LowCardinality(String),
    asn          UInt32,
    requests     UInt64,
    failures     UInt64,
    bytes_total  UInt64
)
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(day)
ORDER BY (provider, country, asn, day)
TTL day + INTERVAL 365 DAY;

CREATE MATERIALIZED VIEW IF NOT EXISTS baalvion.provider_geo_stats_mv
TO baalvion.provider_geo_stats AS
SELECT
    toDate(ts) AS day, provider, country, asn,
    count() AS requests, countIf(success = 0) AS failures,
    sum(bytes_in + bytes_out) AS bytes_total
FROM baalvion.ip_events
GROUP BY day, provider, country, asn;

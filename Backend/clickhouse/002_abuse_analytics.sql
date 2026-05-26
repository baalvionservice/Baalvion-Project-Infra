-- Abuse / Trust & Safety analytics (ClickHouse). High-volume security telemetry
-- (abuse events, enforcement, blocked destinations) for forensics + dashboards.
-- Fed from the metering/abuse worker + gateway block counters.

CREATE TABLE IF NOT EXISTS baalvion.abuse_events
(
    ts          DateTime64(3) DEFAULT now64(3),
    org_id      String,
    event_type  LowCardinality(String),  -- bandwidth_spike|geo_fanout|credential_stuffing|scraping|carding|account_sharing
    severity    LowCardinality(String),
    provider    LowCardinality(String),
    country     LowCardinality(String),
    target      String,
    detail      String
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (org_id, event_type, ts)
TTL toDateTime(ts) + INTERVAL 365 DAY;

CREATE TABLE IF NOT EXISTS baalvion.enforcement_events
(
    ts        DateTime64(3) DEFAULT now64(3),
    org_id    String,
    action    LowCardinality(String),   -- suspend|ban|throttle|geo_restrict|...
    reason    String,
    actor     String,                   -- admin id | 'risk-engine'
    source    LowCardinality(String)    -- manual|risk|moderation|payment_fraud
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (org_id, ts)
TTL toDateTime(ts) + INTERVAL 730 DAY;   -- 2y for compliance evidence

-- Blocked-destination hits (threat-intel) for abuse + provider-protection reporting.
CREATE TABLE IF NOT EXISTS baalvion.blocked_destinations
(
    ts        DateTime64(3) DEFAULT now64(3),
    org_id    String,
    indicator String,
    category  LowCardinality(String),   -- malware|phishing|botnet|tor|sanctioned
    source    LowCardinality(String)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (category, ts)
TTL toDateTime(ts) + INTERVAL 365 DAY;

-- Daily abuse rollup per org (for trust dashboards + customer risk trends).
CREATE TABLE IF NOT EXISTS baalvion.abuse_daily
(
    day        Date,
    org_id     String,
    event_type LowCardinality(String),
    events     UInt64
)
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(day)
ORDER BY (org_id, event_type, day);

CREATE MATERIALIZED VIEW IF NOT EXISTS baalvion.abuse_daily_mv
TO baalvion.abuse_daily AS
SELECT toDate(ts) AS day, org_id, event_type, count() AS events
FROM baalvion.abuse_events GROUP BY day, org_id, event_type;

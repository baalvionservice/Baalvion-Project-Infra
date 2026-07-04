# Baalvion Unified Analytics — v3 Google-Scale: Execution & Migration Blueprint

> Status: **DESIGN + MIGRATION PLAN (not yet provisioned).**
> v2 (shipped) is a production, AdSense-ready, multi-tenant SaaS analytics platform on Postgres + BullMQ + Redis. v3 is an **infrastructure program** — ClickHouse/Druid OLAP, a Kafka/Redpanda/Kinesis streaming bus, Flink-style stream processing, an S3/GCS parquet event-lake, multi-region edge collectors, and ML services. Those are clusters and managed services to provision and pay for, not code to drop into cms-service. This doc turns v3 into a **staged, non-breaking migration** that reuses the seams already built into v2.

## 0. Why v3 is a migration, not a rewrite

v2 was deliberately built with forward seams so v3 slots in behind interfaces that already exist:

| v3 need | v2 seam already in place |
|---|---|
| Streaming-first ingest | `service/analytics/streamSink.js` — `eventService.persist()` already calls `streamSink.emit(evt)`; today a no-op, flip `ANALYTICS_STREAM_SINK=kafka` + a driver to dual-write. |
| Schema evolution | `event_schema_version` column on every event (v2 writes `2`); processors branch on version. |
| OLAP store swap | All dashboard reads go through `reportingService` — repoint its queries from Postgres rollups to ClickHouse without touching the API or dashboard. |
| Real-time fanout | `realtimeService` (Redis pub/sub) + the SSE endpoint already exist; v3 swaps the publisher to the stream processor. |
| Provider ingestion | Connector plugin registry + watermark/quota runtime (`connectors/`, `provider_sync_state`) is transport-agnostic — unchanged in v3. |
| Fraud / attribution / consent | Already isolated services (`fraudService`, `attributionService`, `consentService`) — v3 promotes them from worker functions to stream operators behind the same contracts. |
| Cold archive | `writeMetrics`/`eventService` are the only write points — add an S3 parquet sink alongside. |

## 1. Target architecture (v3)

```
Browser/Server SDK → Edge Collector (global) → Streaming Bus (Kafka/Redpanda/Kinesis)
   → Stream Processing (Flink/Kafka-Streams: sessionize, attribute, fraud, window)
   → HOT Redis + ClickHouse hot tables · WARM ClickHouse (dashboards) · COLD S3 parquet lake
   → Query/API layer (tenant-isolated, cached) → Dashboard + AI Insight layer
```

Topics: `events.raw → events.cleaned → events.sessions → events.attribution → events.fraud → events.conversions → events.rollups.1m/1h`.

## 2. ClickHouse model (the new analytical store)

```sql
CREATE TABLE analytics.events
(
  event_time    DateTime,
  website_id    UUID,
  organization_id UUID,
  visitor_id    String,
  session_id    String,
  event_type    LowCardinality(String),
  module        LowCardinality(String),
  page          String,
  country       LowCardinality(String),
  device_type   LowCardinality(String),
  channel       LowCardinality(String),
  revenue       Float64,
  fraud_score   Float32,
  consent       String,
  schema_version UInt8,
  metadata      String
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_time)
ORDER BY (website_id, event_time, event_type);
```
Real-time aggregates become **ClickHouse materialized views** (active users 5m, revenue/min, top pages, CTR/keyword) instead of batch rollups.

## 3. Staged migration (strangler-fig, zero downtime)

**Stage 0 — Provision (infra, not code).** Stand up Redpanda (lightweight Kafka) or Kinesis, a ClickHouse cluster (or ClickHouse Cloud), and an S3 bucket. Decide managed vs self-hosted (see §5). *Gate: cost + ops sign-off.*

**Stage 1 — Dual-write.** Implement `service/analytics/sinks/kafka.js` (or `kinesis.js`) exposing `emit(topic, event)`; set `ANALYTICS_STREAM_SINK`. Now every persisted event lands in Postgres **and** the stream. No reader changes. Validate parity.

**Stage 2 — Stream processing.** Deploy a Flink/Kafka-Streams job (or a Node consumer group to start) that reads `events.raw`, runs the existing `fraudService`/`consentService`/sessionization/`attributionService` logic as stream operators, and writes to ClickHouse + `events.*` topics. Backfill ClickHouse from the Postgres partitions + S3.

**Stage 3 — Cut dashboards to ClickHouse.** Add a `reportingService` driver that targets ClickHouse; feature-flag per website. Compare against Postgres rollups (the reconciliation engine already does mismatch detection — reuse it). Flip when parity holds.

**Stage 4 — Cold lake + retention.** Add an S3 parquet sink; move raw retention from Postgres partitions to the immutable lake. Postgres keeps only recent hot data (or is retired from the analytics read path).

**Stage 5 — AI insight layer.** Stand up model services (anomaly detection beyond the v2 heuristics, SEO opportunity, revenue prediction, content scoring) consuming `events.*` + ClickHouse. These are new services behind the existing dashboard API.

**Stage 6 — Edge network.** Deploy edge collectors (Cloudflare Workers / regional Lambda@Edge) doing dedupe + bot-filter + consent at the edge, producing into the regional stream. The v2 collector contract (`POST /collect`) is preserved.

Rollback at every stage: the stream/ClickHouse path is additive; disabling `ANALYTICS_STREAM_SINK` and the reader flag reverts to v2 instantly.

## 4. Where the v2 logic goes in v3

- **Fraud** → stream operator on `events.raw → events.fraud` (v2 `fraudService` is the reference; add IP-reputation feed + behavioral ML).
- **Attribution** → stateful operator on `events.conversions` (v2 last-click/linear; add time-decay + data-driven).
- **Sessionization** → windowed stream state (v2 does it via session upserts).
- **Consent** → enforced at the edge collector (v2 enforces in the collector service).
- **Rollups** → ClickHouse materialized views (v2 does BullMQ batch rollups).

## 5. Tech-stack finalization + cloud mapping

| Layer | Self-host | AWS | GCP |
|---|---|---|---|
| Streaming bus | Redpanda | Kinesis Data Streams / MSK | Pub/Sub |
| Stream processing | Flink / Kafka-Streams / Node consumer | Kinesis Data Analytics (Flink) / KCL | Dataflow |
| OLAP (warm) | ClickHouse | ClickHouse Cloud / self-managed on EC2 | ClickHouse / BigQuery |
| Hot | Redis + ClickHouse | ElastiCache + ClickHouse | Memorystore |
| Cold lake | MinIO | S3 (parquet) | GCS |
| Edge | Cloudflare Workers | Lambda@Edge / CloudFront Functions | Cloud Run + CDN |
| ML | Python services | SageMaker | Vertex AI |

**Cost reality:** this is a material, ongoing spend (streaming + ClickHouse + edge + ML are always-on). Do **not** migrate until event volume justifies it. v2 on Postgres comfortably serves well past millions of events/day with partitioning + rollups; v3 is for **100M+/day, multi-region, sub-second** requirements. Adopt per-layer, driven by real load — not all at once.

## 6. Do-not-do-prematurely

- Don't put ClickHouse DDL into cms-service — it's a separate datastore with its own ops.
- Don't run Kafka/Flink for low volume — the Postgres + BullMQ path is cheaper and simpler until you're genuinely scale-bound.
- Don't build the ML layer before you have the labelled event history the v2 pipeline is now accumulating.

## 7. Trigger checklist to start v3

Begin Stage 0 when **any** holds: sustained > ~5–10M events/day per region; dashboard p95 on Postgres rollups breaching target; multi-region data-residency requirement; or a revenue-optimization/ML roadmap that needs the streaming feature store. Until then, v2 is the right system.

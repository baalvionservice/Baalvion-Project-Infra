# ADR-0002: NATS JetStream for domain events; Kafka/Redpanda for telemetry

**Status:** Accepted · **Date:** 2026-05-26 · **Deciders:** Architecture, Platform Core, SRE

## Context
We need an enterprise event backbone: domain events between contexts (replay,
dedup, sagas, eventual consistency) AND a high-volume telemetry log (millions of
routing events/day, already on Redpanda from the analytics work).

## Decision
Use **two purpose-fit logs**, both behind the one `@baalvion/events` interface:
- **NATS JetStream** — the **domain-event bus**. Low-latency, subject wildcards
  (`proxy.>`), per-message dedup, file-replicated streams, replay, light ops.
  Carries the cross-context domain events.
- **Kafka / Redpanda** — the **telemetry/analytics log**. High-throughput,
  long-retention, partitioned; consumed by the analytics CQRS read models.

Redis pub/sub + Streams (the pre-existing publisher) remains a **dev/no-broker
fallback** — `createEventBus({transport})` selects nats | kafka | redis | noop.

## Alternatives
- **Kafka for everything:** heavier ops, no native subject wildcards, higher
  latency for small domain events. Kept for telemetry where its strengths matter.
- **NATS for everything:** weaker at very-high-volume long-retention analytics
  replay vs. Kafka's partitioned log. Split the workload instead.

## Consequences
- (+) Each workload gets the right tool; one SDK hides the choice from services.
- (+) Domain events get dedup + replay (exactly-once-ish with the outbox).
- (−) Two systems to operate. Mitigated: NATS is light; Redpanda already deployed.
- The transactional **outbox** (`@baalvion/events/outbox`) guarantees an event is
  emitted iff its DB mutation committed (no dual-write inconsistency).

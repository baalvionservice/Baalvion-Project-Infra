# ADR-0003: Database-per-service + CQRS for derived contexts

**Status:** Accepted · **Date:** 2026-05-26 · **Deciders:** Architecture, SRE

## Context
A shared database is the strongest hidden coupling: any service can read any
table, so "service boundaries" are fiction. But splitting a live DB is risky.

## Decision
- **Each bounded context owns its data.** No cross-context table access — only
  contracts (gRPC) + events. Enforced in review via CODEOWNERS on schema dirs.
- **Extract logically first, physically last** (see roadmap Phase 5): schema-per-
  context in the shared Postgres → separate instances, with outbox + CDC backfill,
  cutting reads then writes per table.
- **CQRS for derived contexts:** `analytics` and `audit` are pure **read models**
  built by consuming the event stream into Timescale/ClickHouse. They never query
  another service's write store; they are rebuildable from event replay.
- **Event store:** the durable streams (NATS/Kafka) + the transactional outbox are
  the system of record for integration events.

## Alternatives
- **Keep shared DB:** rejected — defeats isolation, the core goal.
- **Big-bang DB split:** rejected — unacceptable risk to live revenue.

## Consequences
- (+) True isolation; a context's storage tech can evolve independently
  (Postgres / Timescale / ClickHouse) without coordination.
- (+) Read models scale + rebuild independently of the write path.
- (−) Eventual consistency across contexts; cross-context queries become event-fed
  read models, not JOINs. We accept this — it's the point.

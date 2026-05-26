# ADR-0005: gRPC for sync, events for async; contracts are the only coupling

**Status:** Accepted · **Date:** 2026-05-26 · **Deciders:** Architecture

## Context
Services must communicate without coupling to each other's internals or deploy
cadence. We need a default that biases toward decoupling.

## Decision
- **Async events are the default** (NATS, ADR-0002). State propagation, fan-out,
  read-model building, sagas — all via versioned domain events.
- **Synchronous = gRPC over mTLS** only when the caller needs an answer *now*
  (token verify, quota check, allocation). Defined in `@baalvion/contracts` protos;
  clients/servers are **generated** (`buf generate`) — no hand-written wire code.
- **The contract is the only coupling.** A service imports `@baalvion/contracts`,
  never another service's source. Breaking a contract is a blocking CI gate
  (`buf breaking`), co-owned by producer + architecture (CODEOWNERS).
- **Resilience:** gRPC calls use deadlines, retries with backoff, and circuit
  breakers (the proxy orchestrator's breaker pattern generalizes here). Service
  discovery + load balancing via the mesh (Istio) — not client-side hardcoding.

## Consequences
- (+) Producers and consumers deploy independently within a contract version.
- (+) Polyglot by construction (Go gateway, Node services, Python ML) — protobuf is
  the lingua franca.
- (−) Versioning discipline required (additive-only within a major; new package for
  a major). Enforced by buf.

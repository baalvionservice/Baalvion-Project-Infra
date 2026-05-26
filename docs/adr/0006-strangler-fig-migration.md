# ADR-0006: Strangler-fig migration (no big-bang rewrite)

**Status:** Accepted · **Date:** 2026-05-26 · **Deciders:** Architecture, all division leads

## Context
The proxy business is buried in a 24-domain monolith carrying live revenue. We
must reach the target architecture without a flag day and without halting the
businesses. A simultaneous physical extraction of all contexts is infeasible to do
correctly and would break running systems.

## Decision
Adopt the **strangler-fig** pattern (Fowler). New structure grows around the
monolith and gradually takes over, one bounded context at a time:

1. **Foundation first** (Phase 0, shipped): event bus, contracts, service-kit,
   catalog, gateway, Helm, GitOps — and emit real domain events from the monolith.
2. **Extract behind a contract**, dual-run in shadow, reconcile, then flip a
   feature flag to cut traffic. Reversible at every step.
3. **Data last** (ADR-0003): split the database only after behaviour is separated.
4. Order by leverage + risk: identity → billing → audit/analytics (parallel) →
   trust/notifications → DB split → other divisions (see migration-roadmap.md).

## Why not big-bang
- A coordinated rewrite of 24 domains has unbounded blast radius, no incremental
  value delivery, and no clean rollback. This is exactly the "fake microservices /
  superficial restructuring" failure mode. Rejected.

## Consequences
- (+) Continuous delivery of value; each phase is independently shippable + revertible.
- (+) The monolith remains the safety net until each context is proven in production.
- (−) A transitional period where both old and new paths exist (dual-run cost).
  Bounded by feature flags + a strict "delete the old path to finish a phase" rule.
- **Definition of done for a phase:** old code path deleted, new service owns its
  data + deploy + on-call, event replay/DR drill passed.

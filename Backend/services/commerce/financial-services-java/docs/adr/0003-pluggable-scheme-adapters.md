# ADR 0003 — Pluggable scheme adapters behind a resilience boundary

**Status:** Accepted

## Context
Payments route to multiple external schemes (NIP, Interswitch/ISO 8583, Visa, Mastercard,
wallet). These are unreliable external dependencies and each speaks a different protocol.

## Decision
Define a `SchemeAdapter` strategy (`supports`, `send`, `fallback`). `SchemeRouter` builds a
per-scheme registry from all adapter beans and selects the dedicated adapter, falling back to
`SimulatedSchemeAdapter` when none exists. The router applies the full §9.1 resilience set at
the boundary: `@CircuitBreaker`, `@Retry`, `@Bulkhead`, and `@TimeLimiter` (async path), and
degrades to `ROUTING_DEFERRED` on failure rather than failing the payment.

## Consequences
- Real adapters (e.g. `NipSchemeAdapter`) are added as beans with zero router changes.
- Today the simulated adapter yields synthetic scheme references; this is the only stub in the
  payment path and is clearly isolated.
- The async `routeAsync` exists for adapters with real I/O so the timeout applies.

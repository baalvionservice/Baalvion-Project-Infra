# ⚠ DEPRECATED — Node `ledger-service`

**Status:** deprecated duplicate · **Canonical replacement:** `Backend/services/commerce/financial-services-java/ledger-service` (Java/Spring Boot)

This Node.js double-entry ledger is a **confirmed same-bounded-context duplicate** of the
Java `ledger-service`. The architecture-of-record already designates Java as canonical:

- The service catalog ([Backend/catalog/services/ledger-service.yaml](../../../catalog/services/ledger-service.yaml))
  has **one** `ledger-service` entry and points it at the Java path (`language: java`).
  There is **no** catalog entry for this Node service.
- [docs/architecture/PLATFORM-CONSOLIDATION-AND-GOVERNANCE-PLAN.md](../../../../docs/architecture/PLATFORM-CONSOLIDATION-AND-GOVERNANCE-PLAN.md)
  §3.2 lists this pair as a code-level duplicate: **KEEP** Java, **REMOVE/CONVERT** this Node
  service (risk: CRITICAL). Decision **D1**: "Java is canonical; retire Node ledger/payment."

## Why this is the duplicate (evidence)

- **Identical contract & schema:** same `ledger` schema, a field-for-field identical
  `journal_entries` table, the same `(transaction_ref, tenant_id)` idempotency key, the same 7
  entry types and PENDING/POSTED/REVERSED lifecycle, the same 6-endpoint REST API, and identical
  reversal/balance logic. The only interface difference is the path prefix (`/v1/ledger` vs
  `/api/v1/ledger`).
- **Live traffic already bypasses this service:** the gateway's `SVC_LEDGER` is set to the Java
  twin (`:13014`); `order-execution-service`'s `ledgerClient.js` is documented as a client for
  "the Java ledger-service".
- **Functionally hollow where it matters:** this service's Kafka/BullMQ integration is a
  placeholder stub (`queue/workers.js` is a `console.log`), so it cannot participate in the
  payment/escrow sagas the platform requires. The Java service is a full saga participant with a
  transactional outbox.
- The original direct caller (`order-service`) is now archived under `order-service_DEPRECATED`.

## ⛔ Do NOT just delete this service

It is **tier-1 system-of-record money code** and is still wired in:
- root `docker-compose.yml` (`baalvion-ledger-service`, profile `backend`, host `3037`),
- the CI matrix, and health-polled by `realtime-service`.

Resetting/unsetting `SVC_LEDGER` would re-route money writes back here. Deletion must follow the
governance plan's **§4.1 staged decommission**, in order:

1. **Freeze writes** here (revoke INSERT / 410 the write routes).
2. **Shadow / dual-write** to the Java ledger.
3. **Reconcile** — run the one-off reconciler proving per-tenant running-balance **parity** between
   the two `ledger` schemas (note the RLS GUC drift: this service keys off `app.current_tenant`,
   Java off `app.current_tenant_id`).
4. **Cut all readers** to Java; align the `SVC_LEDGER` / `appConfig` defaults to the Java endpoint
   so nothing can silently fall back here.
5. **Then** remove this source, its `docker-compose`/CI/realtime-poll entries, and its `ledger`
   migration history — with **commerce CODEOWNER sign-off** (`@baalvion/commerce`).

> Verified 2026-06-13 by an 11-agent adversarial review (verdict: `duplicate`, high confidence,
> `safeToDelete: false`). New work belongs in the Java `ledger-service`.

# Architecture note — two `payment-service` implementations are INTENTIONAL

There are two services named `payment-service`. They are **not** duplicates to merge — a 2026-06-13
adversarial code review (verdict: `partial-overlap`, high confidence, `safeToDelete: false`)
confirmed each owns a **live, capability-exclusive money rail that exists nowhere else**. Do not
delete either.

| | This service (Node) | `financial-services-java/payment-service` (Java) |
|---|---|---|
| Role | Consumer **gateway-checkout initiator** | **Interbank** processor + saga **completer** / system-of-record |
| Rails (exclusive) | Razorpay / Stripe / PayU SDKs, signed webhooks, CMS-vault keys | ISO 8583 to NIBSS NIP (`:5005`) / Interswitch (`:5003`), Resilience4j |
| Saga position | Pure **producer/initiator** (`payments.transaction.*`) | **Consumer/completer** (`payments.ledger.posted/failed`) + maker-checker `/approvals` |
| Exclusive tables | `payments.gateway_payments`, `payments.payment_ledger_entries` | `payments.outbox_events`, `payments.approval_requests` |
| Catalog | not catalogued (shadow) | canonical (`catalog/services/payment-service.yaml`) |

A direct grep for `razorpay|stripe|payu|gateway_payments` across the **entire** Java tree returns
**zero** hits; the Java `scheme/iso8583` interbank rail has **no** Node counterpart. The Node `v1`
routes have **no** `/complete`, `/fail`, or `/approvals` endpoints. Deleting either erases an entire
money rail.

## The genuine overlap (real hazards — fix forward, do not delete)

Both are named `payment-service`, both use container port `3015`, both co-own the `payments` schema
and the shared `payments.transactions` table, both re-implement per-scheme **tiered fee + VAT**
(`NIP/VISA/MASTERCARD/INTERSWITCH/WALLET/INTERNAL/ESCROW`), and both publish the
`payments.transaction.initiated/completed/failed` Kafka topics.

Required hardening (tracked, **human-gated**, not auto-applied):

1. **Single source of truth for the fee+VAT table.** The money-critical fee math is maintained
   twice (Node `feeEngine.js` Decimal.js vs the Java fee service) and will silently diverge. Extract
   it into one shared spec/config.
2. **Saga-broker isolation.** Never point both stacks at the same Kafka broker with overlapping
   `payments.transaction.*` topics. They are mutually-exclusive `docker-compose` selections by
   design — keep it that way and enforce it in compose/k8s.
3. **Naming clarity (optional).** Renaming containers (e.g. `payment-gateway-node` vs
   `payment-core-java`) removes the false "duplicate" signal without touching money code.
4. **Long-term:** the strangler-fig target is to port the consumer-checkout vertical onto the Java
   system-of-record, then retire the Node interbank vertical — a multi-sprint, CODEOWNER-signed-off
   deprecation, **not** a cleanup. See
   [docs/architecture/PLATFORM-CONSOLIDATION-AND-GOVERNANCE-PLAN.md](../../../../docs/architecture/PLATFORM-CONSOLIDATION-AND-GOVERNANCE-PLAN.md).

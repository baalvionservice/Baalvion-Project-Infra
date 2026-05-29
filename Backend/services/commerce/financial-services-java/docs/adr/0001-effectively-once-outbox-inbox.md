# ADR 0001 — Effectively-once messaging via outbox + inbox + idempotent producers

**Status:** Accepted

## Context
The design (§9.3) calls for exactly-once semantics. True Kafka EOS (transactional
read-process-write) across a Kafka transaction *and* a JPA transaction requires a chained
transaction manager, is fragile across upgrades, and couples DB and broker commit paths.

## Decision
Achieve **effectively-once** with three composable, broker-agnostic mechanisms:
1. **Transactional outbox** (`payments.outbox_events`): producers write the event in the same
   DB transaction as the state change; a scheduled publisher drains it with
   `FOR UPDATE SKIP LOCKED` (multi-replica safe). Guarantees publish-iff-commit.
2. **Inbox dedup** (`accounts.processed_events`, ledger unique `transaction_ref`, settlement
   unique `(tenant_id, transaction_id)`, risk unique `(transaction_id, tenant_id)`): consumers
   record/guard processed ids so redelivery never double-applies.
3. **Idempotent producers** (`enable.idempotence=true`) + DLT + bounded retry on consumers.

## Consequences
- No dependency on Kafka transactions; each side is independently correct and observable.
- At-least-once delivery is tolerated because every consumer is idempotent.
- If strict EOS is later required for a specific flow, a transactional listener can be added
  without changing the event contracts.

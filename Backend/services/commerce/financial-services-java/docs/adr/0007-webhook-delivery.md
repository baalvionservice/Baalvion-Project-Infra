# ADR 0007 — HMAC-signed outbound webhook delivery

**Status:** Accepted

## Context
External subscribers need authenticated, tamper-evident, reliably-delivered callbacks for
financial events (design §7.2 HMAC-SHA256 signatures; §2.1 webhook delivery with DLQ retry).

## Decision
Implement webhook delivery in **audit-service** — the existing aggregation point that already
consumes every domain event — to avoid a new service or duplicated event plumbing.

- `webhook_subscriptions` (tenant, url, per-subscription HMAC secret, event regex, active).
  The secret is returned **only once** at creation and never echoed.
- On the aggregation path, `WebhookService.fanOut` creates a PENDING `webhook_deliveries` row for
  each matching active subscription — in the **same transaction** as the audit record, so a
  webhook is enqueued iff the event was durably recorded.
- `WebhookDispatcher` (`@Scheduled`) claims due deliveries with `FOR UPDATE SKIP LOCKED`
  (replica-safe), signs the body `X-Webhook-Signature: sha256=<hmac>`, sends via the JDK
  `HttpClient` with timeouts, and on failure retries with exponential backoff
  (`nextAttemptAt`), dead-lettering as FAILED after `max-attempts`. `X-Webhook-Id` is the
  subscriber-side idempotency key.

## Consequences
- Production-grade delivery (signing, retry, backoff, DLQ, idempotency, observability via the
  delivery rows) with no external dependencies beyond the subscriber URL/secret.
- Subscribers verify the HMAC with their stored secret and dedupe on `X-Webhook-Id`.
- FAILED deliveries are queryable per subscription for ops replay.

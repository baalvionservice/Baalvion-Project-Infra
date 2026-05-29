# Runbook — Dead-Letter Queue (DLQ) Replay

## Background
Failed Kafka deliveries are retried (3× exponential backoff: 1s/5s/25s) then routed to
`<topic>.DLT`. The **audit-service** monitors every `*.DLT` topic and records each poison message
to `audit.dlt_messages` with the original topic, key, payload, and exception. Webhook deliveries
that exhaust retries are marked `FAILED` in `audit.webhook_deliveries`.

## Inspect
```
# list (optionally filter by status DEAD/REPLAYED/DISCARDED)
curl -H "Authorization: Bearer $TOKEN" \
  "http://audit-service:3020/api/v1/audit/dlt?status=DEAD&size=50"

# one message
curl -H "Authorization: Bearer $TOKEN" \
  "http://audit-service:3020/api/v1/audit/dlt/<id>"
```
Read the `exceptionMessage` and `payload`. Decide: is the message reprocessable (transient
cause now fixed) or genuinely bad (will always fail)?

## Replay (re-publish to the original topic)
```
curl -X POST -H "Authorization: Bearer $TOKEN" -H "X-Actor: $YOU" \
  "http://audit-service:3020/api/v1/audit/dlt/<id>/replay"
```
Replay is **safe**: every consumer is idempotent (ledger unique `transaction_ref`, account
inbox `processed_events`, settlement unique `(tenant,txn)`, risk unique `(txn,tenant)`), so a
re-delivered event that was partially processed will not double-apply (ADR 0001).

## Discard (genuinely bad message)
```
curl -X POST -H "Authorization: Bearer $TOKEN" -H "X-Actor: $YOU" \
  "http://audit-service:3020/api/v1/audit/dlt/<id>/discard"
```

## Webhook delivery failures
List failed deliveries for a subscription and re-trigger by re-registering or by an operator
replay of the source event (the dispatcher re-attempts PENDING rows automatically; FAILED rows
are terminal and surfaced at `GET /api/v1/audit/webhooks/{id}/deliveries`).

## Root cause
A burst of DLT entries usually means a downstream/schema/deploy problem. Fix the root cause
first, then bulk-replay. Track `dlt_messages_dead` on the dashboard back to 0.

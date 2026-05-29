# Runbook — Incident Response

Alerts are defined in `deploy/observability/prometheus-alerts.yml`. Severity → channel:
P1 → PagerDuty (page), P2 → PagerDuty (notify), warning → Slack `#alerts`.

## First 5 minutes (any P1/P2)
1. Open the Grafana "Baalvion Financial — Overview" dashboard; identify the affected `application`.
2. Check correlation: every request/log carries `traceId` (header `X-Trace-Id`, MDC, JSON logs).
   Grab a failing request's `traceId` and search logs/traces.
3. `kubectl -n financial get pods -l app=<service>` — CrashLoop/NotReady? `kubectl logs`/`describe`.

## Per-alert

### HighTransactionErrorRate (5xx > 1%) — P1
- Recent deploy? → consider rollback (deployment.md).
- DB or Kafka down? → check `DbConnectionPoolExhaustion` / consumer lag panels; see failover.md.
- Downstream scheme failing? → `CircuitBreakerOpen` panel; the router degrades to
  `ROUTING_DEFERRED` (payments still accepted as INITIATED), so error spikes usually mean DB/app.

### PaymentLatencyP99High (> 3s) — P2
- DB pool saturated (panel) → scale replicas / raise `hikari.maximum-pool-size`.
- Scheme calls slow → circuit breaker should trip; confirm `@TimeLimiter` (30s) config.

### CircuitBreakerOpen — P1
- A downstream (scheme adapter) is failing. Payments are not lost — they stay INITIATED and the
  saga completes once ledger posts. Investigate the downstream; breaker auto-half-opens.

### DbConnectionPoolExhaustion (> 90%) — P2
- Identify the hot service; check for slow queries / long transactions (outbox/inbox locks).
- Scale horizontally; verify HPA reacted. The outbox/inbox use `FOR UPDATE SKIP LOCKED` so they
  do not block each other across replicas.

### OutboxBacklogGrowing — P2
- Kafka unreachable or publisher stalled. Check broker health + the `outbox_pending` panel.
- The publisher retries automatically; once Kafka recovers the backlog drains. No data loss
  (publish-iff-commit, ADR 0001).

### DltMessagesPresent — Slack
- Poison/failed messages captured. Triage and replay/discard — see dlq-replay.md.

## Financial integrity incident (suspected balance/ledger mismatch)
1. Ledger is the source of truth (POSTED entries). No balance mutates without a ledger entry
   (ADR 0001). Run the reconciliation run for the period (reconciliation-service) and inspect
   `EXCEPTION`/`UNMATCHED` items at `GET /api/v1/reconciliation/items?status=EXCEPTION`.
2. Freeze affected tenant operations if drift is confirmed (revoke/disable via tenant policy).
3. Escalate to finance-ops; do NOT mutate balances manually — post compensating ledger entries.

## After resolution
Record timeline, root cause, and follow-ups. File a corrective ADR if an architectural decision
changed.

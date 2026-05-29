# Runbook — Failover (DB / Kafka / Redis / Region)

Targets (design §9.2 / §11.1): RTO < 30 min single-service, RPO < 5 min.

## PostgreSQL (primary failure)
- **Multi-AZ RDS / Patroni**: failover is automatic (< ~30s). Services reconnect via the
  writer endpoint (`postgres-rw...`) — HikariCP retries; no app action if the endpoint is stable.
- Confirm: writes succeed, `DbConnectionPoolExhaustion` clears, no migration re-runs (Flyway is
  idempotent on history).
- If manual: promote the standby, repoint `DB_HOST` (configmap), `kubectl rollout restart`.
- **Integrity after failover**: the outbox guarantees publish-iff-commit, so no events were sent
  for uncommitted txns. Run a reconciliation for the window around the failover.

## Kafka (broker failure)
- 3-broker cluster, RF=3, `acks=all`, idempotent producers → a single broker loss is transparent;
  consumer groups rebalance.
- If producers buffer (outbox `OutboxBacklogGrowing`), they drain automatically on recovery.
  Consumers resume from committed offsets; idempotent handlers make reprocessing safe.
- Total outage: payments still accepted (persisted INITIATED + outbox row); the saga completes
  when Kafka returns. No data loss.

## Redis (cache / rate-limiter failure)
- Redis is non-critical. The Redis rate-limit backend **fails open** (allows traffic) on outage,
  and payment idempotency falls back to the DB unique constraint. Use Sentinel/Cluster for HA.
- Action: none required for correctness; restore Redis to re-enable distributed limiting.

## Regional failover (DR)
1. Restore PostgreSQL to the standby region (PITR, RPO < 5 min) and validate (backup-restore.md).
2. Stand up Kafka + the services from the Helm prod overlay pointed at regional endpoints.
3. Repoint DNS / global LB to the standby region.
4. Reconcile the cutover window before resuming external scheme submission (avoid duplicate
   settlement; settlement items are unique per `(tenant, transaction_id)`).

## Drills
Quarterly game-days: kill a DB primary, a Kafka broker, and Redis in staging under load; verify
RTO/RPO, dashboards, and that ledger/reconciliation show zero unexplained drift afterwards.

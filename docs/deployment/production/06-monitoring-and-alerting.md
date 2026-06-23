# 06 · Monitoring & Alerting

## 14. Monitoring & alerting plan

### Signal sources

| Layer | Source | How |
|---|---|---|
| Host | CPU, mem, disk, network | CloudWatch agent on EC2 |
| Container | health, restarts, mem vs limit | Docker healthchecks (already defined) + `docker events`; ECS task health if migrated |
| Process | per-module status, restarts, heap | `pm2 jlist` (42 Node procs); export via a sidecar scrape if desired |
| App logs | structured JSON (pino) with `traceId`/`requestId` | `awslogs` driver → CloudWatch Logs `/baalvion/consolidated`; one stream per container |
| Edge | request rate, 4xx/5xx, latency, TLS | Caddy access logs → CloudWatch; (ALB metrics if fronted) |
| DB | connections, CPU, storage, replica lag, slow queries | RDS Enhanced Monitoring + Performance Insights |
| Queues | BullMQ waiting/active/failed | `GET /v1/notifications/queues/stats` (admin) + Redis metrics |
| Payments | JVM heap/GC, Kafka consumer lag, outbox depth | actuator `/actuator/health`,`/actuator/metrics`; `payments.outbox_events` row count |
| Email | SES send/bounce/complaint | SES event publishing → CloudWatch/SNS |

### Health endpoints to probe (synthetic / uptime checks)

- `https://auth.baalvion.com` (auth-gateway) · `https://api.baalvion.com/health` (proxy BFF)
  · `https://admin.baalvion.com` (platform) — external synthetic check every 1 min.
- Internal: each container's representative `/health` (see compose healthchecks); cms at
  `/api/v1/health`; `search-service` returns **503 by design** when OpenSearch is absent — alert
  on it only if OpenSearch is provisioned.

### Alarms (CloudWatch → SNS → PagerDuty/Slack/email)

| Alarm | Threshold | Severity |
|---|---|---|
| EC2 CPU | >80% for 10 min | warn |
| EC2 memory | >85% | high |
| EC2 disk | >80% | high (image/log growth) |
| Container unhealthy / restart loop | any healthcheck fail ×3 or restart_time climbing | high |
| RDS connections | >80% of max | high (Sequelize pool exhaustion) |
| RDS CPU / free storage | >80% / <10 GB | high |
| RDS replica lag | >30 s | warn |
| Edge 5xx rate | >2% of requests | high |
| p95 latency (auth/api) | >1 s | warn |
| BullMQ failed jobs | >0 sustained / depth climbing | warn |
| JVM heap | >85% of `-Xmx` | warn |
| Kafka consumer lag | >1000 / climbing | warn |
| TLS cert expiry | <14 days | high (Caddy auto-renews; alert if it can't) |
| **Auth login-failure spike** | abnormal 401 rate | security |
| **Secrets/IAM access anomaly** | CloudTrail unusual access | security |
| SES bounce/complaint rate | >5% / >0.1% | high (deliverability) |

### Dashboards
- **Host** (CPU/mem/disk/net) · **Fleet** (per-container mem vs limit, restarts, 42-process status)
  · **RDS** (connections/CPU/storage/PI top queries) · **Edge** (rps, 5xx, latency) · **Queues**
  (BullMQ depth/failed) · **Payments** (JVM heap, Kafka lag, outbox depth, txn rate).

### Logging hygiene
- Structured JSON with `traceId`/`requestId` is already emitted — set CloudWatch retention
  (e.g. 30–90 d), metric filters for `level:50` (errors) → alarms, and **never** log secrets/PII
  (the services already redact email/tokens).

### Runbook links
Every high/critical alarm should link to the relevant section of
[05 · Runbooks](05-runbooks.md) (rollback, DB restore) and
[07 · Risks](07-risks-and-readiness.md).

➡ Next: [07 · Risks & readiness](07-risks-and-readiness.md)

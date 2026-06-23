# 06 · ECS Migration

The Compose file is written to translate cleanly to ECS, and the same module layout scales to
45+ independently deployed services later.

## Now → ECS (lift the same topology)

Each `app-*` Compose service becomes one ECS service/task. Because all six Node apps share one
image and differ only by `command:`, you get **one image + N task definitions**.

| Compose construct | ECS equivalent |
|---|---|
| `image: baalvion-backend:local` | one ECR image, referenced by every task def |
| `command: pm2-runtime start <app>.config.js` | task def `command` (the only per-app difference) |
| `mem_limit` / `mem_reservation` | task/container `memory` / `memoryReservation` (1:1) |
| `healthcheck` (`node -e` probe) | container `healthCheck` (unchanged) |
| `env_file` / `environment` | task def `environment` + secrets from SSM/Secrets Manager |
| `depends_on: redis` | service dependency / startup ordering |
| RDS (external) | **no change** — already a managed dependency |
| `redis` container | **ElastiCache** (swap `REDIS_HOST`) |
| `caddy` (TLS + routing) | **ALB + ACM**; Caddyfile host/path rules → ALB listener rules |
| compose network | awsvpc task networking in private subnets |

Inspect the translation with `docker compose convert`, or author task defs from the per-app table in
[05 · Capacity & Cost](05-capacity-and-cost.md).

### Launch type
- **Fargate** — simplest; one task per app, no host management. Right default.
- **EC2 capacity provider** — cheaper at steady state; bin-pack the 6–7 tasks on one/two instances.

## Later → scale to 45+ independent services

The module layout makes re-splitting trivial: move a module's entry from a grouped ecosystem file
into its own task def. Recommended trajectory:

1. **Split the busiest apps first.** When a single app's traffic dominates, promote its hottest
   modules (e.g. `proxy-service`, `order-service`, `auth-service`) to their own ECS services with
   independent autoscaling. The rest stay grouped.
2. **Per-context services.** Eventually each bounded context (or each module) is its own ECS service
   behind the ALB — the original 45-service vision, now with managed scaling.
3. **Managed data tier.** RDS Multi-AZ (+ read replicas), ElastiCache, managed **OpenSearch** for
   `jobs-service`/`search-service`, and **Neo4j Aura** for `network-graph-service`.
4. **Offload async to Lambda.** Move report generation, notification dispatch, and audit ingestion
   to SQS/EventBridge-triggered Lambdas (with **RDS Proxy** for connection pooling) — see
   [02 · Resource Audit §4](02-resource-audit.md).
5. **Edge & ops.** API Gateway + ALB, per-service blue/green deploys, and the existing
   `observability/` + `warroom/` stacks. Enforce module boundaries in CI with
   `pnpm run architecture:check`.

## Migration guardrails

- **Ports become irrelevant** under awsvpc/ALB target groups, but keep the pm2 `PORT` assignments as
  the canonical per-module contract during the transition.
- **One database, many schemas** survives the move; only when a context needs independent scaling/SLA
  should its schema graduate to its own RDS instance (respecting the bounded-context boundary).
- **Secrets** move from `.env` to SSM Parameter Store / Secrets Manager before the ECS cutover;
  never bake them into the image.

## At a glance

| Phase | Compute | DB | Cache | Search/Graph | Edge | Deploy units |
|---|---|---|---|---|---|---|
| **Now** | 1× EC2 (Compose) | RDS Single-AZ | Redis container | client → external | Caddy | 6 (+1 JVM) |
| **ECS lift** | Fargate, 6–7 tasks | RDS Single-AZ | ElastiCache | managed | ALB + ACM | 6 (+1 JVM) |
| **Scale-out** | Fargate, autoscaled | RDS Multi-AZ + replicas | ElastiCache | OpenSearch + Neo4j Aura | API GW + ALB | up to 45+ |

⬅ Back to [index](README.md)

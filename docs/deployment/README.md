# Backend Consolidation & Deployment

How the **45 backend services** are audited, grouped, and packaged into a small number of
deployable applications for AWS — without changing business logic or moving any module.

> **Status:** design + runnable artifacts complete (`deploy/consolidated/`), validated
> (`docker compose config` exit 0; all pm2 configs `node --check` clean). Uncommitted.
> **Date:** 2026-06-23 · **Scope:** `Backend/services/**` (45 modules) → 6 Node apps + 1 JVM app.

## Read in order

| # | Document | What it answers |
|---|----------|-----------------|
| 01 | [Service Inventory](01-service-inventory.md) | Every service: domain, runtime, framework, port, real-vs-shell, heavy deps |
| 02 | [Resource Audit](02-resource-audit.md) | Idle-RAM classification, Lambda candidates, merge analysis, boot-pattern findings |
| 03 | [Consolidation Architecture](03-consolidation-architecture.md) | The 6+1 grouping, rationale, how module boundaries stay intact |
| 04 | [Deployment Guide](04-deployment-guide.md) | Folder layout, image model, env, run commands, schema/migrations |
| 05 | [Capacity & Cost](05-capacity-and-cost.md) | Per-app/per-service memory, instance sizing, monthly AWS cost |
| 06 | [ECS Migration](06-ecs-migration.md) | Compose → ECS now; scaling to 45+ independent services later |

## Production deployment package

After end-to-end local validation (all 43 deployables up; auth/CMS/payment/email exercised),
the **production package** lives in [`production/`](production/00-README.md) — architecture &
dependency diagrams, AWS resources, image inventory, per-container sizing anchored on the
**measured ~4.0 GiB idle**, cost at 1×/10×/100×, env + secrets inventory, deploy/rollback/backup
runbooks, monitoring & alerting, risks found in testing, a readiness checklist, and the
**dry-run → production exclusions**. Compose: [`deploy/consolidated/docker-compose.prod.yml`](../../deploy/consolidated/docker-compose.prod.yml).

## TL;DR

- **Audit:** ~85% of the fleet is light Node/Express+Sequelize. All real RAM weight sits in
  **two non-Node services** — `financial-services-java` (JVM) and `ml-service` (Python) —
  plus a few worker-heavy Node BFFs. One service (`law-elite`) is an in-memory demo shell.
- **Packaging:** one shared image runs each app via a different `pm2-runtime` ecosystem file.
  A container launches only its bounded context's `node index.js` processes. **No code changes.**
- **Footprint:** ~6.0 GB actual → one **t4g.large (8 GB)** + **RDS** → **~$85/mo** on-demand,
  **~$62/mo** with a 1-yr Savings Plan.
- **Runnable artifacts:** [`deploy/consolidated/`](../../deploy/consolidated/) (compose, Dockerfiles,
  pm2 configs, Caddyfile, env example).

## Principles (non-negotiable)

1. **No business logic changes** — every module still runs its own unmodified `node index.js`.
2. **Module boundaries intact** — nothing under `Backend/services/**` moves; grouping is packaging only.
3. **PostgreSQL on AWS RDS** — external, TLS-on, one database with a schema per domain.
4. **Compose now, ECS later** — the compose file is written to translate 1:1 to ECS task definitions.

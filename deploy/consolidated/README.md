# Consolidated Backend Deployment

**45 repository modules → 6 Node apps + 1 JVM app**, packaged for a single EC2 host with
Docker Compose, PostgreSQL on AWS RDS, and a clean migration path to ECS.

> 📚 **Full documentation:** [`docs/deployment/DEPLOYMENT.md`](../../docs/deployment/DEPLOYMENT.md) —
> the single authoritative deployment guide (service inventory, resource audit, architecture, AWS
> resources, sizing & cost, env & secrets, runbooks, monitoring, risks, the pre-deploy checklist, and
> the ECS migration plan). This README is the quick-start; that doc is the reference.

## Principle

- **Modules stay separate in the repo.** Nothing under `Backend/services/**` moves or changes.
- **No business logic changes.** Each module still runs its own `node index.js`.
- **Grouping = packaging only.** One shared image runs each app via a different
  `pm2-runtime` ecosystem file, so a container launches **only its bounded context's**
  processes. Boundaries are preserved at the process level (own port, own DB pool, own
  lifecycle), not merged into one runtime.

## The 6 + 1 deployable apps

| App (container) | Bounded context | Modules | pm2 config |
|---|---|---|---|
| `app-identity` | identity | auth-service, auth-gateway, oauth-service, rbac-service, session-service | `pm2/identity.config.js` |
| `app-commerce` | commerce + marketplace | commerce, inventory, fulfillment, market, order, trade-service, marketplace | `pm2/commerce.config.js` |
| `app-trade` | trade | network-graph, order-execution, product-registry, quality-inspection, supplier-lifecycle, trade-documentation | `pm2/trade.config.js` |
| `app-ecosystem` | ecosystem | about, agent, brand-connector, crm, ctm, insiders, ir, jobs, mining, real-estate | `pm2/ecosystem.config.js` |
| `app-platform` | platform + knowledge + infra utils | admin, dashboard, tenant, cms, imperialpedia, law-service, audit, developer, report, search | `pm2/platform.config.js` |
| `app-edge-realtime` | infra (BFF + realtime) | proxy-service, realtime (infra), realtime (platform), notification | `pm2/edge-realtime.config.js` |
| `app-payments` *(profile)* | commerce/finance (JVM) | financial-services-java | `Dockerfile.java` |

**Excluded by design:** `law-elite` (in-memory demo shell — decommission), `ml-service`
(Python; optional accelerator, OFF by default — Node falls back in-process).

## Folder structure

```
deploy/consolidated/
├── docker-compose.yml          # 6 Node apps + payments(profile) + redis + caddy
├── Dockerfile.node             # ONE image for all six Node apps (full Backend workspace)
├── Dockerfile.java             # financial-services-java (JVM payment service)
├── pnpm-workspace.docker.yaml  # Backend-only workspace view (keeps Frontend out of the image)
├── .env.example                # copy → .env (RDS endpoint + shared secrets)
├── caddy/
│   └── Caddyfile               # edge TLS + host/path routing → <app>:<port>
├── pm2/
│   ├── identity.config.js
│   ├── commerce.config.js
│   ├── trade.config.js
│   ├── ecosystem.config.js
│   ├── platform.config.js
│   └── edge-realtime.config.js
└── README.md

Backend/services/**             # UNCHANGED — the 45 modules, still independent
```

## Run

```bash
cp deploy/consolidated/.env.example deploy/consolidated/.env   # then fill RDS + secrets

# from the repo root:
docker compose --env-file deploy/consolidated/.env \
  -f deploy/consolidated/docker-compose.yml up -d --build

# include the JVM payment service:
docker compose --env-file deploy/consolidated/.env \
  -f deploy/consolidated/docker-compose.yml --profile payments up -d --build
```

The image builds once (`baalvion-backend:local`) and is reused by all six Node apps.

## Schema & migrations

Each service issues `CREATE SCHEMA IF NOT EXISTS <domain>` + `sequelize.sync({alter:false})`
on boot, so a fresh RDS database self-provisions schemas. The explicit SQL migrations
(auth `008a/008b`, order-execution `007`, phone-OTP `010`, etc.) still run as one-shot jobs —
mirror your `core-stack` `init-data.sh` / `tools` profile. RDS user needs `CREATE` on the DB.

## Memory budget (idle estimates)

| App | Modules | Σ idle | `mem_reservation` | `mem_limit` |
|---|---:|---:|---:|---:|
| app-identity | 5 | ~550 MB | 384m | 768m |
| app-commerce | 7 | ~880 MB | 640m | 1280m |
| app-trade | 6 | ~700 MB | 512m | 1024m |
| app-ecosystem | 10 | ~1105 MB | 768m | 1536m |
| app-platform | 10 | ~1125 MB | 768m | 1536m |
| app-edge-realtime | 4 | ~635 MB | 448m | 896m |
| app-payments (JVM) | 1 | ~600 MB | 512m | 768m |
| redis + caddy | — | ~140 MB | 96m | 320m |
| **Total (actual peak)** | **43** | **~6.0 GB** | **~4.1 GB** | (caps are ceilings) |

Fits an **8 GB** instance with headroom. `mem_limit` is a hard cap (not a reservation), so the
limit column summing above 8 GB is fine — actual usage is ~6 GB.

## Expected monthly AWS cost (ap-south-1)

| Item | Spec | On-demand | 1-yr Savings Plan |
|---|---|---:|---:|
| EC2 compute | t4g.large (2 vCPU / 8 GB, ARM) | ~$49 | ~$31 |
| EBS root | 50 GB gp3 | ~$4 | ~$4 |
| RDS PostgreSQL | db.t4g.small Single-AZ + 20 GB gp3 + backups | ~$28 | ~$22 (RI) |
| Redis | on-box container | $0 | $0 |
| ECR + egress | images + low traffic | ~$5 | ~$5 |
| **Total** | | **~$85/mo** | **~$62/mo** |

Headroom option: **t4g.xlarge (4 vCPU / 16 GB)** for ~$49 more on-demand if CPU across 42
processes + the JVM gets tight. The big cost lever — collapsing the Node apps into a single
process (shared runtime, ~2 GB) — would drop you to a t4g.small (~$30 all-in) but requires
guarding each module's `start()` behind `require.main === module`; deferred to protect the
"no changes" guarantee.

## Migration path to ECS (later)

This compose file is written to translate cleanly:

- **One image, N task defs.** Each `app-*` service → one ECS service; the `command:`
  (pm2 ecosystem file) is the only per-task difference. Or split to one-process-per-task later.
- **`mem_limit` / `mem_reservation`** → task `memory` / `memoryReservation` 1:1.
- **`healthcheck`** → ECS container healthCheck (same `node -e` probe).
- **RDS is already external** — no change. **Redis** → ElastiCache (swap `REDIS_HOST`).
- **Caddy** → ALB + ACM (host/path rules mirror the Caddyfile). **`.env`** → SSM Parameter
  Store / Secrets Manager.
- **`depends_on`** → ECS service dependencies / startup ordering.

Convert with `docker compose convert` for inspection, or author task defs from the table above.

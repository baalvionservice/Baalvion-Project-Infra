# 04 · Deployment Guide

Operate the consolidated backend with Docker Compose on a single EC2 host + AWS RDS.

## Artifacts

```
deploy/consolidated/
├── docker-compose.yml          # 6 Node apps + payments(profile) + redis + caddy
├── Dockerfile.node             # ONE image for all six Node apps (full Backend workspace)
├── Dockerfile.java             # financial-services-java (JVM payment service)
├── pnpm-workspace.docker.yaml  # Backend-only workspace view (keeps Frontend out of the image)
├── .env.example                # copy → .env (RDS endpoint + shared secrets)
├── caddy/Caddyfile             # edge TLS + host/path routing → <app>:<port>
├── pm2/
│   ├── identity.config.js   commerce.config.js   trade.config.js
│   └── ecosystem.config.js  platform.config.js   edge-realtime.config.js
└── README.md                   # quick-start (points here)
```

`Backend/services/**` is unchanged — the 45 modules, still independent.

## Prerequisites

- An EC2 host (ARM/Graviton recommended) with Docker + Compose v2. See
  [05 · Capacity & Cost](05-capacity-and-cost.md) for sizing (**t4g.large / 8 GB**).
- An **RDS PostgreSQL** instance reachable from the host; security group allows 5432 from the host.
- The RDS app user has `CREATE` on the database (services auto-create their schemas on boot).
- DNS A-records for the public hostnames in the Caddyfile (so Caddy can issue TLS certs).
- A repo-root `.dockerignore` excluding `node_modules`, `**/node_modules`, `Frontend`, `.git`,
  `.turbo` (keeps the build context small; a clean checkout already omits `node_modules`).

## The image model

One image (`baalvion-backend:local`) is built once and reused by all six Node apps. The only
difference between app containers is the pm2 ecosystem file passed via `command:`. This means:

- **Build once, run six personalities** — fast rebuilds, one artifact to scan/sign/promote.
- **A container runs only its members** — pm2 starts just the processes in its ecosystem file, so
  `app-identity` never loads commerce code into memory.

## Environment

Copy and fill the env file (variable names match `deploy/core-stack`, so service `appConfig`
reads them unchanged):

```bash
cp deploy/consolidated/.env.example deploy/consolidated/.env
```

Key variables:

| Variable | Purpose |
|---|---|
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | RDS connection |
| `DB_SSL=true` | RDS requires TLS |
| `DB_JDBC_PARAMS=?sslmode=require` | Java payment service TLS |
| `REDIS_HOST=redis` / `REDIS_PORT=6379` | on-box Redis container |
| `GATEWAY_SIGNING_SECRET`, `INTERNAL_SERVICE_SECRET` | trust-boundary secrets |
| `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH` | auth-service RS256 keypair |
| `CORS_ORIGINS` | allowed browser origins |

> **The one integration task:** a few services read bespoke vars (`ml-service` `MODEL_DIR`,
> `search-service` `OPENSEARCH_URL`, `network-graph` `NEO4J_URI`, provider keys for
> commerce/ctm/payment/notification). Grep each domain's `config/appConfig.js` and add any extras
> to `.env`. **No service code changes** — only env mapping.

## Run

```bash
# from the REPO ROOT
docker compose --env-file deploy/consolidated/.env \
  -f deploy/consolidated/docker-compose.yml up -d --build

# include the JVM payment service:
docker compose --env-file deploy/consolidated/.env \
  -f deploy/consolidated/docker-compose.yml --profile payments up -d --build
```

Useful operations:

```bash
# tail one app's processes
docker exec -it consolidated-app-ecosystem-1 pm2 logs
# live per-process RAM/CPU (ground-truth for the estimates in doc 02/05)
docker exec -it consolidated-app-ecosystem-1 pm2 jlist
# restart a single module without touching siblings
docker exec -it consolidated-app-ecosystem-1 pm2 restart jobs-service
```

## Schema & migrations

- On boot each service issues `CREATE SCHEMA IF NOT EXISTS <domain>` +
  `sequelize.sync({ alter:false })`, so a fresh RDS database self-provisions its schemas.
- The **explicit SQL migrations** (auth `008a/008b`, order-execution `007`, phone-OTP `010`, etc.)
  still run as one-shot jobs — mirror `deploy/core-stack/init-data.sh` / its `tools` profile.
- Schema changes are owned by SQL migrations, never auto-alter (auth-service refuses
  `sync({alter:true})` by design).

## Health & routing

- **Healthchecks** — each app container probes one representative member's `/health` with a
  dependency-free `node -e` http GET (no curl needed in the image).
- **Edge routing** — only Caddy binds 80/443; it routes public hostnames/paths to `<app>:<port>`
  and auto-upgrades websockets. Internal service-to-service calls bypass Caddy and use Docker DNS
  (e.g. `http://app-commerce:3013`) exactly as before.

## Validation performed

- `docker compose --env-file … config` → **exit 0** (YAML anchors + merge keys expand; every app
  receives the RDS `DB_HOST` and `REDIS_HOST`).
- All six pm2 ecosystem files → **`node --check` clean**.

➡ Next: [05 · Capacity & Cost](05-capacity-and-cost.md)

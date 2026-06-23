# Production Deployment Package — Consolidated Backend

This folder is the **production deployment package** for the Baalvion consolidated
backend (45 repo modules → **6 Node app containers + 1 JVM app = 43 deployables**),
targeting a single AWS EC2 host + RDS, with a documented path to ECS/HA.

It builds on the local validation completed 2026-06-23 (all 43 deployables brought up
under Docker, full auth/CMS/payment/email flows exercised end-to-end). Numbers here are
anchored on the **measured ~4.0 GiB idle footprint**, not estimates.

> Companion artifacts live in [`deploy/consolidated/`](../../../deploy/consolidated/):
> `docker-compose.prod.yml`, `.env.production.example`, the 6 `pm2/*.config.js`, and
> `caddy/Caddyfile`. The general reference set is [`docs/deployment/`](../README.md) (00–06).

## Contents

| # | Doc | Deliverables |
|---|---|---|
| 01 | [Architecture, grouping & dependencies](01-architecture-and-grouping.md) | production architecture diagram · 43-deployable grouping · container dependency map |
| 02 | [AWS resources & image inventory](02-aws-resources-and-images.md) | required AWS resources · Docker image inventory |
| 03 | [Sizing & cost](03-sizing-and-cost.md) | per-container CPU/mem · EC2 sizing (4 GB measured) · cost @ current/10x/100x |
| 04 | [Environment & secrets](04-environment-and-secrets.md) | environment variable inventory · secrets inventory |
| 05 | [Runbooks](05-runbooks.md) | deployment · rollback · backup & recovery |
| 06 | [Monitoring & alerting](06-monitoring-and-alerting.md) | metrics, logs, alarms, dashboards |
| 07 | [Risks & readiness](07-risks-and-readiness.md) | risks found in testing · production readiness checklist |
| 08 | [Service dependency map](08-service-dependency-map.md) | cross-container call edges + container-DNS env |
| 09 | [Final deployment checklist](09-final-deployment-checklist.md) | authoritative pre-deploy gate |

The production compose is [`deploy/consolidated/docker-compose.prod.yml`](../../../deploy/consolidated/docker-compose.prod.yml) (deliverable 8).

---

## ⚠ Dry-run → production exclusions (do NOT carry these into prod)

The local validation used throwaway scaffolding. **None of the following may reach production.**

| Dry-run artifact | Why it exists locally | Production replacement |
|---|---|---|
| `docker-compose.dryrun.yml` (throwaway Postgres) | no RDS locally | **RDS PostgreSQL** (`DB_HOST`, `DB_SSL=true`); never run the dryrun overlay in prod |
| **Mailpit** SMTP container | catch dev mail | **Amazon SES** (`email-smtp.<region>.amazonaws.com:587`) |
| **Self-signed SMTP cert** (`dryrun-keys/smtp_*.pem`) | give Mailpit STARTTLS | SES's real, publicly-trusted cert — delete the self-signed files |
| **`NODE_TLS_REJECT_UNAUTHORIZED=0`** | accept the self-signed cert | **REMOVE entirely** — it disables all TLS verification (critical risk) |
| **Dev JWT keypair** (`dryrun-keys/jwt_*.pem`, `JWT_*_B64` in `.env`) | local signing | fresh RS256 keypair from KMS/Secrets Manager; rotate |
| **Test superadmin** `superadmin@baalvion.com` / `BaalvionDryRun!2026` | local login | bootstrap a real admin with a strong password, then rotate; never ship the dev password |
| **`PSP_MOCK=true`** | mock payments | `PSP_MOCK=false` + real provider keys |
| **Seeded demo content** (17 demo websites, 26 about-baalvion items via `registerProductionWebsites.cjs` / `seedAboutBaalvion.cjs`) | exercise CMS reads | seed only the **real** websites; do not load demo/editorial fixtures |
| **Dev secrets in `.env`** (the round-2 hex secrets) | local convenience | unique values from Secrets Manager, all ≥32 chars, rotated |
| `MP_SMTP_AUTH_ACCEPT_ANY` / `MP_SMTP_AUTH_ALLOW_INSECURE` | Mailpit accepts dev creds | n/a — SES enforces real SMTP auth |

Production uses [`.env.production.example`](../../../deploy/consolidated/.env.production.example) (which omits all of the above) and `docker-compose.prod.yml` (which has **no** Mailpit/throwaway-Postgres and **does** add Neo4j + Kafka).

## Quick start (once AWS resources exist)

```bash
# 1. Pull secrets → .env (SSM/Secrets Manager), then from the repo root:
docker compose --env-file deploy/consolidated/.env \
  -f deploy/consolidated/docker-compose.prod.yml --profile payments up -d

# 2. One-shot migrations/seed (see 05-runbooks.md §Deploy step 5)
# 3. Smoke (see 05-runbooks.md §Post-deploy verification)
```

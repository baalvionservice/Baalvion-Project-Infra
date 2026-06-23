# 05 · Runbooks — Deploy · Rollback · Backup & Recovery

Commands assume the repo root on the host and a `.env` already materialised from
Secrets Manager. `COMPOSE` below is shorthand for:

```bash
COMPOSE="docker compose --env-file deploy/consolidated/.env -f deploy/consolidated/docker-compose.prod.yml --profile payments"
```

## 11. Deployment runbook

**Pre-flight**
1. AWS resources exist (EC2, RDS Multi-AZ, ECR, Route 53, SES out of sandbox, S3, SSM). DNS A/ALIAS records resolve (required before Caddy issues TLS).
2. CI built & pushed `baalvion-backend:prod-<sha>` and `baalvion-payments:prod-<sha>` (`linux/amd64`) to ECR.
3. Secrets present in Secrets Manager; **`JWT_PUBLIC_KEY` is the inlined PEM** (not a path — see risk R1).
4. Take a **manual RDS snapshot** (`aws rds create-db-snapshot`) before any schema change.

**Deploy**
```bash
# 1. Materialise .env from SSM/Secrets Manager (deploy tooling), pin IMAGE_TAG=prod-<sha>
# 2. Pull + start backing services first, wait healthy
$COMPOSE up -d redis neo4j zookeeper kafka
$COMPOSE ps           # redis/neo4j/kafka = healthy

# 3. Start the apps
$COMPOSE up -d app-identity app-commerce app-trade app-ecosystem app-platform app-edge-realtime app-payments
$COMPOSE ps           # 6 node apps healthy; app-payments running
```

**Step 5 — one-shot migrations & seed** (idempotent; run once per fresh DB)
```bash
# auth: superadmin (only if none exists). Reads SUPERADMIN_EMAIL/PASSWORD + DB_* from env.
docker exec consolidated-app-identity-1 \
  sh -c 'cd /app/Backend/services/identity/auth-service && node scripts/bootstrapSuperAdmin.js'

# cms: create schema tables (sequelize-cli, tracked/idempotent)
docker exec consolidated-app-platform-1 \
  sh -c 'cd /app/Backend/services/knowledge/cms-service && ./node_modules/.bin/sequelize-cli db:migrate'

# cms: register the REAL websites only (NOT the demo/editorial seeders)
docker exec -e CMS_ORG_ID=<superadmin-org> -e CMS_CREATED_BY=<superadmin-id> consolidated-app-platform-1 \
  sh -c 'cd /app/Backend/services/knowledge/cms-service && node scripts/registerProductionWebsites.cjs'

# payments JVM PREREQUISITE (found in cold-start validation, see R12): the Flyway migrations need
#   a `postgres` schema-owner role (V001, unguarded → crash-loops if absent) and a `baalvion_app`
#   runtime DML role (V008+). Run the idempotent bootstrap ONCE, as the RDS MASTER, before
#   app-payments migrates (sets the postgres role + membership + the non-superuser app role):
psql "host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=$DB_MASTER_USER" \
  -f deploy/consolidated/sql/payments-bootstrap.sql
#   Then set baalvion_app's password from Secrets Manager:
#   psql ... -c "ALTER ROLE baalvion_app PASSWORD '<secret>';"
# Then the payments JVM Flyway runs automatically on boot. Other domains: Sequelize sync on boot.
```
> Auth's 13 SQL migrations are **not** required (boot-time sync provisions `auth.*`). Do **not**
> run `seedAboutBaalvion.cjs` or other demo-content seeders in production.
> **Order matters for payments:** create the `postgres` role *before* the JVM starts, or start
> `app-payments` only after the role exists (otherwise it restart-loops on Flyway V001).

**Step 6 — post-deploy verification (smoke)**
```bash
# health: all 6 node apps healthy + JVM actuator UP
$COMPOSE ps
docker exec consolidated-app-platform-1 node -e 'require("http").get({host:"app-payments",port:3015,path:"/actuator/health"},r=>{let b="";r.on("data",c=>b+=c);r.on("end",()=>console.log(r.statusCode,b))})'
# auth login (200 + token) · CMS public (200) · payment GET (200) · send 1 SES email → confirm receipt
```
Acceptance: 6/6 healthy + JVM UP; auth login 200; CMS public 200; payment `GET /api/v1/payments` 200;
SES test email delivered. Confirm Caddy issued certs for every host (`docker logs consolidated-caddy-1 | grep certificate`).

## 12. Rollback runbook

**Decision tree**
- **App-only regression** (bug, crash, perf) → roll the image tag back (fast, no data loss).
- **Bad/incompatible migration** → restore the DB (slow; data-loss window since the pre-deploy snapshot).

**App rollback (image tag — preferred, ~2 min)**
```bash
# set IMAGE_TAG to the previous good sha (that's why we tag by sha, not only prod-latest)
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=prod-<previous-sha>/' deploy/consolidated/.env
$COMPOSE up -d            # re-pulls the prior image, recreates containers
$COMPOSE ps               # re-run the smoke checks
```

**Database rollback (only if a migration broke the schema)**
- Migrations are **forward-only**; cms `db:migrate:undo` exists but prefer restore for safety.
- Restore the **pre-deploy manual snapshot** or use **PITR** to a timestamp just before deploy:
  `aws rds restore-db-instance-to-point-in-time …` → repoint `DB_HOST` → `up -d`.
- Communicate the RPO (data written after the snapshot is lost). Prefer roll-forward fixes when possible.

**After any rollback:** re-run the smoke suite; record the incident; open a fix-forward ticket.

## 13. Backup & recovery plan

| Asset | Backup | RPO | RTO | Recovery |
|---|---|---|---|---|
| **RDS PostgreSQL** | automated backups + **PITR** (retain 14–35d) + **manual snapshot pre-deploy** | ≤5 min (PITR) | 10–30 min | restore snapshot/PITR → repoint `DB_HOST` |
| **Neo4j** (on-box) | nightly `neo4j-admin database dump` → S3 + EBS volume snapshot | 24h | 15–30 min | restore dump into a fresh volume |
| **Redis** (on-box) | AOF on the volume; **treated as ephemeral** (queues/sessions/cache) | n/a (rebuildable) | minutes | accept loss; sessions re-auth, jobs re-enqueue |
| **Kafka** (on-box) | **ephemeral** event bus; topics auto-create | n/a | minutes | accept loss; payment outbox in RDS is the source of truth |
| **S3 media** | bucket **versioning** (+ optional cross-region replication) | ~0 | immediate | restore prior version |
| **Secrets** | durable in Secrets Manager (versioned) | 0 | immediate | n/a |
| **Config/IaC** | `docker-compose.prod.yml`, `.env.production.example`, pm2 configs, Caddyfile in **git** | 0 | minutes | re-clone |
| **Whole host** | golden AMI + the above | n/a | 20–40 min | launch from AMI, materialise `.env`, `up -d`, smoke |

**Targets:** RTO ≤ 30 min (host or DB), RPO ≤ 5 min for transactional data (RDS PITR). Test a
restore quarterly. The only durable state is **RDS** (+ S3 media + Neo4j graph); everything else is
rebuildable, which is what makes the single-host model recoverable.

➡ Next: [06 · Monitoring & alerting](06-monitoring-and-alerting.md)

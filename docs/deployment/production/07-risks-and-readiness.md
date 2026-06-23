# 07 · Risks & Production Readiness

## 16. Risks discovered during local testing

Severity: 🔴 critical · 🟠 high · 🟡 medium · ⚪ low. All were found while bringing the full
stack up locally and driving auth/CMS/payment/email end-to-end.

### 🔴 R1 — `JWT_PUBLIC_KEY` as a file path breaks ALL authenticated cross-service calls
Fleet consumers do `requireEnv('JWT_PUBLIC_KEY').replace(/\n/g,'\n')` and pass the **value as the
key**. A path (`/run/keys/jwt_pub.pem`) → `secretOrPublicKey must be an asymmetric key when using
RS256` → **401 on every token-verifying request** (latent until the first cross-service authed
call). The committed `.env.example` even ships `JWT_PUBLIC_KEY_PATH=…`, which consumers never read.
- **Mitigation (no code change):** set `JWT_PUBLIC_KEY` to the **PEM itself** as a single-line
  `\n`-escaped string. Verified locally (login + CMS writes then worked).
- **Recommended follow-up (code, separate PR):** make the auth-node key loader accept a path/B64
  and fix `.env.example`. Until then, R1 is a deploy-time config trap — **gate the deploy on it**.

### 🟠 R2 — Mailer mandates STARTTLS; only a TLS-valid SMTP works
`emailService` hardcodes `requireTLS` for any non-465 port. MailHog (no STARTTLS) fails
`500 Unrecognised command (ETLS)`.
- **Production:** use **Amazon SES** (587 STARTTLS, publicly-trusted cert) — works unchanged.
- **Forbidden in prod:** the dry-run workaround (Mailpit + self-signed cert +
  `NODE_TLS_REJECT_UNAUTHORIZED=0`). That env var disables **all** TLS verification fleet-wide.

### 🟠 R3 — `network-graph-service` hard-exits without Neo4j
Calls `verifyConnectivity()` then `process.exit(1)` → app-trade crash-loops with no Neo4j.
- **Mitigation:** Neo4j is included in `docker-compose.prod.yml` and marked a boot dependency.

### 🟠 R4 — `app-identity` ran at 94% of its memory cap
Measured 723/768 MiB idle — a login burst could trip `max_memory_restart`.
- **Mitigation (config):** `mem_limit` raised to **1024m** in the prod compose. Monitor under load.

### 🟡 R5 — Payment JVM needs Kafka
Without a broker the JVM works for DB/outbox but logs continuous `localhost:9092` reconnect noise;
event-driven payment flows won't fan out.
- **Mitigation:** Kafka+Zookeeper added under the `payments` profile; → **MSK** at scale.

### 🟡 R6 — Search degrades without OpenSearch/Elasticsearch
`search-service` returns 503 (degraded) and `jobs-service` falls back to Postgres search.
- **Decision:** provision OpenSearch if search must be first-class; otherwise accept degraded and
  silence the false alarm (see [06](06-monitoring-and-alerting.md)).

### 🟡 R7 — 6.6 GB Node image
Slow ECR pulls and slow rollbacks; inflates EBS.
- **Mitigation:** multi-stage `--prod` install + cache pruning (no code change); tag by git sha.

### 🟡 R8 — Single-host SPOF
One EC2 hosts everything (only RDS is HA). Host loss = full outage until AMI restore (~20–40 min).
- **Mitigation/path:** acceptable for MVP; migrate hot services to ECS (one image, N task defs) for
  HA — see [docs/deployment/06-ecs-migration.md](../06-ecs-migration.md).

### 🟡 R9 — `APP_SECURITY_ENABLED=false` relies on the Caddy edge
The JVM's own security is off; protection comes from Caddy denying sensitive paths. If the Caddyfile
edge rules are missing/incomplete, payment internals are exposed.
- **Mitigation:** verify the edge-deny rules before exposing the JVM; consider enabling JVM security.

### ⚪ R10 — Fresh DB needs explicit migration/seed one-shots
`sync`-based services self-provision, but cms (12 migrations) + the superadmin seed must run. CMS
writes need a website-scoped role; the superadmin bypasses via `super_admin`.
- **Mitigation:** the deploy runbook step 5 codifies this.

### 🟠 R12 — Payment JVM Flyway hard-codes the `postgres` role (cold-start blocker)
Found during cold-start validation. `payment-service` migration `V001__create_transactions_table.sql:4`
runs `ALTER SCHEMA payments OWNER TO postgres`. On a DB whose app user is **not** `postgres`
(the dry-run uses `baalvion`; `.env.production.example` uses `baalvion_app`), the `postgres` role
doesn't exist → Flyway fails → Spring context fails → **the JVM container crash-loops** and `payments`
has 0 tables. The warm stack masked this because `payments` was migrated in a prior session.
- **Mitigation (no migration change):** create the role once before the JVM migrates —
  `CREATE ROLE postgres;` (idempotent; RDS-compatible — no SUPERUSER needed for ownership). Added to
  the deploy runbook ([05 §step 5](05-runbooks.md)). Verified: after creating the role + restarting
  app-payments, Flyway applied all 10 migrations, JVM came UP in ~15 s, and `POST /initiate` → 201.
- **Recommended follow-up (code, separate PR):** make V001 use `CURRENT_USER`/a configurable owner so
  the migration is portable without a bootstrap role.

### ⚪ R11 — Payment API integration quirks (for integrators)
`initiate` requires `idempotencyKey` in the **body** (validated before the header fallback);
`paymentScheme ∈ {NIP, VISA, MASTERCARD, INTERSWITCH, WALLET, INTERNAL, ESCROW}`; tenant via
`X-Tenant-ID`. Documented so client teams don't rediscover via 422/400.

## 17. Production readiness checklist

**Security & secrets**
- [ ] **R1:** `JWT_PUBLIC_KEY` set to the inlined PEM (not a path) — verify a cross-service authed call returns 200, not 401.
- [ ] `NODE_TLS_REJECT_UNAUTHORIZED=0` **absent** from prod `.env`.
- [ ] All `[SECRET]`s sourced from Secrets Manager, ≥32 chars, none in git/images/compose.
- [ ] Fresh RS256 keypair (not the dry-run dev keys); rotation scheduled.
- [ ] `SUPERADMIN_PASSWORD` strong + rotated after first bootstrap (not `BaalvionDryRun!2026`).
- [ ] `PSP_MOCK=false`; real payment provider keys loaded.
- [ ] Security groups least-privilege (RDS 5432 from EC2 SG only; SSH via SSM, not open 22).
- [ ] R9: Caddy edge-deny rules for JVM sensitive paths verified.

**Data & migrations**
- [ ] RDS Multi-AZ; app user has `CREATE`; `DB_SSL=true`.
- [ ] Pre-deploy manual RDS snapshot taken.
- [ ] cms `db:migrate` run; superadmin bootstrapped; **only real** websites registered (no demo seeders).
- [ ] Neo4j provisioned + reachable; `payments` Flyway applied on boot.
- [ ] **R12:** `postgres` role exists in the DB *before* `app-payments` starts (else JVM crash-loops).

**Infra & images**
- [ ] Images built `linux/amd64`, pushed to ECR, **tagged by git sha**.
- [ ] `docker-compose.prod.yml` used (not the dryrun overlay); Neo4j + Kafka present.
- [ ] DNS resolves; Caddy issued TLS for every host.
- [ ] EBS sized for the 6.6 GB image + volumes; ECR lifecycle policy set.

**Observability**
- [ ] CloudWatch logs (`/baalvion/consolidated`) + retention; error metric filters.
- [ ] Alarms wired (host, RDS, edge 5xx, queues, JVM, cert expiry, SES bounces) → SNS.
- [ ] External synthetic checks on auth/api/admin.
- [ ] `search-service` 503 alarm suppressed unless OpenSearch is provisioned (R6).

**Deploy & recovery**
- [ ] Deploy + rollback runbooks rehearsed; rollback = image-tag change verified.
- [ ] Backup/restore tested (RDS PITR, Neo4j dump); RTO ≤30 min / RPO ≤5 min confirmed.
- [ ] Post-deploy smoke suite green (6/6 healthy + JVM UP, auth/CMS/payment/SES email).

**Known accepted risks (sign-off)**
- [ ] Single-host SPOF (R8) accepted for MVP, with ECS HA path documented.
- [ ] Search degraded mode (R6) accepted, or OpenSearch provisioned.
- [ ] 6.6 GB image (R7) accepted for first deploy, optimization ticketed.

---

**Verdict:** the stack is functionally validated end-to-end locally. **R1 and R2 are
deploy-blocking config traps** — both have config-only mitigations captured here. With the
checklist satisfied, the package is ready for a staged production rollout.

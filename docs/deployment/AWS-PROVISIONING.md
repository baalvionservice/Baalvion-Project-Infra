# AWS Provisioning Checklist — Baalvion Consolidated Backend

The **ordered, dependency-aware "do this, in this order"** companion to
[DEPLOYMENT.md](DEPLOYMENT.md). DEPLOYMENT.md is the authoritative reference for *what* each resource
is and *why* ([§7 · AWS resources](DEPLOYMENT.md#7-aws-resources--image-inventory),
[§9 · Environment & secrets](DEPLOYMENT.md#9-environment--secrets),
[§11 · Runbooks](DEPLOYMENT.md#11-runbooks--deploy--rollback--backup),
[§14 · Pre-deploy checklist](DEPLOYMENT.md#14-final-pre-deploy-checklist)); this doc sequences the
provisioning so each step's prerequisites already exist, and surfaces the two **deploy-blocking config
traps** (R1, R12) at the point they bite.

> **Target (finalized — DEPLOYMENT.md [§8](DEPLOYMENT.md#8-sizing--cost)):** region `ap-south-1`,
> **x86_64 / `linux/amd64`** (**not** ARM/Graviton — deferred), one EC2 host + managed RDS. All figures
> here mirror DEPLOYMENT.md; it remains the single source of truth for sizing and cost.

---

## Phase 0 — Identity & access (first; no dependencies)

- [ ] **IAM CI deploy role** (GitHub **OIDC**, no long-lived keys) — push to ECR + SSM/SSH to the host.
- [ ] **IAM EC2 instance role** — least-privilege: `ecr:GetAuthorizationToken` + pull, `ssm:GetParameter*`
      (SecureString), `s3:*` scoped to the media bucket, `ses:SendRawEmail`, CloudWatch logs/metrics.
- [ ] Confirm **no root / long-lived access keys** ever land on the box — instance role only.

## Phase 1 — Network

- [ ] **VPC** — one public subnet (EC2 + EIP) + **two private subnets across two AZs** (RDS Multi-AZ).
- [ ] **Security groups:**
  - EC2 SG — inbound `443` / `80` from `0.0.0.0/0`; `22` **only** via SSM/admin (prefer **SSM Session
    Manager**; leave port 22 closed).
  - RDS SG — inbound `5432` **from the EC2 SG only**.
- [ ] **Elastic IP** allocated (stable ingress for Route 53).

## Phase 2 — Data tier

- [ ] **RDS PostgreSQL** — `db.t3.small`, 20 GB gp3, **Multi-AZ** for prod, `DB_SSL=true`, automated
      backups + PITR enabled. App user needs `CREATE` (one DB, schema per domain).
- [ ] 🔴 **R12 trap (cold-start blocker).** The payments JVM's Flyway `V001` hard-codes a `postgres`
      role owner. **Before the JVM ever starts**, run
      [`deploy/consolidated/sql/payments-bootstrap.sql`](../../deploy/consolidated/sql/payments-bootstrap.sql)
      **as the RDS master**, then set `baalvion_app`'s password from Secrets Manager. Skip it → the JVM
      crash-loops with zero `payments` tables.
- [ ] Take a **manual RDS snapshot** before any deploy or migration.
- [ ] On-box (compose) at MVP: **Redis 7**; **Neo4j 5** (**mandatory** if `app-trade` runs —
      `network-graph-service` hard-exits without it); **Kafka + ZooKeeper** (only under
      `--profile payments`). → ElastiCache / MSK / Neo4j Aura at scale.

## Phase 3 — Registry & images

- [ ] **Two ECR repos:** `baalvion-backend`, `baalvion-payments` (+ lifecycle policy to expire old tags).
- [ ] CI builds & pushes **`linux/amd64`** images tagged by **git sha** (`prod-<sha>`), not only
      `prod-latest`, so rollback is a tag change. ⚠️ ~6.6 GB Node image (R7) → size EBS accordingly.

## Phase 4 — Compute

- [ ] **EC2 `t3.large`** (2 vCPU / 8 GB, x86_64), **50 GB gp3** root, instance role attached, EIP
      associated. (~4.0 GiB idle, ~6 GiB peak → fits 8 GB with margin; step to `t3.xlarge` only if CPU
      credits exhaust.)
- [ ] Docker + Compose installed; image pulls use the **instance role** (no keys on the box).

## Phase 5 — Storage · email · DNS/TLS

- [ ] **S3** `baalvion-prod-media` (versioned) — accessed via the **instance role**, not keys.
- [ ] **SES** — verified domain, **out of sandbox**, SPF/DKIM/DMARC, SMTP creds (port `587` STARTTLS).
      *(These are SES **SMTP** credentials, not IAM keys.)*
- [ ] **Route 53** — hosted zone + A/ALIAS for `*.baalvion.com` → EIP. **Must resolve before** Caddy can
      issue TLS via ACME. Caddy terminates TLS on-box (use ACM only if you front with an ALB).

## Phase 6 — Secrets (SSM SecureString / Secrets Manager — injected at deploy, never committed)

- [ ] Populate every `[SECRET]` from [DEPLOYMENT.md §9](DEPLOYMENT.md#9-environment--secrets) (all
      ≥ 32 chars): `DB_PASSWORD`, `NEO4J_PASSWORD`, `JWT_PRIVATE_KEY_B64`, `JWT_ACCESS_SECRET`,
      `JWT_REFRESH_SECRET`, `GATEWAY_SIGNING_SECRET`, `INTERNAL_SERVICE_SECRET`, `INVENTORY_INTERNAL_KEY`,
      `BILLING_SIGNING_SECRET`, `RBAC_INTERNAL_API_KEY`, `AUDIT_INTERNAL_KEY`, `CART_SESSION_SECRET`,
      `METRICS_SECRET`, `CMS_SECRETS_KEY`, `PROVIDER_SECRET_KEY`, `FINANCE_WEBHOOK_SECRET`, `SMTP_USER`,
      `SMTP_PASS`, the payment-provider keys, and `SUPERADMIN_PASSWORD` (rotate immediately after first
      use).
- [ ] 🔴 **R1 trap (auth-wide 401).** Set **`JWT_PUBLIC_KEY` to the inlined PEM** (single-line,
      `\n`-escaped) — **not** a file path. A path → `secretOrPublicKey must be an asymmetric key` →
      **401 on every authenticated cross-service call** (latent until the first authed call). **Verify a
      cross-service authed call returns 200, not 401** before sign-off.
- [ ] Confirm **no dry-run config** reaches prod
      ([§16](DEPLOYMENT.md#16-dry-run--production-exclusions)): no `NODE_TLS_REJECT_UNAUTHORIZED=0`,
      `PSP_MOCK=false`, no Mailpit / self-signed certs, no demo seeders, `DEPLOY_PROFILE ≠ dryrun`. The
      container `preflight-env.js` hard-fails on these.

## Phase 7 — Deploy & verify ([DEPLOYMENT.md §11](DEPLOYMENT.md#11-runbooks--deploy--rollback--backup))

- [ ] Materialize `.env` from SSM; pin `IMAGE_TAG=prod-<sha>`.
- [ ] Bring up backing services first (`redis neo4j` [+ `kafka` if payments]), wait healthy → then the
      six Node apps + `app-payments`.
- [ ] One-shot, idempotent (once per fresh DB): superadmin bootstrap; cms `db:migrate`; register
      **only the real** websites (no demo/editorial seeders). *(Payments role bootstrap already done in
      Phase 2.)*
- [ ] **Smoke gate:** 6/6 Node containers healthy + JVM actuator `UP`; auth login `200` (RS256); CMS
      public `200`; payment `POST /initiate` `201`; one SES email delivered; Caddy issued certs for every
      host.

## Phase 8 — Observability ([DEPLOYMENT.md §12](DEPLOYMENT.md#12-monitoring--alerting))

- [ ] CloudWatch log group `/baalvion/consolidated` + retention (30–90 d); alarms (host CPU/mem/disk;
      RDS connections/CPU/storage; edge 5xx / p95; BullMQ failures; JVM heap; Kafka lag; TLS expiry
      < 14 d; SES bounce/complaint); synthetic 1-min checks on `auth` / `api` / `admin`.

---

## Accepted-risk sign-offs (make these explicit before go-live)

- **Single-host SPOF** (R8) — accepted for MVP; ECS HA path is documented in
  [§15](DEPLOYMENT.md#15-ecs-migration-path).
- **Search degraded without OpenSearch** (R6) — provision OpenSearch or accept degraded + silence the
  false alarm.
- **6.6 GB Node image** (R7) — accepted; slim-down (multi-stage `--prod`) ticketed.
- **ARM/Graviton deferred** — x86_64 is the determined target (matches CI + every current ECR image).

## Minimum Viable Production Set (smaller first launch)

`app-identity` + `app-commerce` + `app-platform` + `app-edge-realtime` (4 of 6) + RDS, Redis, Caddy,
SES, S3. **Skips** `app-trade`, `app-ecosystem`, the `app-payments` JVM, Kafka, Neo4j, and OpenSearch —
consumer checkout runs on the Node gateway adapters. Footprint ~2.3–2.8 GiB idle. Full sizing in
[DEPLOYMENT.md §6](DEPLOYMENT.md#6-service-deployment-groups).

---

*Companion to [DEPLOYMENT.md](DEPLOYMENT.md) (the implementation runbook) and
[ARCHITECTURE.md](ARCHITECTURE.md) (design rationale). Provisioning as code (Terraform/CLI) can be
generated from this sequence.*

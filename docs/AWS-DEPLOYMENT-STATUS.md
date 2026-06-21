# Baalvion — AWS Deployment Status

> Snapshot as of **2026-06-21**. Single source of truth for what is **LIVE in AWS**, what is **merged but not yet rolled**, and what is **built but never deployed**.

---

## 1. TL;DR

| | |
|---|---|
| **Live environment** | One EC2 host running the **Core 3-service stack** (8 containers) |
| **Host** | `baalvion-prod-01` · `i-0efc2b04e7f2f582f` · **c7i-flex.large (8 GB)** · `ap-south-1` |
| **Public IP** | **Elastic IP `13.206.116.65`** |
| **AWS account** | BrotherHood — `869657603174` |
| **Deployed at** | ~2026-06-21 08:54 UTC |
| **Live services** | `auth-service`, `cms-service`, `payment-service` (+ Postgres, Redis, Kafka, Zookeeper, Caddy) |
| **Biggest pending item** | **PR #114** (6 more services) is **merged to `main`** but the production roll is **gated / not yet executed** |
| **Blocking go-public item** | **DNS A records → `13.206.116.65`** not set, so **no public HTTPS** yet (IP/SSH only) |

---

## 2. ✅ What is DEPLOYED in AWS right now

The **Core Stack** (`deploy/core-stack/`) is live on a single EC2 host via Docker Compose. Repo checked out at `/opt/baalvion-core` on branch `main`, config in `.env.production`.

### 2.1 Application services (LIVE)

| Service | Port | Role | State |
|---|---|---|---|
| **auth-service** | `3001` | Identity — mints RS256 access tokens + serves JWKS | ✅ healthy, DB has 10 tables + superadmin (`superadmin@baalvion.com`, id 1) |
| **cms-service** | `3011` | Content/admin data + per-tenant "Integrations & Keys" vault | ✅ healthy, 12 `cms.cms_*` tables |
| **payment-service** | `3015` | Java PSP gateway (Razorpay) — reads keys from CMS vault | ✅ up, Flyway self-migrated (`flyway_history_payment`) |

### 2.2 Infrastructure containers (LIVE)

| Container | Purpose |
|---|---|
| **postgres:16** | Shared DB — each domain owns an isolated schema |
| **redis:7** | Cache + event bus + BullMQ |
| **kafka** + **zookeeper** (Confluent 7.6.0) | Back payment-service's transactional outbox + saga listeners (`@EnableKafka`) |
| **caddy:2** | TLS edge — the **only** containers binding public ports `80`/`443`; everything else is internal to the compose network |

**Total: 8 containers up and healthy.**

### 2.3 Live configuration posture

- `PSP_MOCK=true` — payment-service runs in **mock mode** (deterministic ids, **no real Razorpay charges yet**).
- `APP_SECURITY_ENABLED=false` — the Java service surface is **locked at the Caddy edge** instead (only `/v1/gateway/payments` + `/v1/gateway/webhooks/*` exposed; `refund`, `capture`, `/api/*`, `/actuator/*`, and the CMS vault `/api/v1/internal/*` are denied).
- `DB_SSL=false` — in-network Postgres has no TLS (correct; DB is never publicly exposed). Flip to `true` when DB moves to RDS.
- RS256 keys are inline single-line (`\n`-escaped), generated on-box.

### 2.4 How it was deployed + how to reach it

- **CI/CD wired:** `.github/workflows/deploy-core-stack.yml` builds `core-*` images via **GitHub OIDC → ECR** (`baalvion/core-*` repos, tags `prod-latest`/`<sha>`), then a **roll job gated on `environment: production`** (required reviewer `baalvionservice`).
- **OIDC trust** fixed via AWS CloudShell (`aws iam update-assume-role-policy`) — the IAM console GUI save silently failed twice. Role: `arn:aws:iam::869657603174:role/baalvion-github-actions-deploy-role`.
- **SSH access (you):** `ssh -i C:\Users\AllenKrewzzz\.ssh\core_deploy_ci ubuntu@13.206.116.65`
- **Owner access (browser-only):** AWS CloudShell + SSM — `aws ssm start-session --target i-0efc2b04e7f2f582f`

---

## 3. 🟡 What is PENDING (merged but NOT yet running in AWS)

### 3.1 PR #114 — six additional services

**PR #114** (`feat/core-stack-platform-commerce` → `main`, commit `95fc3be7`) is **MERGED**. The code + compose definitions are in `main`, but these services are **not yet rolled onto the box**. They will deploy when the gated production roll is approved and the operator completes setup.

| Service | Port | Schema | Role | Notes |
|---|---|---|---|---|
| **rbac-service** | `3055` | `rbac` | Tenants / roles / policies | commerce + order call it fail-closed (`RBAC_FAIL_MODE=closed`) |
| **audit-service** | `3032` | `audit` | Immutable, hash-chained WORM audit trail | Consumes Redis event bus (`baalvion:events`) |
| **commerce-service** | `3012` | `commerce` | Catalog / pricing | RBAC-gated |
| **order-service** | `3013` | `orders` | Orders + checkout | ⚠️ **LIVE Razorpay, Node-direct** (`ALLOW_MOCK_PAYMENTS=false`) — real charges once keys set |
| **notification-service** | `3031` | _(no DB)_ | Email via SMTP/Resend, BullMQ | |
| **trade-service** | `3025` | `trade` | Trade / GTI backend | Boots standalone; authed routes need admin-profile gateway + Caddy route (not added) |

**8 GB safety design:** every container has a hard `mem_limit` **and** a matching heap cap (JVM `MaxRAMPercentage`/`KAFKA_HEAP_OPTS`, Node `--max-old-space-size`). Total ceilings ≈ **4.94 GB**, leaving ~3 GB headroom. `docker compose config` validates clean.

**All internal-only** — no new public Caddy routes this round.

### 3.2 Operator steps required to finish the PR #114 roll

1. **Set GitHub secrets `CORE_EC2_HOST` / `CORE_EC2_USER` / `CORE_EC2_SSH_KEY`** — until set, the CI roll job **skips** (it does not fail). The SSH key value = `C:\Users\AllenKrewzzz\.ssh\core_deploy_ci`.
2. **Approve the production roll** — the `environment: production` gate pauses for reviewer `baalvionservice`.
3. **Fill `/opt/baalvion-core/.env.production`** with the new secrets:
   - `RBAC_INTERNAL_API_KEY`, `AUDIT_INTERNAL_KEY`, `CART_SESSION_SECRET`
   - **LIVE `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`** (order-service is live-mode)
   - `SMTP_*` / `RESEND_API_KEY` (notifications)
   - optional: trade `GATEWAY_SIGNING_SECRET` / Firebase, `S3_*` for commerce media
4. **SSH in and run `init-extras.sh`** — chains the 5 idempotent migrations (rbac, audit, commerce, order, trade) on the live DB.
   - ⚠️ **Expected:** the first roll's health-gate goes **RED** — the new services crash-loop until their schemas exist. Run `init-extras.sh`, they heal, and every later roll is clean.

### 3.3 Known gap inside PR #114

- **inventory-service is NOT included.** `order-service` boots and serves `/readyz`, but **stock-lock / reservation calls fail at request time**. Deploy inventory-service to enable real inventory.
- **trade-service authenticated routes** need the admin-profile `auth-gateway` + a Caddy route — not added this round (the GTI web UI `gti-web` is also not included).

---

## 4. 🔴 Pending OPERATOR actions on the LIVE box (go-public blockers)

| # | Action | Why it matters | Owner |
|---|---|---|---|
| 1 | **Create DNS A records** `api.baalvion.com`, `cms.baalvion.com`, `admin.baalvion.com` → **`13.206.116.65`** | Caddy auto-issues TLS once DNS resolves (egress already verified). **Until done, there is no public HTTPS — access is IP/SSH only.** | Operator |
| 2 | **Delete root AWS access key `…VE7Z`** in the IAM console | Root keys are a standing security risk; box already moved to an instance role | Operator |

> Note: root AWS access keys that were sitting in the box's `~/.aws/credentials` have already been **removed** (replaced by the EC2 instance role `baalvion-ec2-ecr-pull-role` with `AmazonSSMManagedInstanceCore`).

---

## 5. ⚪ Built but NEVER deployed to AWS (deploy packages on disk)

These `deploy/*` slices are validated/build-verified but are **not running anywhere in AWS**. They are alternative or superseded deployment targets.

| Package | What it is | AWS status |
|---|---|---|
| `deploy/ec2-single-host` | Full **19-service** single-host stack | **DISARMED** — `EC2_*` secrets were **deleted** (pointed at the same box → would collide). Not deployed. |
| `deploy/about-baalvion-cms` | CMS public site stack (postgres+redis+auth+cms+caddy) | Smoke-verified locally. Not deployed. |
| `deploy/company-dashboard` | Company unified dashboard slice | Build-verified images. Not deployed. |
| `deploy/controlthemarket` | ControlTheMarket.com stack | Build-verified. **NO-GO** on last audit. Not deployed. |
| `deploy/amarise-maison-avenue` | Amarisé storefront slice | Built. Not deployed. |
| `deploy/proxy-baalvionstack` | Original proxy stack (blueprint for core-stack) | Local only. Not deployed. |
| `deploy/mvp-production` | MVP production slice | On disk. Not deployed. |

> The **single-host pipeline is intentionally disarmed** so the box stays **core-only**. Do not re-arm `EC2_*` while `CORE_EC2_*` targets the same host.

---

## 6. Quick reference — IDs & endpoints

```
AWS account ........ 869657603174 (BrotherHood)
Region ............. ap-south-1
Instance ........... i-0efc2b04e7f2f582f  (baalvion-prod-01, c7i-flex.large, 8 GB)
Elastic IP ......... 13.206.116.65
Deploy role ........ arn:aws:iam::869657603174:role/baalvion-github-actions-deploy-role
EC2 instance role .. baalvion-ec2-ecr-pull-role
ECR repos .......... baalvion/core-auth-service, core-cms-service, core-payment-service,
                     core-cms-tools  (+ core-rbac/audit/commerce/order/trade + tools after #114 roll)
Repo on box ........ /opt/baalvion-core  (branch main, .env.production)
SSH ................ ssh -i ~/.ssh/core_deploy_ci ubuntu@13.206.116.65
SSM ................ aws ssm start-session --target i-0efc2b04e7f2f582f
Superadmin ......... superadmin@baalvion.com  (random pw stored in .env.production)
```

---

## 7. Summary in one line

> **LIVE in AWS:** the 3-service Core stack (auth + cms + payment, mock payments) on one 8 GB EC2 box at `13.206.116.65`.
> **PENDING:** roll PR #114's 6 services (rbac/audit/commerce/order/notification/trade), then point DNS at the IP for public TLS.

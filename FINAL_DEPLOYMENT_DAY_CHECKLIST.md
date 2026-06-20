# Final Deployment-Day Checklist — Baalvion MVP (v1.0.0-mvp)

> ⚠️ **DEPRECATED — superseded by [MASTER_DEPLOYMENT_COMMANDS.md](MASTER_DEPLOYMENT_COMMANDS.md).**
> Legacy reference only. This day-of checklist covers **Stack A (MVP)**. For the full 3-stack
> go-live (18 ECR / 21 secrets / 3 zones, deploy order **A → C → B**) follow MASTER.
> Where this file disagrees with MASTER, **MASTER wins.**

> **One operator, one sitting.** Tick each box in order. Every box links to the detailed
> doc that explains it. Do not skip a gate. If a gate fails, stop, fix, re-verify — do
> not proceed on a red gate.
>
> **Release:** tag `v1.0.0-mvp` · commit `28761797` · branch `main` · region `ap-south-1`
> **Companion docs:** AWS_RESOURCE_CREATION_ORDER.md · AWS_SECRETS_CHECKLIST.md ·
> AWS_DEPLOYMENT_RUNBOOK.md · MVP_SMOKE_TEST_CHECKLIST.md
>
> **Fill in as you go:** Operator ____________ · Date ____________ · Start time ________

---

## Block A — Before you touch AWS (T-0)

- [ ] AWS CLI configured, region `ap-south-1`, deploy IAM creds verified (`aws sts get-caller-identity`).
- [ ] Repo cloned, `git checkout v1.0.0-mvp`, `git submodule update --init`.
- [ ] Docker + compose v2 on the build/deploy host (`docker compose version`).
- [ ] Razorpay **live** account KYC-approved; able to generate live keys + webhooks.
- [ ] Domain `baalvion.com` hosted zone exists in Route 53.
- [ ] This checklist + the 4 companion docs open and reviewed.

**Gate A:** all of the above ✅ before creating any resource.

---

## Block B — Provision infrastructure  *(AWS_RESOURCE_CREATION_ORDER.md)*

- [ ] **1. VPC** + 4 subnets (2 public, 2 private) + IGW + NAT + route tables.
- [ ] **2. Security groups** `sg-edge` (80/443 public), `sg-app` (from edge), `sg-data`
      (5432/6379 **from sg-app only**).
- [ ] **3. RDS PostgreSQL 16** `baalvion-prod`, private, encrypted, TLS forced, 7-day PITR.
      Wait `db-instance-available`.
- [ ] **4. ElastiCache Redis 7.1** `baalvion-prod`, transit encryption + auth-token,
      `maxmemory-policy=noeviction`.
- [ ] **5. S3** `baalvion-media-prod`, public-access blocked, SSE, CORS for the 3 origins.
- [ ] **6. SES** identities `baalvion.com` + `noreply@baalvion.com`; SMTP creds created;
      **production access requested**.
- [ ] **8. ECR** 13 repos created (`scanOnPush`).
- [ ] **9. EC2 host** in `sg-app` with IAM profile (Secrets Manager read + S3 + ECR pull) + EIP.

**Gate B:** RDS + Redis reachable from `sg-app`; `sg-data` not public; S3 locked down;
ECR ready. *(Route 53 records + SSL come after services are up — Blocks F/G.)*

---

## Block C — Secrets  *(AWS_SECRETS_CHECKLIST.md → Step 5)*

- [ ] RS256 keypair generated; `JWT_PRIVATE_KEY` (auth only) + `JWT_PUBLIC_KEY` (all) prepared.
- [ ] Symmetric/service secrets generated (`JWT_ACCESS/REFRESH`, `INTERNAL_SERVICE_SECRET`,
      `GATEWAY_SIGNING_SECRET`, `RBAC_INTERNAL_API_KEY`, `INVENTORY_INTERNAL_KEY`,
      `AUDIT_INTERNAL_KEY`, `CMS_SECRETS_KEY`, `CART_SESSION_SECRET`).
- [ ] DB passwords (`DB_PASSWORD`, `DB_APP_PASSWORD`) + `REDIS_PASSWORD` recorded.
- [ ] `SUPERADMIN_EMAIL/PASSWORD`, S3 keys (or IAM role), SES `SMTP_USER/PASS`,
      `RAZORPAY_*` live keys stored.
- [ ] All 14 `baalvion/*` secrets created in Secrets Manager.
- [ ] **Cross-checks:** `RBAC_INTERNAL_API_KEY` identical in rbac+commerce+order;
      `INVENTORY_INTERNAL_KEY` identical in inventory+order; `DB_*` match Block D's roles.

**Gate C:** the secrets pre-flight gate in AWS_SECRETS_CHECKLIST.md is fully ✅.

---

## Block D — Database roles  *(AWS_DEPLOYMENT_RUNBOOK.md → Step 6)*

- [ ] Run `init-roles.sql` against RDS as master with `-v baalvion_pw` + `-v baalvion_app_pw`.
- [ ] Confirm roles `baalvion` (owner) + `baalvion_app` (RLS runtime) exist (`\du`).

**Gate D:** `baalvion_app` exists **before** any service starts (payment-service Flyway
depends on it).

---

## Block E — Build, deploy backend, migrate  *(Runbook Steps 7–8)*

- [ ] Build + push 9 Node images + payment-service (Java) to ECR (context = monorepo root).
- [ ] `cp .env.production.example .env.production`; fill all values from Secrets Manager.
- [ ] `docker compose -f deploy/mvp-production/docker-compose.yml --env-file ... up -d`.
- [ ] Watch boot order: auth → rbac → audit → cms → commerce → inventory → order → payment.
- [ ] Migrations completed on boot (8 schemas; payment-service Flyway V001→V011).
- [ ] **Re-run `init-roles.sql`** to grant `baalvion_app` USAGE on the now-created schemas.
- [ ] Health gate — all 9 Node `/health`|`/readyz` + payment-service `/actuator/health` UP.

**Gate E:** every backend service healthy; no crash-loop; payment-service `{"status":"UP"}`.

---

## Block F — Frontends  *(Runbook Step 9)*

- [ ] Build + push `admin-platform`, `about-web`, `amarise-web` (NEXT_PUBLIC_* baked from
      compose build args).
- [ ] All three containers running under Caddy.

> `AMARISE_STORE_ID` + `AMARISE_MEDIA_HOST` are only known after seeding (Block I) →
> amarise-web is rebuilt once more after that.

**Gate F:** admin (3030), about-web (3020), amarise-web (3033) up.

---

## Block G — DNS + SSL  *(Runbook Steps 10–11)*

- [ ] Route 53 A/ALIAS: apex, `www`, `api`, `admin`, `shop` → EC2 EIP.
- [ ] SES DKIM ×3 CNAMEs published; SES domain shows **verified**.
- [ ] All 5 hostnames resolve.
- [ ] Caddy issued TLS automatically; `curl -I https://{api,admin,baalvion.com,shop}` all
      valid (no cert warning).

**Gate G:** every public hostname serves valid HTTPS.

---

## Block H — Razorpay webhooks  *(Runbook Step 12)*

- [ ] Live keys in `baalvion/razorpay` (and in order-service env).
- [ ] Webhook added: `https://api.baalvion.com/api/v1/orders/webhooks/razorpay`,
      secret = `RAZORPAY_WEBHOOK_SECRET`, events: `payment.captured`, `payment.authorized`,
      `payment.failed`, `order.paid`, `refund.processed`, `refund.created`, `payment.refunded`.
- [ ] Razorpay "Test webhook" delivery returns 2xx.
- [ ] (Optional) second webhook to `/api/payments/webhooks/razorpay` for the Java payment-service.

**Gate H:** webhook saved + test delivery green; secret matches both sides.

---

## Block I — Seed & first-login  *(Runbook Step 13)*

- [ ] Log into `admin.baalvion.com` as superadmin → **rotate `SUPERADMIN_PASSWORD`**.
- [ ] Register CMS websites: `about-baalvion`, `amarise-maison-avenue`; seed content.
- [ ] Capture Amarisé commerce **store UUID** → set `AMARISE_STORE_ID` + `AMARISE_MEDIA_HOST`,
      **rebuild + redeploy amarise-web**.
- [ ] (Optional multi-site) register Razorpay keys per website in the CMS vault.

**Gate I:** superadmin password rotated; storefront resolves its store; content seeded.

---

## Block J — Smoke tests  *(MVP_SMOKE_TEST_CHECKLIST.md — all 11)*

- [ ] 1. Registration · [ ] 2. Email verification · [ ] 3. Login · [ ] 4. JWT issuance
- [ ] 5. RBAC · [ ] 6. CMS publishing · [ ] 7. Product creation · [ ] 8. Product listing
- [ ] 9. Inventory reservation · [ ] 10. Order creation · [ ] 11. Razorpay payment
- [ ] Evidence recorded (HTTP codes, order id, Razorpay payment id, webhook delivery id).

**Gate J:** all 11 smoke tests green.

---

## Block K — Go-live sign-off

- [ ] No service in crash-loop (`docker compose ps` — all `running`/`healthy`).
- [ ] Backups: RDS 7-day PITR on; Redis snapshot retention on.
- [ ] Secrets only in Secrets Manager — `.env.production` not committed (verify `.gitignore`).
- [ ] Rollback path confirmed (previous `IMAGE_TAG` pinnable).
- [ ] Monitoring/log access confirmed for the operator.
- [ ] **Owner go/no-go recorded.**

**Final sign-off:** Operator ____________ · End time ________ · Verdict ☐ GO ☐ NO-GO

---

## Post-launch hardening backlog (not blocking day-1)

- [ ] SES out of sandbox (if still pending).
- [ ] `UPLOAD_SCAN_REQUIRED=true` (malware scan on uploads).
- [ ] RDS Multi-AZ + ElastiCache replica.
- [ ] WAF in front of Caddy/ALB.
- [ ] S3 access via instance/task IAM role (drop static keys).
- [ ] Enable ledger posting (`LEDGER_INTERNAL_KEY`) when double-entry is needed.
- [ ] Move Redpanda → MSK before scale.
- [ ] Deploy post-MVP sites (controlthemarket, law-elite, imperialpedia, GTI, proxy) —
      each needs its own backend + DNS + secrets (see AWS_SECRETS_CHECKLIST.md §14–18).

---

### One-page flow (memorize the order)

```
A prereqs → B infra → C secrets → D db-roles → E backend+migrate →
F frontends → G dns+ssl → H razorpay → I seed → J smoke → K sign-off
```

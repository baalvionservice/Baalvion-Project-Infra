# AWS Deployment Runbook — Baalvion MVP (v1.0.0-mvp)

> ⚠️ **DEPRECATED — superseded by [MASTER_DEPLOYMENT_COMMANDS.md](MASTER_DEPLOYMENT_COMMANDS.md).**
> Legacy reference only. This runbook executes **Stack A (MVP) only**. The full production
> sequence covers **3 stacks in order A → C → B** with **18 ECR repos** and **21 secrets** —
> see MASTER §7 and §10. Where this file disagrees with MASTER, **MASTER wins.**

> **Execute top to bottom.** Each step has a command block and a **Gate** that must pass
> before the next step. Region `ap-south-1`. Single EC2 host runs
> `deploy/mvp-production/docker-compose.yml`; RDS / ElastiCache / S3 / SES / Secrets
> Manager are managed. This runbook assumes resources are provisioned per
> **AWS_RESOURCE_CREATION_ORDER.md** and secrets per **AWS_SECRETS_CHECKLIST.md**.
>
> Release under deploy: tag `v1.0.0-mvp`, commit `28761797`, branch `main`.

---

## Step 0 — Prerequisites

```bash
aws configure              # region ap-south-1, deploy IAM creds
git clone <repo> && cd "Baalvion Projects"
git checkout v1.0.0-mvp
git submodule update --init        # trade-service + GTI submodules
docker --version && docker compose version   # compose v2 required
```

**Gate:** repo at `v1.0.0-mvp`, submodules initialized, Docker + compose v2 present.

---

## Step 1 — Create infrastructure

Provision VPC, subnets, IGW/NAT, route tables, and the three security groups
(`sg-edge`, `sg-app`, `sg-data`). See **AWS_RESOURCE_CREATION_ORDER.md §1–§2**.

**Gate:** VPC `available`; `sg-data` allows 5432/6379 **only** from `sg-app`; EC2 host in
`sg-app` can reach the private subnets.

---

## Step 2 — Create database (RDS PostgreSQL)

```bash
aws rds create-db-subnet-group --db-subnet-group-name baalvion-prod-db \
  --db-subnet-group-description "Baalvion prod" --subnet-ids <priv-1a> <priv-1b>
aws rds create-db-instance \
  --db-instance-identifier baalvion-prod --engine postgres --engine-version 16 \
  --db-instance-class db.t4g.medium --allocated-storage 50 --storage-type gp3 --storage-encrypted \
  --master-username baalvion --master-user-password '<DB_PASSWORD>' --db-name baalvion_db \
  --db-subnet-group-name baalvion-prod-db --vpc-security-group-ids <sg-data> \
  --backup-retention-period 7 --no-publicly-accessible
aws rds wait db-instance-available --db-instance-identifier baalvion-prod
```

**Gate:** status `available`; `psql "host=<endpoint> dbname=baalvion_db user=baalvion sslmode=require"`
connects.

---

## Step 3 — Create Redis (ElastiCache)

```bash
aws elasticache create-cache-subnet-group --cache-subnet-group-name baalvion-prod-redis \
  --cache-subnet-group-description "Baalvion prod" --subnet-ids <priv-1a> <priv-1b>
aws elasticache create-replication-group \
  --replication-group-id baalvion-prod --replication-group-description "Baalvion MVP" \
  --engine redis --engine-version 7.1 --cache-node-type cache.t4g.small \
  --num-node-groups 1 --replicas-per-node-group 0 \
  --transit-encryption-enabled --auth-token '<REDIS_PASSWORD>' \
  --cache-subnet-group-name baalvion-prod-redis --security-group-ids <sg-data> \
  --snapshot-retention-limit 3
```

Set parameter group `maxmemory-policy = noeviction`.

**Gate:** primary endpoint reachable from `sg-app`; `noeviction` confirmed.

---

## Step 4 — Create buckets (S3) + SES

```bash
aws s3api create-bucket --bucket baalvion-media-prod --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1
aws s3api put-public-access-block --bucket baalvion-media-prod \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-encryption --bucket baalvion-media-prod \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
aws s3api put-bucket-cors --bucket baalvion-media-prod --cors-configuration '{
  "CORSRules":[{"AllowedOrigins":["https://baalvion.com","https://shop.baalvion.com","https://admin.baalvion.com"],
  "AllowedMethods":["GET","HEAD"],"AllowedHeaders":["*"],"MaxAgeSeconds":3600}]}'

aws sesv2 create-email-identity --email-identity baalvion.com
aws sesv2 create-email-identity --email-identity noreply@baalvion.com
# Add DKIM CNAMEs to Route 53 (Step 10) and request SES production access.
```

**Gate:** bucket public-access blocked + CORS applied; SES identities created (DKIM
pending DNS), production access requested.

---

## Step 5 — Upload secrets (Secrets Manager)

Generate then store every 🔒 value (full list in **AWS_SECRETS_CHECKLIST.md**).

```bash
pnpm run generate:keys                                   # RS256 → config/keys/*.pem
awk 'NF{printf "%s\\n",$0}' config/keys/private.pem      # → JWT_PRIVATE_KEY
awk 'NF{printf "%s\\n",$0}' config/keys/public.pem       # → JWT_PUBLIC_KEY
openssl rand -base64 48                                  # JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
openssl rand -hex 32                                     # the 7 hex service secrets

aws secretsmanager create-secret --name baalvion/jwt-keys      --secret-string '{"JWT_PRIVATE_KEY":"...","JWT_PUBLIC_KEY":"..."}'
aws secretsmanager create-secret --name baalvion/jwt-symmetric --secret-string '{"JWT_ACCESS_SECRET":"...","JWT_REFRESH_SECRET":"..."}'
aws secretsmanager create-secret --name baalvion/gateway       --secret-string '{"GATEWAY_SIGNING_SECRET":"...","INTERNAL_SERVICE_SECRET":"..."}'
aws secretsmanager create-secret --name baalvion/rbac          --secret-string '{"RBAC_INTERNAL_API_KEY":"..."}'
aws secretsmanager create-secret --name baalvion/inventory     --secret-string '{"INVENTORY_INTERNAL_KEY":"...","JWT_ACCESS_SECRET":"..."}'
aws secretsmanager create-secret --name baalvion/order         --secret-string '{"CART_SESSION_SECRET":"..."}'
aws secretsmanager create-secret --name baalvion/cms           --secret-string '{"CMS_SECRETS_KEY":"..."}'
aws secretsmanager create-secret --name baalvion/audit         --secret-string '{"AUDIT_INTERNAL_KEY":"..."}'
aws secretsmanager create-secret --name baalvion/db            --secret-string '{"DB_PASSWORD":"...","DB_APP_PASSWORD":"..."}'
aws secretsmanager create-secret --name baalvion/redis         --secret-string '{"REDIS_PASSWORD":"..."}'
aws secretsmanager create-secret --name baalvion/superadmin    --secret-string '{"SUPERADMIN_EMAIL":"superadmin@baalvion.com","SUPERADMIN_PASSWORD":"..."}'
aws secretsmanager create-secret --name baalvion/s3            --secret-string '{"S3_ACCESS_KEY":"...","S3_SECRET_KEY":"..."}'
aws secretsmanager create-secret --name baalvion/email         --secret-string '{"SMTP_USER":"...","SMTP_PASS":"..."}'
aws secretsmanager create-secret --name baalvion/razorpay      --secret-string '{"RAZORPAY_KEY_ID":"rzp_live_...","RAZORPAY_KEY_SECRET":"...","RAZORPAY_WEBHOOK_SECRET":"..."}'
```

**Gate:** all 14 secrets present; `DB_PASSWORD`/`DB_APP_PASSWORD` recorded for Step 6;
secrets-gate checklist in AWS_SECRETS_CHECKLIST.md all ✅.

---

## Step 6 — Run init-roles.sql

Create the runtime RLS role and schema grants **before any service starts**.

```bash
psql "host=<rds-endpoint> dbname=baalvion_db user=baalvion sslmode=require" \
  -v baalvion_pw='<DB_PASSWORD>' -v baalvion_app_pw='<DB_APP_PASSWORD>' \
  -f deploy/mvp-production/init-roles.sql
```

**Gate:** roles `baalvion` and `baalvion_app` exist (`\du`). `baalvion_app` **must exist
before payment-service migrates** or its Flyway grant fails. (Some schema grants no-op
now and are re-applied in Step 7 after schemas appear.)

---

## Step 7 — Run migrations (automatic on first boot)

Migrations run **as each service boots** — there is no separate migration command. Boot
order below is enforced by compose `depends_on` + healthchecks.

| Order | Service | Schema | Mechanism |
|---|---|---|---|
| 1 | auth-service | `auth` | Sequelize sync |
| 2 | rbac-service | `rbac` | Sequelize sync |
| 3 | audit-service | `audit` | Sequelize sync (WORM + RLS) |
| 4 | cms-service | `cms` | Sequelize migrations 20260001→20260012 |
| 5 | commerce-service | `commerce` | Sequelize migrations |
| 6 | inventory-service | `inventory` | Sequelize migrations |
| 7 | order-service | `orders` | Sequelize migrations (incl. event_outbox) |
| 8 | payment-service | `payments` | **Flyway** V001→V011, baseline-on-migrate |

This step is realized by Step 8's `up -d`. After first boot completes, **re-run the
schema-grant block** so `baalvion_app` has USAGE on every now-existing schema:

```bash
psql "host=<rds-endpoint> dbname=baalvion_db user=baalvion sslmode=require" \
  -v baalvion_pw='<DB_PASSWORD>' -v baalvion_app_pw='<DB_APP_PASSWORD>' \
  -f deploy/mvp-production/init-roles.sql
```

**Gate:** all 8 schemas exist; payment-service Flyway history shows V001→V011 success.

---

## Step 8 — Deploy backend services

### 8a. Build & push images (from monorepo root — build context IS the root)

```bash
export REG=<acct>.dkr.ecr.ap-south-1.amazonaws.com
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $REG

for s in auth-service auth-gateway rbac-service notification-service audit-service \
         cms-service commerce-service inventory-service order-service; do
  domain=$(case $s in
    auth-service|auth-gateway|rbac-service) echo identity;;
    notification-service|audit-service)     echo infrastructure;;
    cms-service)                            echo knowledge;;
    *)                                      echo commerce;; esac)
  docker build -f Backend/services/$domain/$s/Dockerfile -t $REG/baalvion/$s:prod-latest .
  docker push $REG/baalvion/$s:prod-latest
done

docker build -f Backend/services/commerce/financial-services-java/Dockerfile \
  --build-arg SERVICE=payment-service -t $REG/baalvion/payment-service:prod-latest \
  Backend/services/commerce/financial-services-java
docker push $REG/baalvion/payment-service:prod-latest
```

### 8b. Bring up the stack

```bash
cp deploy/mvp-production/.env.production.example deploy/mvp-production/.env.production
# Fill .env.production from Secrets Manager:
#   aws secretsmanager get-secret-value --secret-id baalvion/jwt-keys --query SecretString --output text
docker compose -f deploy/mvp-production/docker-compose.yml \
  --env-file deploy/mvp-production/.env.production up -d
docker compose -f deploy/mvp-production/docker-compose.yml ps
docker compose -f deploy/mvp-production/docker-compose.yml logs -f payment-service auth-service
```

**Gate — health (run on the host):**

```bash
for p in 3001:health 3099:health 3055:health 3018:health 3012:readyz \
         3014:readyz 3013:readyz 3031:health 3032:readyz; do
  curl -fsS http://localhost:${p%%:*}/${p##*:} && echo "  OK ${p%%:*}"; done
curl -fsS http://localhost:3015/actuator/health   # → {"status":"UP"}
```
All 9 Node services + payment-service report healthy.

---

## Step 9 — Deploy frontends

```bash
docker build -f Frontend/admin-platform/Dockerfile.deploy -t $REG/baalvion/admin-platform:prod-latest .
docker build -f Frontend/about-baalvion-main/Dockerfile    -t $REG/baalvion/about-web:prod-latest .
docker build -f Frontend/AmariseMaisonAvenue-main/Dockerfile -t $REG/baalvion/amarise-web:prod-latest .
docker push $REG/baalvion/admin-platform:prod-latest
docker push $REG/baalvion/about-web:prod-latest
docker push $REG/baalvion/amarise-web:prod-latest
```

> Frontend `NEXT_PUBLIC_*` are baked at build time from the compose `build.args`
> (domains resolved from `.env.production`). `AMARISE_STORE_ID` and `AMARISE_MEDIA_HOST`
> are only known **after seeding** (Step 13) → amarise-web is rebuilt once those exist.
> The three frontends come up under the same `up -d` as Step 8.

**Gate:** `admin-platform` (3030), `about-web` (3020), `amarise-web` (3033) containers
running; Caddy reverse-proxies them.

---

## Step 10 — Configure DNS (Route 53)

Point A/ALIAS records at the EC2 EIP (or ALB):

| Record | Target |
|--------|--------|
| `baalvion.com` (apex), `www` | EIP / ALB |
| `api.baalvion.com` | EIP / ALB |
| `admin.baalvion.com` | EIP / ALB |
| `shop.baalvion.com` | EIP / ALB |
| SES DKIM ×3 (CNAME) | from Step 4 |

**Gate:** all five hostnames resolve to the host; DKIM CNAMEs published; SES domain
verified (DKIM green).

---

## Step 11 — Configure SSL

Caddy issues Let's Encrypt certs automatically on first HTTPS request
(`ACME_EMAIL=infra.baalvion@gmail.com`). Requires DNS resolving (Step 10) + 80/443 open
on `sg-edge`.

```bash
curl -I https://api.baalvion.com/health
curl -I https://admin.baalvion.com
curl -I https://baalvion.com
curl -I https://shop.baalvion.com
```

**Gate:** all four serve valid TLS (no cert warning, HTTP/2 200/3xx).

---

## Step 12 — Configure Razorpay webhooks

1. Razorpay Dashboard → **Settings → API Keys** → generate **live** keys → already in
   `baalvion/razorpay`.
2. **Settings → Webhooks → Add New Webhook** (marketplace / storefront path):
   - URL: **`https://api.baalvion.com/api/v1/orders/webhooks/razorpay`**
     (order-service is the capture backstop — **not** `/api/payments/...`).
   - Secret: the `RAZORPAY_WEBHOOK_SECRET` value (same in Razorpay and order-service env).
   - Active events: `payment.captured`, `payment.authorized`, `payment.failed`,
     `order.paid`, `refund.processed`, `refund.created`, `payment.refunded`.
3. (Optional) If running the Java payment-service for other sites, add a second webhook
   to `https://api.baalvion.com/api/payments/webhooks/razorpay` with its own secret.
4. order-service runs `PAYMENT_PROVIDER=razorpay`, `ALLOW_MOCK_PAYMENTS=false`,
   `RAZORPAY_WEBHOOK_STRICT_AMOUNT=true`. Webhook auth is HMAC-SHA256 over the raw body
   (`X-Razorpay-Signature`); Caddy routes `/api/v1/orders/webhooks/*` straight to
   order-service, bypassing the JWT gateway.

**Gate:** Razorpay webhook saved + "Test" delivery returns 2xx; secret matches both sides.

---

## Step 13 — Seed & smoke tests

```bash
# Superadmin is bootstrapped automatically on auth-service first boot.
# 1. Log into admin.baalvion.com (SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD) → ROTATE pw.
# 2. CMS: register the two websites + seed content (about-baalvion, amarise-maison-avenue).
# 3. Capture the Amarisé commerce store UUID → set AMARISE_STORE_ID + AMARISE_MEDIA_HOST,
#    rebuild + redeploy amarise-web (Step 9) so the storefront resolves its store.
# 4. (Optional multi-site) register Razorpay keys in the CMS vault per website.
```

Then run the full **MVP_SMOKE_TEST_CHECKLIST.md** (registration → login → JWT → RBAC →
CMS publish → product create/list → inventory reserve → order → Razorpay → email verify).

**Gate:** every item in MVP_SMOKE_TEST_CHECKLIST.md passes against the live `*.baalvion.com`
hostnames.

---

## Rollback

```bash
# Pin a previous image tag and re-up (app tier only)
IMAGE_TAG=prod-<prev> docker compose -f deploy/mvp-production/docker-compose.yml \
  --env-file deploy/mvp-production/.env.production up -d
```

DB migrations are forward-only (Sequelize + Flyway) — **roll back the app tier, not the
schema**. RDS has 7-day PITR for data fixes.

---

## Intentional MVP simplifications

- **Ledger posting off** (`LEDGER_INTERNAL_KEY` empty → order-service fail-open).
- **session-service / media-service / dashboards / CTM / OAuth** excluded from the stack.
- **Redpanda single-node** instead of MSK (fine for outbox relay at MVP volume).
- **Static S3 keys** acceptable day-1; migrate to instance/task IAM role next.
- **Email-only notifications** (Twilio/FCM disabled).
- Harden before real traffic: SES out of sandbox, `UPLOAD_SCAN_REQUIRED=true`, RDS
  Multi-AZ, ElastiCache replica, WAF on Caddy/ALB.

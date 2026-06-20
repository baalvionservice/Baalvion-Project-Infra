# Baalvion MVP — Production Deployment Runbook (AWS)

Execute top to bottom. Each step is copy-pasteable. Region used throughout is
`ap-south-1` (Mumbai — closest to Razorpay/INR). Target end-state: **registration,
login, CMS publishing, product management, order creation, Razorpay payments** live.

Stack model: one **EC2 host** running this `docker-compose.yml` (+ Caddy + Redpanda),
with **RDS**, **ElastiCache**, **S3**, **SES** managed. Secrets pulled from
**Secrets Manager** into `.env.production` at deploy time.

---

## Phase 0 — Prerequisites

- [ ] AWS account, CLI configured (`aws configure`, region `ap-south-1`).
- [ ] Domain `baalvion.com` in Route 53.
- [ ] Razorpay **live** account (KYC approved), live API keys generated.
- [ ] Docker + docker compose v2 on the build/deploy host.
- [ ] Repo checked out at the monorepo root with submodules: `git submodule update --init`.

---

## Phase 1 — Generate secrets

```bash
# RS256 keypair (auth-service signs, everyone verifies)
pnpm run generate:keys           # writes config/keys/*.pem
# Convert to single-line \n-escaped PEM for env:
awk 'NF{printf "%s\\n",$0}' config/keys/private.pem   # -> JWT_PRIVATE_KEY
awk 'NF{printf "%s\\n",$0}' config/keys/public.pem    # -> JWT_PUBLIC_KEY

# Symmetric + service secrets (run 7x, one per variable)
openssl rand -base64 48   # JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
openssl rand -hex 32      # GATEWAY_SIGNING_SECRET / INTERNAL_SERVICE_SECRET /
                          # RBAC_INTERNAL_API_KEY / INVENTORY_INTERNAL_KEY /
                          # AUDIT_INTERNAL_KEY / CART_SESSION_SECRET / CMS_SECRETS_KEY
```

Store every 🔒 value in Secrets Manager:

```bash
aws secretsmanager create-secret --name baalvion/jwt-keys \
  --secret-string '{"JWT_PRIVATE_KEY":"...","JWT_PUBLIC_KEY":"..."}'
aws secretsmanager create-secret --name baalvion/jwt-symmetric \
  --secret-string '{"JWT_ACCESS_SECRET":"...","JWT_REFRESH_SECRET":"..."}'
aws secretsmanager create-secret --name baalvion/gateway \
  --secret-string '{"GATEWAY_SIGNING_SECRET":"...","INTERNAL_SERVICE_SECRET":"..."}'
aws secretsmanager create-secret --name baalvion/rbac        --secret-string '{"RBAC_INTERNAL_API_KEY":"..."}'
aws secretsmanager create-secret --name baalvion/inventory   --secret-string '{"INVENTORY_INTERNAL_KEY":"...","JWT_ACCESS_SECRET":"..."}'
aws secretsmanager create-secret --name baalvion/order       --secret-string '{"CART_SESSION_SECRET":"..."}'
aws secretsmanager create-secret --name baalvion/cms         --secret-string '{"CMS_SECRETS_KEY":"..."}'
aws secretsmanager create-secret --name baalvion/audit       --secret-string '{"AUDIT_INTERNAL_KEY":"..."}'
aws secretsmanager create-secret --name baalvion/db          --secret-string '{"DB_PASSWORD":"...","DB_APP_PASSWORD":"..."}'
aws secretsmanager create-secret --name baalvion/superadmin  --secret-string '{"SUPERADMIN_EMAIL":"superadmin@baalvion.com","SUPERADMIN_PASSWORD":"..."}'
aws secretsmanager create-secret --name baalvion/s3          --secret-string '{"S3_ACCESS_KEY":"...","S3_SECRET_KEY":"..."}'
aws secretsmanager create-secret --name baalvion/email       --secret-string '{"SMTP_USER":"...","SMTP_PASS":"..."}'
aws secretsmanager create-secret --name baalvion/razorpay    --secret-string '{"RAZORPAY_KEY_ID":"rzp_live_...","RAZORPAY_KEY_SECRET":"...","RAZORPAY_WEBHOOK_SECRET":"..."}'
```

---

## Phase 2 — RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier baalvion-prod \
  --engine postgres --engine-version 16 \
  --db-instance-class db.t4g.medium \
  --allocated-storage 50 --storage-type gp3 \
  --master-username baalvion --master-user-password '<DB_PASSWORD>' \
  --db-name baalvion_db \
  --vpc-security-group-ids <sg-app> \
  --backup-retention-period 7 --storage-encrypted \
  --no-publicly-accessible
```

When `available`, create roles & schema-level grants (TLS required):

```bash
psql "host=<rds-endpoint> dbname=baalvion_db user=baalvion sslmode=require" \
  -v baalvion_pw='<DB_PASSWORD>' -v baalvion_app_pw='<DB_APP_PASSWORD>' \
  -f deploy/mvp-production/init-roles.sql
```

> `baalvion_app` **must exist before payment-service migrates** or its Flyway grant fails.

### Schema creation order (automatic, but this is the contract)

All Node services run `CREATE SCHEMA IF NOT EXISTS <schema>` on boot, so order is
self-healing — but boot them in this order so cross-service callers find their deps:

| Order | Service | Schema | Mechanism |
|---|---|---|---|
| 1 | auth-service | `auth` | Sequelize sync on boot |
| 2 | rbac-service | `rbac` | Sequelize sync |
| 3 | audit-service | `audit` | Sequelize sync (WORM + RLS) |
| 4 | cms-service | `cms` | Sequelize migrations 20260001→20260012 |
| 5 | commerce-service | `commerce` | Sequelize migrations |
| 6 | inventory-service | `inventory` | Sequelize migrations |
| 7 | order-service | `orders` | Sequelize migrations (incl. event_outbox) |
| 8 | payment-service | `payments` | **Flyway** V001→V011, `BASELINE_ON_MIGRATE=true`, `BASELINE_VERSION=0` |

After first boot, re-run the schema-grant block in `init-roles.sql` so `baalvion_app`
has USAGE on every schema that now exists.

---

## Phase 3 — ElastiCache Redis

```bash
aws elasticache create-replication-group \
  --replication-group-id baalvion-prod \
  --replication-group-description "Baalvion MVP" \
  --engine redis --engine-version 7.1 \
  --cache-node-type cache.t4g.small \
  --num-node-groups 1 --replicas-per-node-group 0 \
  --transit-encryption-enabled --auth-token '<REDIS_PASSWORD>' \
  --security-group-ids <sg-app> \
  --snapshot-retention-limit 3
```

Parameter group: set `maxmemory-policy=noeviction` (queues + the `baalvion:events`
stream must never be evicted — see `redis.conf` rationale).

---

## Phase 4 — S3 (media)

```bash
aws s3api create-bucket --bucket baalvion-media-prod \
  --region ap-south-1 --create-bucket-configuration LocationConstraint=ap-south-1
aws s3api put-public-access-block --bucket baalvion-media-prod \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-encryption --bucket baalvion-media-prod \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
# CORS so the storefront/admin can render uploaded media
aws s3api put-bucket-cors --bucket baalvion-media-prod --cors-configuration '{
  "CORSRules":[{"AllowedOrigins":["https://baalvion.com","https://shop.baalvion.com","https://admin.baalvion.com"],
  "AllowedMethods":["GET","HEAD"],"AllowedHeaders":["*"],"MaxAgeSeconds":3600}]}'
```

Serve via CloudFront in front of the bucket for public media (set `S3_PUBLIC_URL` to
the CloudFront domain). **Preferred:** attach an IAM role to the EC2/ECS task with
`s3:PutObject/GetObject` on this bucket instead of static `S3_ACCESS_KEY/SECRET`.

---

## Phase 5 — SES (email: verification + notifications)

```bash
aws sesv2 create-email-identity --email-identity baalvion.com      # then add the DKIM CNAMEs to Route 53
aws sesv2 create-email-identity --email-identity noreply@baalvion.com
# Request production access (exit sandbox) in the SES console, else only verified
# recipients receive mail.
# Create SMTP credentials (IAM user with ses:SendRawEmail) -> SMTP_USER / SMTP_PASS.
```

Both auth-service (verification mail) and notification-service use the SES SMTP
endpoint `email-smtp.ap-south-1.amazonaws.com:587`.

---

## Phase 6 — Razorpay production config

1. Razorpay Dashboard → **Settings → API Keys** → generate **live** keys →
   `RAZORPAY_KEY_ID` (`rzp_live_…`) + `RAZORPAY_KEY_SECRET`.
2. **Settings → Webhooks → Add New Webhook** (storefront / marketplace path):
   - URL: **`https://api.baalvion.com/api/v1/orders/webhooks/razorpay`** (order-service
     is the capture backstop for marketplace orders — NOT `/api/payments/...`).
   - Secret: generate a strong value → set as `RAZORPAY_WEBHOOK_SECRET` (same value in
     Razorpay and in **order-service** env).
   - Active events: `payment.captured`, `payment.authorized`, `payment.failed`,
     `order.paid`, `refund.processed`, `refund.created`, `payment.refunded`.
   - (If you also run the Java payment-service for other sites, add a second webhook to
     `https://api.baalvion.com/api/payments/webhooks/razorpay` with its own secret.)
3. order-service runs `PAYMENT_PROVIDER=razorpay`, `ALLOW_MOCK_PAYMENTS=false`,
   `RAZORPAY_WEBHOOK_STRICT_AMOUNT=true`. Webhook auth is HMAC-SHA256 over the raw body
   (`X-Razorpay-Signature`) — Caddy routes `/api/v1/orders/webhooks/*` straight to
   order-service, bypassing the JWT gateway.
4. **Key source:** order-service resolves Razorpay keys per-site from the CMS vault
   (admin panel → website integrations, encrypted with `CMS_SECRETS_KEY`, looked up by
   `PAYMENT_SITE_SLUG`). If the vault has no entry it **falls open to the `RAZORPAY_*`
   env keys** — so the simplest MVP is to set the env keys and skip the vault, then move
   to per-site vault keys later with no redeploy.

---

## Phase 7 — Build & push images

From the **monorepo root** (build context must be the root):

```bash
export REG=<acct>.dkr.ecr.ap-south-1.amazonaws.com
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $REG

for s in auth-service auth-gateway rbac-service notification-service audit-service \
         cms-service commerce-service inventory-service order-service; do
  domain=$(case $s in
    auth-service|auth-gateway|rbac-service) echo identity;;
    notification-service|audit-service)     echo infrastructure;;
    cms-service)                            echo knowledge;;
    *)                                      echo commerce;;
  esac)
  docker build -f Backend/services/$domain/$s/Dockerfile -t $REG/baalvion/$s:prod-latest .
  docker push $REG/baalvion/$s:prod-latest
done

# Java payment-service (its own context)
docker build -f Backend/services/commerce/financial-services-java/Dockerfile \
  --build-arg SERVICE=payment-service \
  -t $REG/baalvion/payment-service:prod-latest \
  Backend/services/commerce/financial-services-java
docker push $REG/baalvion/payment-service:prod-latest

# Frontends
docker build -f Frontend/admin-platform/Dockerfile.deploy -t $REG/baalvion/admin-platform:prod-latest .
docker build -f Frontend/about-baalvion-main/Dockerfile    -t $REG/baalvion/about-web:prod-latest .
docker build -f Frontend/AmariseMaisonAvenue-main/Dockerfile -t $REG/baalvion/amarise-web:prod-latest .
docker push $REG/baalvion/admin-platform:prod-latest
docker push $REG/baalvion/about-web:prod-latest
docker push $REG/baalvion/amarise-web:prod-latest
```

> `Frontend/about-baalvion-main/Dockerfile` now exists (created in the analysis pass,
> standalone output enabled in `next.config.ts`, package `about-baalvion-web`, PORT 3020).
> about-web has no backend deps; it only needs `CMS_PUBLIC_URL` + `CMS_WEBSITE_SLUG` at runtime.

---

## Phase 8 — Deploy on the host

```bash
# On the EC2 host (in the app security group, can reach RDS/ElastiCache):
cd "Baalvion Projects"
cp deploy/mvp-production/.env.production.example deploy/mvp-production/.env.production
# Fill .env.production — pull 🔒 values from Secrets Manager:
#   aws secretsmanager get-secret-value --secret-id baalvion/jwt-keys --query SecretString --output text
# (or wire an entrypoint that exports them automatically)

docker compose -f deploy/mvp-production/docker-compose.yml \
  --env-file deploy/mvp-production/.env.production up -d
```

Boot waits on healthchecks. Watch:

```bash
docker compose -f deploy/mvp-production/docker-compose.yml ps
docker compose -f deploy/mvp-production/docker-compose.yml logs -f payment-service auth-service
```

---

## Phase 9 — DNS

Point Route 53 A/ALIAS records at the host (or ALB):
`api`, `admin`, `baalvion.com` (apex), `www`, `shop` → host EIP. Caddy issues TLS
automatically on first request.

---

## Phase 10 — Seed & smoke test

```bash
# 1. Health
for p in 3001:health 3099:health 3055:health 3018:health 3012:readyz \
         3014:readyz 3013:readyz 3031:health 3032:readyz; do
  curl -fsS http://localhost:${p%%:*}/${p##*:} && echo "  OK ${p%%:*}"; done
curl -fsS http://localhost:3015/actuator/health   # payment-service -> {"status":"UP"}

# 2. Superadmin bootstrap is automatic on auth-service first boot
#    (SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD). Log into admin.baalvion.com, rotate pw.

# 3. CMS: register the two websites + seed content via admin panel or seed scripts
#    (about-baalvion, amarise-maison-avenue). Capture the Amarisé commerce store UUID
#    -> set AMARISE_STORE_ID and redeploy amarise-web.

# 4. Register a website's payment keys in the CMS vault (if using multi-site mode).
```

### Acceptance checklist (the six MVP capabilities)

- [ ] **Registration** — `POST https://api.baalvion.com/auth/register` → 201; verification email arrives (SES).
- [ ] **Login** — `POST https://api.baalvion.com/auth/login` → access+refresh tokens; gateway sets session.
- [ ] **CMS publishing** — create/publish content in admin → visible on `https://baalvion.com` (about-web reads CMS public API).
- [ ] **Product management** — create a product in admin/commerce → appears in storefront `GET /api/commerce/.../storefront/<storeId>/products`.
- [ ] **Order creation** — add to cart + checkout on `shop.baalvion.com` → order row in `orders` schema.
- [ ] **Razorpay payment** — checkout returns Razorpay `clientParams` (keyId/amount/currency) from order-service; the browser SDK completes payment; backend-authoritative `confirmPayment` settles the order, and the `payment.captured`/`order.paid` webhook hits **`/api/v1/orders/webhooks/razorpay`** as the backstop (signature + strict-amount verified) → order marked paid in the `orders` schema.

---

## Rollback

```bash
# Pin a previous tag and re-up
IMAGE_TAG=prod-<prev> docker compose -f deploy/mvp-production/docker-compose.yml \
  --env-file deploy/mvp-production/.env.production up -d
```

DB migrations are additive (Sequelize + Flyway forward-only) — roll back the app
tier, not the schema. RDS has 7-day PITR if a data fix is needed.

---

## Known MVP simplifications (intentional)

- **Ledger posting off** — `LEDGER_INTERNAL_KEY` empty → order-service fail-open; no double-entry ledger in MVP.
- **session-service / media-service / dashboards / CTM / OAuth** — excluded.
- **Redpanda single-node** instead of MSK — fine for outbox relay at MVP volume; move to MSK before scale.
- **Static S3 keys** acceptable for day-1; migrate to EC2/ECS IAM role next.
- **Twilio/FCM push** disabled — email-only notifications via SES.
- Harden before real traffic: SES out of sandbox, `UPLOAD_SCAN_REQUIRED=true`, RDS Multi-AZ, ElastiCache replica, WAF on Caddy/ALB.

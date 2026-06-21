# MASTER DEPLOYMENT COMMANDS — Baalvion Production (AWS `ap-south-1`)

> Single source of truth for the production deployment. Every command below is copy-pasteable.
> Region: **ap-south-1 (Mumbai)** throughout. Built from the committed state
> **`v1.0.1-frontend-hardening`** (on `v1.0.0-mvp` baseline).
>
> **Scope (per operator decision): 5 frontends across 3 independent stacks.**
> Grounded 100% in the verified deploy packages — no invented infra.
>
> **This file is the ONLY execution authority.** Every other `AWS_*`, `FRONTEND_*`, `MVP_*`,
> and `FINAL_*` markdown at the repo root is **legacy reference only** (each carries a
> `⚠️ DEPRECATED` header). Where any of them disagrees with this file — resource counts,
> domains, frontend scope, or the ECS/CloudFront/ALB design sketched in the `FRONTEND_*`
> docs — **this file wins.**
>
> **Canonical deployment order: Stack A → Stack C → Stack B.** Stack A (auth/JWKS + the
> managed data tier) is the platform foundation both other stacks verify SSO against — it
> comes up first, then Stack C, then Stack B.
>
> Placeholders: `<ACCOUNT_ID>`, `<…_PASSWORD>`, `<RDS_ENDPOINT>`, `<EIP_*>`, `rzp_live_…`, etc.
> Secret VALUES are never hardcoded here — they are generated and pushed to Secrets Manager.

---

## 0. Topology & scope reconciliation

This is **three independent EC2 + Docker-Compose stacks** (each ships its own Caddy on :80/:443,
so each needs its own host / Elastic IP):

| Stack | Package | Domains | Frontends | Backends | Data tier |
|-------|---------|---------|-----------|----------|-----------|
| **A — MVP storefront** | `deploy/mvp-production` | api / admin / baalvion.com+www / shop | admin-platform, about-web, amarise-web (3) | auth, rbac, audit, cms, commerce, inventory, order, payment(Java), auth-gateway, notification, redpanda (11) | **RDS** + **ElastiCache** + **S3** + **SES** (managed) |
| **B — ControlTheMarket** | `deploy/controlthemarket` | controlthemarket.com (+www) | controlthemarket-web (1) | ctm-service | in-compose Postgres 16 |
| **C — Proxy / BaalvionStack** | `deploy/proxy-baalvionstack` | proxy.baalvionstack.com, cms.baalvion.com | Proxy SPA (host-built static) (1) | proxy-service, payment-service(Java), cms-service | in-compose Postgres 16 + Redis 7 + Kafka |

**Frontend count = 5** (admin-platform, about-web, amarise-web, controlthemarket-web, Proxy SPA).
> ℹ️ `about-web` is the storefront marketing site (baalvion.com) included by the MVP package; the
> canonical "7" also names **Law-Elite, Imperialpedia, GTI** — these are **build-ready (Dockerfiles
> exist) but have NO deploy package, domains, or backends in the committed state**, so they are
> **OUT OF SCOPE** here (see §11). Stacks B and C verify central SSO against Stack A's auth-service.

**Architecture invariants (enforced by the packages — do not violate):**
- **Independent edges:** each stack is its own EC2 host with its own Caddy (:80/:443) and its
  own Elastic IP. No shared ingress, no merged stacks.
- **Centralized SSO:** Stacks B and C verify tokens against **Stack A's auth-service JWKS
  only** (`https://api.baalvion.com/.well-known/jwks.json`). There is exactly one issuer
  (Stack A); B and C never mint their own identities.
- **Dependency chain:** Stack A runs the full chain **auth → rbac → payment → gateway**.
  **Stack B depends on Stack A auth only.** **Stack C depends on Stack A auth + its own**
  cms / payment / proxy services.
- **No cross-stack DB:** Stack A uses managed **RDS + ElastiCache**; Stacks B and C each run
  their **own in-compose Postgres** (C also Redis + Kafka). No stack reads another's database.

**Build host requirement:** all images build with the **monorepo root** as context. Check out the
release first on the build host:

```bash
git fetch --tags && git checkout v1.0.1-frontend-hardening
git submodule update --init --recursive   # (no-op if no submodules; safe to run)
```

---

## 1. Phase 0 — Prerequisites (all stacks)

```bash
# AWS CLI configured for ap-south-1
aws configure          # set region = ap-south-1, output = json
aws sts get-caller-identity --query Account --output text     # -> <ACCOUNT_ID>
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=ap-south-1
export REG=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Docker + compose v2 on build/deploy hosts
docker version && docker compose version

# Route 53 hosted zones must exist for: baalvion.com, baalvionstack.com, controlthemarket.com
aws route53 list-hosted-zones --query "HostedZones[].Name" --output text
```

---

## 2. AWS resource creation checklist (ap-south-1) — exact order

> Create in this order; later steps reference earlier outputs (SG ids, RDS endpoint, EIPs).

```bash
# 2.1 — Networking (use default VPC or an existing prod VPC)
export VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)

# 2.2 — Security groups
#   sg-app : EC2 hosts. Inbound 80/443 from 0.0.0.0/0, 22 from your admin CIDR.
aws ec2 create-security-group --group-name baalvion-app --description "Baalvion app hosts" --vpc-id $VPC_ID
export SG_APP=$(aws ec2 describe-security-groups --filters Name=group-name,Values=baalvion-app --query 'SecurityGroups[0].GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $SG_APP --protocol tcp --port 80  --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_APP --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_APP --protocol tcp --port 22  --cidr <ADMIN_CIDR>/32

#   sg-data : RDS + ElastiCache. Inbound 5432/6379 ONLY from sg-app.
aws ec2 create-security-group --group-name baalvion-data --description "Baalvion managed data" --vpc-id $VPC_ID
export SG_DATA=$(aws ec2 describe-security-groups --filters Name=group-name,Values=baalvion-data --query 'SecurityGroups[0].GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $SG_DATA --protocol tcp --port 5432 --source-group $SG_APP
aws ec2 authorize-security-group-ingress --group-id $SG_DATA --protocol tcp --port 6379 --source-group $SG_APP

# 2.3 — EC2 hosts + Elastic IPs (one per stack; t3.large+ recommended for Stack A)
#   Stack A host (MVP), Stack B host (CTM), Stack C host (Proxy). Allocate 3 EIPs:
aws ec2 allocate-address --domain vpc   # x3  -> EIP_A, EIP_B, EIP_C  (associate after launch)
# Launch 3 instances in sg-app with an instance profile that allows S3 + Secrets Manager (see 2.7).

# 2.4 — RDS PostgreSQL 16 (Stack A only)  [see §details in deploy/mvp-production/RUNBOOK.md Phase 2]
aws rds create-db-instance \
  --db-instance-identifier baalvion-prod \
  --engine postgres --engine-version 16 \
  --db-instance-class db.t4g.medium \
  --allocated-storage 50 --storage-type gp3 \
  --master-username baalvion --master-user-password '<DB_PASSWORD>' \
  --db-name baalvion_db \
  --vpc-security-group-ids $SG_DATA \
  --backup-retention-period 7 --storage-encrypted --no-publicly-accessible
# wait, then capture endpoint:
aws rds wait db-instance-available --db-instance-identifier baalvion-prod
export RDS_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier baalvion-prod --query 'DBInstances[0].Endpoint.Address' --output text)

# 2.5 — ElastiCache Redis 7 (Stack A only)
aws elasticache create-replication-group \
  --replication-group-id baalvion-prod \
  --replication-group-description "Baalvion MVP" \
  --engine redis --engine-version 7.1 \
  --cache-node-type cache.t4g.small \
  --num-node-groups 1 --replicas-per-node-group 0 \
  --transit-encryption-enabled --auth-token '<REDIS_PASSWORD>' \
  --security-group-ids $SG_DATA --snapshot-retention-limit 3
# Parameter group: maxmemory-policy = noeviction (BullMQ queues + baalvion:events stream).

# 2.6 — S3 media bucket (Stack A)
aws s3api create-bucket --bucket baalvion-media-prod --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1
aws s3api put-public-access-block --bucket baalvion-media-prod \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-encryption --bucket baalvion-media-prod \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
aws s3api put-bucket-cors --bucket baalvion-media-prod --cors-configuration '{
  "CORSRules":[{"AllowedOrigins":["https://baalvion.com","https://shop.baalvion.com","https://admin.baalvion.com"],
  "AllowedMethods":["GET","HEAD"],"AllowedHeaders":["*"],"MaxAgeSeconds":3600}]}'

# 2.7 — IAM instance role (preferred over static S3 keys) — attach to Stack A host
#   Policy: s3:PutObject/GetObject on baalvion-media-prod/*, secretsmanager:GetSecretValue on baalvion/*.

# 2.8 — SES (Stack A email)
aws sesv2 create-email-identity --email-identity baalvion.com
aws sesv2 create-email-identity --email-identity noreply@baalvion.com
#   Add the returned DKIM CNAMEs to Route 53 (§8). Request production access (exit sandbox) in console.
#   Create an IAM user with ses:SendRawEmail -> SES SMTP username/password (SMTP_USER/SMTP_PASS).

# 2.9 — ECR repositories (§5)
# 2.10 — Route 53 records (§8)
```

**Checklist (tick before app deploy):**
- [ ] VPC + `sg-app` (80/443/22) + `sg-data` (5432/6379 from sg-app only)
- [ ] 3 EC2 hosts + 3 EIPs; instance profile (S3 + Secrets Manager) on Stack A host
- [ ] RDS `baalvion-prod` available; endpoint captured
- [ ] ElastiCache `baalvion-prod` available; `noeviction` param group
- [ ] S3 `baalvion-media-prod` (private + SSE + CORS)
- [ ] SES identities verified; DKIM CNAMEs added; production access requested
- [ ] 18 ECR repos created (§5)
- [ ] Route 53 records created (§8)

---

## 3. Secrets Manager entries (exact `create-secret` commands)

### Stack A — MVP (`baalvion/*`)
```bash
aws secretsmanager create-secret --name baalvion/jwt-keys      --secret-string '{"JWT_PRIVATE_KEY":"<single-line-\n-PEM>","JWT_PUBLIC_KEY":"<single-line-\n-PEM>"}'
aws secretsmanager create-secret --name baalvion/jwt-symmetric --secret-string '{"JWT_ACCESS_SECRET":"<openssl rand -base64 48>","JWT_REFRESH_SECRET":"<openssl rand -base64 48>"}'
aws secretsmanager create-secret --name baalvion/gateway       --secret-string '{"GATEWAY_SIGNING_SECRET":"<rand -hex 32>","INTERNAL_SERVICE_SECRET":"<rand -hex 32>"}'
aws secretsmanager create-secret --name baalvion/rbac          --secret-string '{"RBAC_INTERNAL_API_KEY":"<rand -hex 32>"}'
aws secretsmanager create-secret --name baalvion/inventory     --secret-string '{"INVENTORY_INTERNAL_KEY":"<rand -hex 32>","JWT_ACCESS_SECRET":"<same as jwt-symmetric>"}'
aws secretsmanager create-secret --name baalvion/order         --secret-string '{"CART_SESSION_SECRET":"<rand -hex 32>"}'
aws secretsmanager create-secret --name baalvion/cms           --secret-string '{"CMS_SECRETS_KEY":"<rand -hex 32>"}'
aws secretsmanager create-secret --name baalvion/audit         --secret-string '{"AUDIT_INTERNAL_KEY":"<rand -hex 32>"}'
aws secretsmanager create-secret --name baalvion/db            --secret-string '{"DB_PASSWORD":"<…>","DB_APP_PASSWORD":"<…>"}'
aws secretsmanager create-secret --name baalvion/redis         --secret-string '{"REDIS_PASSWORD":"<…>"}'
aws secretsmanager create-secret --name baalvion/superadmin    --secret-string '{"SUPERADMIN_EMAIL":"superadmin@baalvion.com","SUPERADMIN_PASSWORD":"<…rotate after 1st login>"}'
aws secretsmanager create-secret --name baalvion/s3            --secret-string '{"S3_ACCESS_KEY":"<…>","S3_SECRET_KEY":"<…>"}'   # skip if using IAM role
aws secretsmanager create-secret --name baalvion/email         --secret-string '{"SMTP_USER":"<SES SMTP user>","SMTP_PASS":"<SES SMTP pass>"}'
aws secretsmanager create-secret --name baalvion/razorpay      --secret-string '{"RAZORPAY_KEY_ID":"rzp_live_…","RAZORPAY_KEY_SECRET":"<…>","RAZORPAY_WEBHOOK_SECRET":"<…>"}'
```

### Stack B — CTM (`baalvion/ctm/*`)
```bash
aws secretsmanager create-secret --name baalvion/ctm/db        --secret-string '{"POSTGRES_PASSWORD":"<…>","DB_PASSWORD":"<same>"}'
aws secretsmanager create-secret --name baalvion/ctm/razorpay  --secret-string '{"RAZORPAY_KEY_ID":"rzp_live_…","RAZORPAY_KEY_SECRET":"<…>","RAZORPAY_WEBHOOK_SECRET":"<…>"}'
aws secretsmanager create-secret --name baalvion/ctm/jwt       --secret-string '{"JWT_PUBLIC_KEY":"<Stack A public PEM, single-line>"}'   # SSO verify; JWKS preferred (no secret)
```

### Stack C — Proxy (`baalvion/proxy/*`)
```bash
aws secretsmanager create-secret --name baalvion/proxy/db          --secret-string '{"POSTGRES_PASSWORD":"<…>","DB_PASSWORD":"<same>"}'
aws secretsmanager create-secret --name baalvion/proxy/jwt         --secret-string '{"JWT_ACCESS_SECRET":"<…>","JWT_REFRESH_SECRET":"<…>","CMS_JWT_PUBLIC_KEY":"<proxy RS256 public PEM>"}'
aws secretsmanager create-secret --name baalvion/proxy/secrets     --secret-string '{"CMS_SECRETS_KEY":"<rand -hex 32>","INTERNAL_SERVICE_SECRET":"<rand -hex 32>"}'
aws secretsmanager create-secret --name baalvion/proxy/razorpay    --secret-string '{"RAZORPAY_KEY_ID":"rzp_live_…","RAZORPAY_KEY_SECRET":"<…>","RAZORPAY_WEBHOOK_SECRET":"<…>"}'
# Proxy RS256 signing keypair lives in deploy/proxy-baalvionstack/secrets/keys/ (generated on host, §10 Stack C).
```

**Generate the raw values:**
```bash
pnpm run generate:keys                                   # config/keys/{private,public}.pem (RS256)
awk 'NF{printf "%s\\n",$0}' config/keys/private.pem      # -> JWT_PRIVATE_KEY (single-line)
awk 'NF{printf "%s\\n",$0}' config/keys/public.pem       # -> JWT_PUBLIC_KEY
openssl rand -base64 48                                  # JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
openssl rand -hex 32                                     # every *_SECRET / *_KEY / *_API_KEY
```

**Retrieve at deploy time (into each stack's `.env`):**
```bash
aws secretsmanager get-secret-value --secret-id baalvion/jwt-keys --query SecretString --output text
```

---

## 4. (intentionally merged into §3) — Secrets summary table

| Secret | Stack | Keys |
|--------|-------|------|
| baalvion/jwt-keys, jwt-symmetric, gateway, rbac, inventory, order, cms, audit, db, redis, superadmin, s3, email, razorpay | A | as above (**14 entries**) |
| baalvion/ctm/{db,razorpay,jwt} | B | **3 entries** |
| baalvion/proxy/{db,jwt,secrets,razorpay} | C | **4 entries** |

**Secrets total = 21** (Stack A **14** + Stack B **3** + Stack C **4**). The 14 Stack-A entries
are exactly the 14 `create-secret` commands in §3 — `s3` is skipped when the EC2 instance role
is used, but the entry is still defined.

---

## 5. ECR repositories (exact create commands) — 18 repos

```bash
# Stack A backend (10) + frontends (3) = 13
for r in auth-service auth-gateway rbac-service audit-service cms-service \
         commerce-service inventory-service order-service payment-service notification-service \
         admin-platform about-web amarise-web; do
  aws ecr create-repository --repository-name baalvion/$r --image-scanning-configuration scanOnPush=true --region $AWS_REGION || true
done

# Stack B CTM (2)
for r in controlthemarket-ctm-service controlthemarket-web; do
  aws ecr create-repository --repository-name baalvion/$r --image-scanning-configuration scanOnPush=true --region $AWS_REGION || true
done

# Stack C Proxy backend (3); the Proxy SPA is host-built static (no image)
for r in proxy-baalvionstack-cms-service proxy-baalvionstack-payment-service proxy-baalvionstack-proxy-service; do
  aws ecr create-repository --repository-name baalvion/$r --image-scanning-configuration scanOnPush=true --region $AWS_REGION || true
done

# Login (once per build host)
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $REG
```

> The legacy Stack B & C per-stack compose files now default to a neutral `baalvion` prefix; set
> `IMAGE_PREFIX=$REG/baalvion` (your ECR registry) in their `.env.prod`. **The canonical production
> path is `deploy/ec2-single-host/` (GitHub Actions → Amazon ECR → EC2 pull) — there is no GHCR
> anywhere in the pipeline.** See [`deploy/ec2-single-host/ECR-CICD.md`](deploy/ec2-single-host/ECR-CICD.md).

---

## 6. Docker image build order (build context = monorepo root)

> Image builds are independent (no inter-image build deps) — but build per stack. `redpanda`,
> `caddy`, `postgres`, `redis`, `kafka`, `zookeeper` are **public images** (no build).

### Stack A (13 images)
```bash
# Node backends (9)
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

# Java payment-service (own context)
docker build -f Backend/services/commerce/financial-services-java/Dockerfile \
  --build-arg SERVICE=payment-service -t $REG/baalvion/payment-service:prod-latest \
  Backend/services/commerce/financial-services-java
docker push $REG/baalvion/payment-service:prod-latest

# Frontends (3) — NEXT_PUBLIC_* are baked here; compose passes the same build.args on `up --build`
docker build -f Frontend/admin-platform/Dockerfile.deploy   -t $REG/baalvion/admin-platform:prod-latest .
docker build -f Frontend/about-baalvion-main/Dockerfile     -t $REG/baalvion/about-web:prod-latest .
docker build -f Frontend/AmariseMaisonAvenue-main/Dockerfile -t $REG/baalvion/amarise-web:prod-latest .
docker push $REG/baalvion/admin-platform:prod-latest
docker push $REG/baalvion/about-web:prod-latest
docker push $REG/baalvion/amarise-web:prod-latest
```
> ⚠️ admin-platform MUST use `Dockerfile.deploy` (it re-exports ARG→ENV so `NEXT_PUBLIC_*` inline).

### Stack B (2 images)
```bash
docker build -f Backend/services/ecosystem/ctm-service/Dockerfile -t $REG/baalvion/controlthemarket-ctm-service:prod-latest .
docker build -f Frontend/controlthemarket-main/Dockerfile         -t $REG/baalvion/controlthemarket-web:prod-latest .
docker push $REG/baalvion/controlthemarket-ctm-service:prod-latest
docker push $REG/baalvion/controlthemarket-web:prod-latest
```

### Stack C (3 images + host-built SPA)
```bash
docker build -f Backend/services/knowledge/cms-service/Dockerfile        -t $REG/baalvion/proxy-baalvionstack-cms-service:prod-latest .
docker build -f Backend/services/commerce/financial-services-java/Dockerfile --build-arg SERVICE=payment-service \
  -t $REG/baalvion/proxy-baalvionstack-payment-service:prod-latest Backend/services/commerce/financial-services-java
docker build -f Backend/services/infrastructure/proxy-service/Dockerfile -t $REG/baalvion/proxy-baalvionstack-proxy-service:prod-latest .
docker push $REG/baalvion/proxy-baalvionstack-cms-service:prod-latest
docker push $REG/baalvion/proxy-baalvionstack-payment-service:prod-latest
docker push $REG/baalvion/proxy-baalvionstack-proxy-service:prod-latest

# Proxy SPA is served as static files by Caddy (NOT an image) — build on the host (Stack C), §10.
```

---

## 7. Service deployment (boot) order

> Compose `depends_on` + healthchecks enforce most of this; the table is the contract.
> **Cross-stack bring-up order is A → C → B** (§10): stand up Stack A's auth/JWKS first, then
> Stack C, then Stack B (both verify SSO against Stack A).

### Stack A
| # | Service | Port | Waits on |
|---|---------|------|----------|
| 0 | redpanda | 9092 | — (payment-service requires it healthy) |
| 1 | auth-service | 3001 | RDS |
| 2 | rbac-service | 3055 | auth-service |
| 3 | audit-service | 3032 | auth-service |
| 4 | cms-service | 3018 | auth-service |
| 5 | commerce-service | 3012 | rbac-service |
| 6 | inventory-service | 3014 | auth-service |
| 7 | order-service | 3013 | rbac, inventory, cms |
| 8 | payment-service (Java, Flyway V001→V011) | 3015 | redpanda healthy |
| 9 | auth-gateway | 3099 | auth-service |
| 10 | notification-service | 3031 | — |
| 11 | admin-platform / about-web / amarise-web | 3030 / 3020 / 3033 | — |
| 12 | caddy | 80/443 | gateway + frontends + payment |

DB schema/boot order (self-healing via `CREATE SCHEMA IF NOT EXISTS`): auth → rbac → audit → cms →
commerce → inventory → orders → **payments (Flyway, BASELINE_ON_MIGRATE=true, BASELINE_VERSION=0)**.

### Stack C
`postgres + redis + zookeeper → kafka → cms-service (3011) → payment-service (3015) → proxy-service (4000) → caddy`

### Stack B
`postgres → ctm-service (3017) → web (3000) → caddy`

---

## 8. Route 53 records (exact)

All app records are **A records → the stack's Elastic IP** (Caddy terminates TLS on the host).

### Hosted zone `baalvion.com`
```bash
# Stack A: api, admin, apex, www, shop  -> EIP_A ;  Stack C public CMS: cms -> EIP_C
cat > /tmp/r53-baalvion.json <<JSON
{ "Changes": [
  {"Action":"UPSERT","ResourceRecordSet":{"Name":"api.baalvion.com","Type":"A","TTL":300,"ResourceRecords":[{"Value":"<EIP_A>"}]}},
  {"Action":"UPSERT","ResourceRecordSet":{"Name":"admin.baalvion.com","Type":"A","TTL":300,"ResourceRecords":[{"Value":"<EIP_A>"}]}},
  {"Action":"UPSERT","ResourceRecordSet":{"Name":"baalvion.com","Type":"A","TTL":300,"ResourceRecords":[{"Value":"<EIP_A>"}]}},
  {"Action":"UPSERT","ResourceRecordSet":{"Name":"www.baalvion.com","Type":"A","TTL":300,"ResourceRecords":[{"Value":"<EIP_A>"}]}},
  {"Action":"UPSERT","ResourceRecordSet":{"Name":"shop.baalvion.com","Type":"A","TTL":300,"ResourceRecords":[{"Value":"<EIP_A>"}]}},
  {"Action":"UPSERT","ResourceRecordSet":{"Name":"cms.baalvion.com","Type":"A","TTL":300,"ResourceRecords":[{"Value":"<EIP_C>"}]}}
]}
JSON
aws route53 change-resource-record-sets --hosted-zone-id <ZONE_BAALVION> --change-batch file:///tmp/r53-baalvion.json
#   + add the 3 SES DKIM CNAMEs returned by sesv2 create-email-identity, and an MX/TXT (SPF) if receiving.
```

### Hosted zone `controlthemarket.com` (Stack B → EIP_B)
```bash
aws route53 change-resource-record-sets --hosted-zone-id <ZONE_CTM> --change-batch '{"Changes":[
 {"Action":"UPSERT","ResourceRecordSet":{"Name":"controlthemarket.com","Type":"A","TTL":300,"ResourceRecords":[{"Value":"<EIP_B>"}]}},
 {"Action":"UPSERT","ResourceRecordSet":{"Name":"www.controlthemarket.com","Type":"A","TTL":300,"ResourceRecords":[{"Value":"<EIP_B>"}]}}
]}'
```

### Hosted zone `baalvionstack.com` (Stack C → EIP_C)
```bash
aws route53 change-resource-record-sets --hosted-zone-id <ZONE_BSTACK> --change-batch '{"Changes":[
 {"Action":"UPSERT","ResourceRecordSet":{"Name":"proxy.baalvionstack.com","Type":"A","TTL":300,"ResourceRecords":[{"Value":"<EIP_C>"}]}}
]}'
```

| Record | Type | Target | Stack |
|--------|------|--------|-------|
| api / admin / baalvion.com / www / shop .baalvion.com | A | EIP_A | A |
| cms.baalvion.com | A | EIP_C | C |
| 3× SES DKIM | CNAME | (from SES) | A |
| controlthemarket.com / www | A | EIP_B | B |
| proxy.baalvionstack.com | A | EIP_C | C |

---

## 9. SSL / TLS certificate plan

**All public hostnames use Caddy automatic TLS (Let's Encrypt, HTTP-01).** No ACM/ALB in these packages.

- **Requirements:** ports **80 + 443** open to the internet on every host (HTTP-01 challenge + redirect),
  and the Route 53 A record must resolve to the EIP **before** first request (Caddy issues on demand).
- **Per stack / domains issued automatically:**
  - Stack A (Caddy): `api`, `admin`, `baalvion.com`, `www`, `shop` (5 certs/SANs).
  - Stack B (Caddy): `controlthemarket.com` (+ www if added). `ACME_EMAIL` from `.env`.
  - Stack C (Caddy): `proxy.baalvionstack.com` **and** `cms.baalvion.com`.
- **ACME account email:** `ACME_EMAIL` in each `.env` (MVP currently `infra.baalvion@gmail.com`).
- **Renewal:** automatic (Caddy renews ~30 days before expiry); `caddy_data` volume persists certs across restarts.
- **Verify after DNS propagates:**
  ```bash
  for h in api.baalvion.com admin.baalvion.com baalvion.com shop.baalvion.com cms.baalvion.com \
           controlthemarket.com proxy.baalvionstack.com; do
    echo "== $h =="; curl -sSI https://$h | head -1; done
  ```
- **Optional (NOT in packages):** CloudFront in front of S3 media (`S3_PUBLIC_URL`) → requires an **ACM cert in `us-east-1`** for e.g. `media.baalvion.com`. Only needed if you front media with CloudFront.

---

## 10. Full deploy command sequence (per stack)

> **Deploy in canonical order: Stack A → Stack C → Stack B.** Stack A must be live (auth/JWKS
> reachable at `api.baalvion.com`) before Stack C and Stack B come up, since both verify SSO
> against it.

### Stack A — MVP storefront
```bash
# 10A.1 init DB roles (ONCE, as RDS master, TLS) — baalvion_app MUST exist before payment-service
psql "host=$RDS_ENDPOINT dbname=baalvion_db user=baalvion sslmode=require" \
  -v baalvion_pw='<DB_PASSWORD>' -v baalvion_app_pw='<DB_APP_PASSWORD>' \
  -f deploy/mvp-production/init-roles.sql

# 10A.2 build .env.production from the example + Secrets Manager values
cp deploy/mvp-production/.env.production.example deploy/mvp-production/.env.production
#   fill DOMAIN_*, DB_HOST=$RDS_ENDPOINT, REDIS_HOST=<elasticache-endpoint>, S3_*, AMARISE_*,
#   and every 🔒 from `aws secretsmanager get-secret-value ...`

# 10A.3 deploy (images pulled from ECR; or add --build to build locally)
docker compose -f deploy/mvp-production/docker-compose.yml \
  --env-file deploy/mvp-production/.env.production up -d

# 10A.4 watch
docker compose -f deploy/mvp-production/docker-compose.yml ps
docker compose -f deploy/mvp-production/docker-compose.yml logs -f payment-service auth-service

# 10A.5 post-boot: re-run the schema-grant block so baalvion_app gets USAGE on all schemas
psql "host=$RDS_ENDPOINT dbname=baalvion_db user=baalvion sslmode=require" \
  -v baalvion_pw='<DB_PASSWORD>' -v baalvion_app_pw='<DB_APP_PASSWORD>' \
  -f deploy/mvp-production/init-roles.sql
```

### Stack C — Proxy / BaalvionStack
```bash
# 10C.1 RS256 keypair for proxy-service (read-only mount) + CMS public-key reuse
mkdir -p deploy/proxy-baalvionstack/secrets/keys
#   place baalvion-key-1.key (private) + baalvion-key-1.pub in secrets/keys (see package runbook §5/§14)

# 10C.2 build the SPA on the host (served static by Caddy) — includes the v1.0.1 PayU prod-routing fix
pnpm install --frozen-lockfile
pnpm --filter proxy-baalvionstack-web build      # -> Frontend/Proxy-BaalvionStack/dist (Caddy mounts it)

# 10C.3 env + up
cp deploy/proxy-baalvionstack/.env.prod.example deploy/proxy-baalvionstack/.env.prod 2>/dev/null || true
#   set DOMAIN=proxy.baalvionstack.com, CMS_DOMAIN=cms.baalvion.com, ACME_EMAIL, POSTGRES_*, DB_*, REDIS_*,
#   JWT_* (+ JWT_ACTIVE_KID, JWT_KEYS_DIR=/app/config/keys), CMS_SECRETS_KEY, INTERNAL_SERVICE_SECRET,
#   CMS_JWT_PUBLIC_KEY, CMS_BASE_URL=http://cms-service:3011, PAYMENT_SERVICE_URL=http://payment-service:3015,
#   PAYMENT_SITE_SLUG, Razorpay keys, PUBLIC_APP_URL=https://proxy.baalvionstack.com,
#   CORS_ORIGINS / CMS_CORS_ORIGINS, PSP_MOCK=false, APP_SECURITY_ENABLED=true,
#   SPRING_FLYWAY_BASELINE_ON_MIGRATE=true, SPRING_FLYWAY_BASELINE_VERSION=0
docker compose --env-file deploy/proxy-baalvionstack/.env.prod \
  -f deploy/proxy-baalvionstack/docker-compose.prod.yml up -d
```

### Stack B — ControlTheMarket
```bash
cp deploy/controlthemarket/.env.prod.example deploy/controlthemarket/.env.prod 2>/dev/null || true
#   set DOMAIN=controlthemarket.com, ACME_EMAIL, POSTGRES_*, DB_*, CORS_ORIGINS=https://controlthemarket.com,
#   JWT_JWKS_URI=https://api.baalvion.com/api/v1/identity/auth/v1/auth/.well-known/jwks.json (central SSO),
#   JWT_ISSUER=baalvion-auth, JWT_AUDIENCE=baalvion-platform,
#   AUTH_PROXY_TARGET=https://api.baalvion.com/auth, NEXT_PUBLIC_CTM_API_URL=https://controlthemarket.com/api/v1,
#   NEXT_PUBLIC_APP_URL=https://controlthemarket.com, NEXT_PUBLIC_USE_MOCK=false, Razorpay LIVE keys,
#   PAYMENT_SUCCESS_URL/PAYMENT_CANCEL_URL, (optional IMAGE_PREFIX=$REG/baalvion to use ECR)
docker compose --env-file deploy/controlthemarket/.env.prod \
  -f deploy/controlthemarket/docker-compose.prod.yml up -d
```

### Razorpay webhooks (after hosts are up + DNS/TLS live)
- Stack A (storefront): `https://api.baalvion.com/api/v1/orders/webhooks/razorpay` (HMAC, strict amount).
  Events: `payment.captured`, `payment.authorized`, `payment.failed`, `order.paid`, `refund.processed`, `refund.created`, `payment.refunded`.
- Stack B (CTM): `https://controlthemarket.com/api/v1/payments/webhook`.
- Stack C (Proxy): `https://proxy.baalvionstack.com/v1/billing/webhook/razorpay`.

### Smoke test (per stack)
```bash
# Stack A health (on host)
for p in 3001:health 3099:health 3055:health 3018:health 3012:readyz 3014:readyz 3013:readyz 3031:health 3032:readyz; do
  curl -fsS http://localhost:${p%%:*}/${p##*:} >/dev/null && echo "OK ${p%%:*}"; done
curl -fsS http://localhost:3015/actuator/health   # payment-service -> UP
# Public edges
curl -sSI https://api.baalvion.com | head -1
curl -sSI https://controlthemarket.com | head -1
curl -sSI https://proxy.baalvionstack.com | head -1
```

### Rollback (any stack)
```bash
IMAGE_TAG=prod-<prev> docker compose -f deploy/<stack>/docker-compose*.yml --env-file deploy/<stack>/.env* up -d
# Schemas are forward-only (Sequelize + Flyway) — roll back the app tier, not the DB. RDS 7-day PITR.
```

---

## 11. Out of scope (build-ready, NOT deployable from committed state)

These have Dockerfiles but **no deploy package, domains, or backends** in `v1.0.1-frontend-hardening`:

| Frontend | Missing for deploy |
|----------|--------------------|
| Law-Elite-Network | `law-service` backend, domain, compose/Caddy wiring, `AUTH_SERVICE_URL`/`CMS_PUBLIC_URL` env |
| Imperialpedia | `imperialpedia-service` + cms backend, domain, compose/Caddy wiring |
| Global-Trade-Infrastructure | own **RDS/Postgres** (`DATABASE_URL`) + `prisma migrate deploy`, trade backend + gateway, domain, compose |

Build commands (images only — **do not deploy** until packaged):
```bash
docker build -f Frontend/Law-Elite-Network-main/Dockerfile            -t $REG/baalvion/law-elite-web:prod-latest .
docker build -f Frontend/Imperialpedia-main/Dockerfile                -t $REG/baalvion/imperialpedia-web:prod-latest .
docker build -f Frontend/Global-Trade-Infrastructure-main/Dockerfile  -t $REG/baalvion/gti-web:prod-latest .   # build recursively; needs DATABASE_URL at runtime
```
To bring these to production, author a deploy package per app (compose + Caddy + `.env` + domain +
their backend service) following `deploy/mvp-production` as the template, then add them here.

---

## 12. Known MVP simplifications (intentional — from package runbooks)
- Ledger posting off (`LEDGER_INTERNAL_KEY` empty → order-service fail-open).
- Redpanda single-node (not MSK); Stacks B/C run in-compose Postgres (not RDS) — migrate to managed before scale.
- Static S3 keys acceptable day-1; prefer EC2 instance role.
- SES sandbox must be exited before real email; harden `UPLOAD_SCAN_REQUIRED=true`, RDS Multi-AZ, ElastiCache replica, WAF before real traffic.

# AWS Resource Creation Order — Baalvion MVP (v1.0.0-mvp)

> ⚠️ **DEPRECATED — superseded by [MASTER_DEPLOYMENT_COMMANDS.md](MASTER_DEPLOYMENT_COMMANDS.md).**
> Legacy reference only. This document provisions **Stack A (MVP storefront) on a single EC2 host**.
> The production architecture is **3 independent stacks** — see MASTER for the authoritative
> **18 ECR repos**, **21 Secrets Manager entries** (14 / 3 / 4), **3 Route 53 zones**
> (baalvion.com · controlthemarket.com · baalvionstack.com), and the **A → C → B** deploy order.
> The ECS/ALB "scale-out path" below is **not** the shipped model (the stacks use Caddy auto-TLS on EC2).
> Where this file disagrees with MASTER, **MASTER wins.**

> **Scope:** Exact dependency-ordered list of AWS resources to provision for the
> `deploy/mvp-production` stack. **Region: `ap-south-1` (Mumbai)** — closest to
> Razorpay/INR settlement.
> **Stack model:** one EC2 host runs `deploy/mvp-production/docker-compose.yml`
> (backend services + Caddy ingress + single-node Redpanda). RDS, ElastiCache, S3,
> SES, Secrets Manager are managed AWS services. ECR holds the images. ECS/ALB are
> listed as the optional scale-out path.
>
> Provision **strictly top to bottom** — each resource depends on the ones above it.
> Do not create a later resource before its prerequisites are `available`.

---

## Dependency overview

```
VPC
 └─ Subnets (public ×2 + private ×2, 2 AZs)
     └─ Internet Gateway + NAT + Route tables
         └─ Security Groups (sg-edge, sg-app, sg-data)
             ├─ RDS PostgreSQL        (sg-data)
             ├─ ElastiCache Redis     (sg-data)
             ├─ S3 bucket             (IAM, not SG-bound)
             ├─ SES identities + SMTP creds
             ├─ Secrets Manager entries
             ├─ ECR repositories
             └─ EC2 host / ECS cluster (sg-app)
                 └─ Load Balancer / Caddy (sg-edge)
                     └─ ACM certificates
                         └─ Route 53 records
```

---

## 1. VPC

| Item | Value |
|------|-------|
| Name | `baalvion-prod-vpc` |
| CIDR | `10.20.0.0/16` |
| AZs | `ap-south-1a`, `ap-south-1b` |
| Public subnets | `10.20.1.0/24` (1a), `10.20.2.0/24` (1b) — EC2 host / ALB / NAT |
| Private subnets | `10.20.11.0/24` (1a), `10.20.12.0/24` (1b) — RDS, ElastiCache |
| Internet Gateway | `baalvion-prod-igw` attached to VPC |
| NAT Gateway | one in a public subnet (egress for private subnets) |
| Route tables | public → IGW; private → NAT |
| DNS | `enableDnsSupport=true`, `enableDnsHostnames=true` |

```bash
aws ec2 create-vpc --cidr-block 10.20.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=baalvion-prod-vpc}]'
# then: create-subnet ×4, create-internet-gateway, attach-internet-gateway,
#       create-nat-gateway, create-route-table ×2, associate-route-table
```

**Gate:** VPC + 4 subnets + IGW + NAT all `available`. RDS subnet group needs ≥2 AZs.

---

## 2. Security Groups

Create three SGs in `baalvion-prod-vpc`. Reference SGs by ID (not CIDR) for app↔data traffic.

| SG | Name | Inbound | Source |
|----|------|---------|--------|
| **sg-edge** | `baalvion-edge-sg` | 80/tcp, 443/tcp | `0.0.0.0/0` (public ingress → Caddy/ALB) |
| **sg-app** | `baalvion-app-sg` | 80/443 from `sg-edge`; 22/tcp | `sg-edge`; admin IP allowlist for SSH |
| **sg-data** | `baalvion-data-sg` | 5432/tcp (Postgres), 6379/tcp (Redis) | **`sg-app` only** |

```bash
aws ec2 create-security-group --group-name baalvion-edge-sg --vpc-id <vpc> --description "Public ingress"
aws ec2 create-security-group --group-name baalvion-app-sg  --vpc-id <vpc> --description "App host/tasks"
aws ec2 create-security-group --group-name baalvion-data-sg --vpc-id <vpc> --description "RDS + Redis"
# sg-data ingress 5432 + 6379 sourced from sg-app group-id ONLY (no public DB access)
```

**Gate:** `sg-data` must NOT allow `0.0.0.0/0` on 5432/6379. RDS/Redis are created `--no-publicly-accessible` / private subnet group.

---

## 3. RDS PostgreSQL

| Item | Value |
|------|-------|
| Identifier | `baalvion-prod` |
| Engine | PostgreSQL 16 |
| Class | `db.t4g.medium` (MVP) |
| Storage | 50 GB gp3, `--storage-encrypted` |
| Master user | `baalvion` (= owner/migration role) |
| DB name | `baalvion_db` |
| Subnet group | private subnets (2 AZs) |
| SG | `sg-data` |
| Access | `--no-publicly-accessible` |
| Backups | `--backup-retention-period 7` (7-day PITR) |
| Param group | `rds.force_ssl = 1` (TLS required; matches `DB_SSL=require`) |

```bash
aws rds create-db-subnet-group --db-subnet-group-name baalvion-prod-db \
  --db-subnet-group-description "Baalvion prod" --subnet-ids <priv-1a> <priv-1b>

aws rds create-db-instance \
  --db-instance-identifier baalvion-prod \
  --engine postgres --engine-version 16 \
  --db-instance-class db.t4g.medium \
  --allocated-storage 50 --storage-type gp3 --storage-encrypted \
  --master-username baalvion --master-user-password '<DB_PASSWORD>' \
  --db-name baalvion_db \
  --db-subnet-group-name baalvion-prod-db \
  --vpc-security-group-ids <sg-data> \
  --backup-retention-period 7 --no-publicly-accessible
```

> **After `available`** the runtime RLS role `baalvion_app` and schema grants are
> created by `init-roles.sql` (see the deployment runbook — this happens *after*
> Secrets Manager and *before* services start). `baalvion_app` must exist before
> payment-service runs Flyway.

**Gate:** instance `available`, endpoint reachable from `sg-app`, TLS enforced.

---

## 4. Redis (ElastiCache)

| Item | Value |
|------|-------|
| Replication group | `baalvion-prod` |
| Engine | Redis 7.1 |
| Node type | `cache.t4g.small` |
| Topology | 1 node group, 0 replicas (MVP) |
| Encryption | `--transit-encryption-enabled`, `--auth-token <REDIS_PASSWORD>` |
| Subnet group | private subnets |
| SG | `sg-data` |
| Param group | **`maxmemory-policy = noeviction`** (queues + `baalvion:events` stream must never be evicted) |

```bash
aws elasticache create-cache-subnet-group --cache-subnet-group-name baalvion-prod-redis \
  --cache-subnet-group-description "Baalvion prod" --subnet-ids <priv-1a> <priv-1b>

aws elasticache create-replication-group \
  --replication-group-id baalvion-prod \
  --replication-group-description "Baalvion MVP" \
  --engine redis --engine-version 7.1 \
  --cache-node-type cache.t4g.small \
  --num-node-groups 1 --replicas-per-node-group 0 \
  --transit-encryption-enabled --auth-token '<REDIS_PASSWORD>' \
  --cache-subnet-group-name baalvion-prod-redis \
  --security-group-ids <sg-data> --snapshot-retention-limit 3
```

**Gate:** `noeviction` policy confirmed; primary endpoint reachable from `sg-app`.

---

## 5. S3 (media bucket)

| Item | Value |
|------|-------|
| Bucket | `baalvion-media-prod` (region `ap-south-1`) |
| Public access block | all four blocks `true` |
| Encryption | SSE-S3 (AES256) default |
| CORS | `GET,HEAD` from `baalvion.com`, `shop.baalvion.com`, `admin.baalvion.com` |
| Consumers | cms-service + commerce-service (`MEDIA_DRIVER=s3`) |

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
```

> **Preferred:** attach an IAM role to the EC2 host / ECS task with
> `s3:PutObject,GetObject` on this bucket instead of static `S3_ACCESS_KEY/SECRET`.
> Optionally front the bucket with CloudFront and point `S3_PUBLIC_URL` at the CDN domain.

**Gate:** bucket exists, public-access fully blocked, CORS applied.

---

## 6. SES (email)

| Item | Value |
|------|-------|
| Domain identity | `baalvion.com` (+ DKIM CNAMEs added to Route 53 — see step 11) |
| Sender identity | `noreply@baalvion.com` (`EMAIL_FROM`) |
| SMTP endpoint | `email-smtp.ap-south-1.amazonaws.com:587` |
| SMTP creds | IAM user with `ses:SendRawEmail` → `SMTP_USER` / `SMTP_PASS` |
| Production access | **request sandbox exit** (else only verified recipients get mail) |
| Consumers | auth-service (verification mail) + notification-service |

```bash
aws sesv2 create-email-identity --email-identity baalvion.com
aws sesv2 create-email-identity --email-identity noreply@baalvion.com
# Add the 3 DKIM CNAMEs to Route 53 (step 11), then request production access in console.
# Create SMTP credentials → SMTP_USER / SMTP_PASS (store in Secrets Manager, step 7).
```

**Gate:** domain + sender verified (DKIM green); production access requested. DKIM
CNAMEs depend on the hosted zone (step 11) — create the zone first if not present, or
loop back.

---

## 7. Secrets Manager

Create one secret per logical group (matches the runbook key layout). Populate from
generated values (RS256 keypair + `openssl rand`). See **AWS_SECRETS_CHECKLIST.md** for
the exhaustive variable list and which service consumes each.

| Secret name | Contents |
|-------------|----------|
| `baalvion/jwt-keys` | `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` |
| `baalvion/jwt-symmetric` | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` |
| `baalvion/gateway` | `GATEWAY_SIGNING_SECRET`, `INTERNAL_SERVICE_SECRET` |
| `baalvion/rbac` | `RBAC_INTERNAL_API_KEY` |
| `baalvion/inventory` | `INVENTORY_INTERNAL_KEY`, `JWT_ACCESS_SECRET` |
| `baalvion/order` | `CART_SESSION_SECRET` |
| `baalvion/cms` | `CMS_SECRETS_KEY` |
| `baalvion/audit` | `AUDIT_INTERNAL_KEY` |
| `baalvion/db` | `DB_PASSWORD`, `DB_APP_PASSWORD` |
| `baalvion/redis` | `REDIS_PASSWORD` |
| `baalvion/superadmin` | `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` |
| `baalvion/s3` | `S3_ACCESS_KEY`, `S3_SECRET_KEY` (skip if IAM role) |
| `baalvion/email` | `SMTP_USER`, `SMTP_PASS` |
| `baalvion/razorpay` | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |

**Gate:** every 🔒 value present; `DB_PASSWORD`/`DB_APP_PASSWORD` here match what
`init-roles.sql` will set.

---

## 8. ECR repositories

One repo per image. Backend (9 Node + 1 Java) + 3 MVP frontends.

```bash
for r in auth-service auth-gateway rbac-service notification-service audit-service \
         cms-service commerce-service inventory-service order-service payment-service \
         admin-platform about-web amarise-web; do
  aws ecr create-repository --repository-name baalvion/$r \
    --image-scanning-configuration scanOnPush=true --region ap-south-1
done
```

> Post-MVP frontends (controlthemarket, law-elite, imperialpedia, GTI, proxy) get their
> own repos when those sites deploy — out of the MVP compose stack.

**Gate:** all 13 repos exist; build host can `docker login` to the registry.

---

## 9. ECS Cluster (or EC2 host)

**MVP path (default): single EC2 host running docker-compose.**

| Item | Value |
|------|-------|
| Instance | `t3.large` (or larger), Amazon Linux 2023 + Docker + compose v2 |
| Subnet | public subnet |
| SG | `sg-app` |
| IAM role | `secretsmanager:GetSecretValue` (read `baalvion/*`) + `s3:*Object` on media bucket + ECR pull |
| EIP | allocate + associate (stable target for DNS) |

```bash
aws ec2 run-instances --image-id <al2023-ami> --instance-type t3.large \
  --subnet-id <pub-1a> --security-group-ids <sg-app> \
  --iam-instance-profile Name=baalvion-app-profile \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=baalvion-prod-host}]'
aws ec2 allocate-address && aws ec2 associate-address --instance-id <id> --allocation-id <eipalloc>
```

**Scale-out path (optional):** ECS Fargate cluster `baalvion-prod`, one service per
image, task IAM role for Secrets Manager + S3, awsvpc networking in `sg-app`. Replaces
the EC2 host; the ALB (step 10) becomes mandatory.

**Gate:** host/cluster can reach RDS + Redis (sg-app→sg-data) and pull from ECR.

---

## 10. Load Balancer

**MVP path:** **Caddy** (in the compose stack) is the ingress + automatic TLS. The only
external requirement is opening 80/443 on `sg-edge` to the EC2 host EIP. No ALB needed
for the single-host MVP.

**Scale-out path:** Application Load Balancer in public subnets, `sg-edge`, target group
→ ECS service (port 443/Caddy or per-service). HTTPS listener uses the ACM cert (step 12).
Health-check path `/health` per target.

```bash
# Scale-out only:
aws elbv2 create-load-balancer --name baalvion-prod-alb \
  --subnets <pub-1a> <pub-1b> --security-groups <sg-edge> --type application
```

**Gate:** ingress reachable on 443; if ALB, target group healthy.

---

## 11. Route 53 records

Hosted zone `baalvion.com`. Point records at the EC2 EIP (MVP) or the ALB alias (scale-out).

| Record | Type | Target |
|--------|------|--------|
| `baalvion.com` (apex) | A / ALIAS | EIP / ALB |
| `www.baalvion.com` | A / CNAME | apex |
| `api.baalvion.com` | A / ALIAS | EIP / ALB |
| `admin.baalvion.com` | A / ALIAS | EIP / ALB |
| `shop.baalvion.com` | A / ALIAS | EIP / ALB |
| SES DKIM ×3 | CNAME | (from step 6 output) |
| `_dmarc`, SPF (TXT) | TXT | optional, recommended for deliverability |

> Domains are fixed by the deploy env: `DOMAIN_API=api.baalvion.com`,
> `DOMAIN_ADMIN=admin.baalvion.com`, `DOMAIN_WEB=baalvion.com`,
> `DOMAIN_SHOP=shop.baalvion.com`. They must resolve before Caddy can issue certs.

**Gate:** all five hostnames resolve to the host; DKIM CNAMEs published.

---

## 12. SSL certificates

**MVP path:** **Caddy issues and renews Let's Encrypt certificates automatically** on
first HTTPS request for each host (`ACME_EMAIL=infra.baalvion@gmail.com`). Requirements:
DNS resolves (step 11) **and** 80/443 reachable from the internet (`sg-edge`). No ACM
resource to create.

**Scale-out path (ALB):** request an ACM cert in `ap-south-1` covering the four
hostnames, validate via DNS (Route 53), attach to the ALB HTTPS listener.

```bash
# Scale-out only:
aws acm request-certificate --domain-name baalvion.com \
  --subject-alternative-names www.baalvion.com api.baalvion.com admin.baalvion.com shop.baalvion.com \
  --validation-method DNS --region ap-south-1
# add the CNAME validation records to Route 53, wait for ISSUED, attach to ALB listener.
```

**Gate (final):** `https://api.baalvion.com/health`, `https://admin.baalvion.com`,
`https://baalvion.com`, `https://shop.baalvion.com` all serve valid TLS.

---

## Creation-order summary (one-line checklist)

```
[ ]  1. VPC + subnets + IGW + NAT + route tables
[ ]  2. Security groups: sg-edge, sg-app, sg-data
[ ]  3. RDS PostgreSQL 16  (sg-data, private, TLS forced)
[ ]  4. ElastiCache Redis 7.1  (sg-data, noeviction, auth-token)
[ ]  5. S3 media bucket  (public-access blocked, CORS, SSE)
[ ]  6. SES identities + SMTP creds  (request sandbox exit)
[ ]  7. Secrets Manager  (14 secret groups)
[ ]  8. ECR repos  (13 images)
[ ]  9. EC2 host (+ EIP + IAM profile)  OR  ECS cluster
[ ] 10. Ingress: Caddy (MVP) or ALB (scale-out)
[ ] 11. Route 53 records (5 hosts + DKIM)
[ ] 12. SSL: Caddy auto-TLS (MVP) or ACM cert (scale-out)
```

> After resources exist, follow **AWS_DEPLOYMENT_RUNBOOK.md** for the execution order
> (init-roles.sql → migrations → services → frontends → DNS → SSL → Razorpay → smoke).

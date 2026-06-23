# 02 · AWS Resources & Image Inventory

## 4. Required AWS resources

### Core (single-host MVP — matches `docker-compose.prod.yml`)

| Resource | Spec | Purpose | Notes |
|---|---|---|---|
| **EC2** | 1 × `t3.large` (x86_64, 2 vCPU / 8 GB) | Docker host for all containers | x86_64 — matches CI (`ubuntu-latest`); image built `linux/amd64` |
| **EBS** | 50 GB gp3 root | OS + images + container volumes | 6.6 GB Node image + neo4j/kafka volumes |
| **Elastic IP** | 1 | stable ingress for Route 53 | attach to the instance |
| **RDS PostgreSQL** | `db.t3.small`, 20 GB gp3, **Multi-AZ for prod** | the one database (per-domain schemas) | app user needs `CREATE`; automated backups + PITR |
| **ECR** | 2 repos: `baalvion-backend`, `baalvion-payments` | image registry | lifecycle policy to expire old tags |
| **Route 53** | hosted zone + A/ALIAS records | DNS for `*.baalvion.com` | records must resolve before Caddy issues certs |
| **ACM / Caddy ACME** | — | TLS | Caddy auto-issues via Let's Encrypt by default; ACM only if you front with an ALB |
| **S3** | `baalvion-prod-media` (versioned) | trade/law/cms media & documents | access via the EC2 **instance role**, not keys |
| **SES** | verified domain + SMTP creds | transactional email | move out of the SES sandbox; SPF/DKIM/DMARC |
| **Secrets Manager / SSM** | parameters for every `[SECRET]` | secret injection at deploy | SecureString; rotation schedule |
| **CloudWatch** | log group `/baalvion/consolidated` + alarms | logs, metrics, alerting | see [06](06-monitoring-and-alerting.md) |
| **IAM** | instance role (ECR pull, SSM read, S3, SES, CW, logs) + CI deploy role (OIDC) | least-privilege access | no long-lived keys on the box |
| **Security Groups** | EC2: 443/80 from internet, 22 from admin/SSM only; RDS: 5432 from EC2 SG only | network isolation | prefer SSM Session Manager over open 22 |
| **VPC** | public subnet (EC2+EIP) + private subnets (RDS Multi-AZ) | network | 2 AZs minimum for RDS Multi-AZ |

### Add for the `payments` profile

| Resource | Spec | Purpose |
|---|---|---|
| **Kafka** | on-box `cp-kafka` + `cp-zookeeper` (MVP) → **Amazon MSK** at scale | payment-service event bus (@EnableKafka) |

### Optional / scale-out

| Resource | When | Purpose |
|---|---|---|
| **ElastiCache (Redis)** | 10x+ | replace on-box Redis; HA + larger memory |
| **OpenSearch / Elasticsearch** | when search must be non-degraded | `search-service` (503 without it) + `jobs-service` |
| **ALB + ACM** | HA / multi-instance | replace Caddy edge; host/path rules mirror the Caddyfile |
| **ECS Fargate / EKS** | 100x | one image, N task/pod defs (see [docs/deployment/06-ecs-migration.md](../06-ecs-migration.md)) |
| **RDS Proxy** | if any service moves to Lambda | connection pooling for `pg`/Sequelize |
| **EFS** | multi-instance | shared media if not fully on S3 |

## 5. Docker image inventory

| Image | Source | Size | Runs | Build |
|---|---|---:|---|---|
| **`baalvion-backend`** | `Dockerfile.node` (full Backend pnpm workspace) | **~6.6 GB** | all 6 Node app containers (pm2 personality per container) | CI `docker buildx --platform linux/amd64`, push to ECR |
| **`baalvion-payments`** | `Dockerfile.java` (scoped `mvn -pl payment-service -am`) | **~585 MB** | the JVM payment container | CI, ECR |
| `redis:7-alpine` | Docker Hub | ~41 MB | on-box cache/queues | pinned |
| `neo4j:5` | Docker Hub | ~600 MB | graph for network-graph-service | pinned; **required** |
| `caddy:2-alpine` | Docker Hub | ~50 MB | TLS edge | pinned |
| `confluentinc/cp-kafka:7.6.1` | Docker Hub | ~800 MB | payments event bus | `payments` profile |
| `confluentinc/cp-zookeeper:7.6.1` | Docker Hub | ~800 MB | Kafka coordination | `payments` profile |
| ~~`mailhog` / `axllent/mailpit`~~ | — | — | **dry-run only — replaced by SES** | excluded from prod |

> **⚠ Image-size risk — the 6.6 GB Node image.** It bundles the entire Backend workspace
> (all services + node_modules). It pulls/scans/promotes slowly and inflates EBS/ECR.
> Mitigations (no code change required): `.dockerignore` is already trimming Frontend/git;
> additionally consider a multi-stage build that runs `pnpm install --prod` and prunes dev
> deps, deduping the pnpm store, and removing build caches. Track this as a hardening item —
> it does not block first deploy but matters for fast rollbacks. Tag images by **git sha**
> (`prod-<sha>`), not only `prod-latest`, so rollback is a tag change.

➡ Next: [03 · Sizing & cost](03-sizing-and-cost.md)

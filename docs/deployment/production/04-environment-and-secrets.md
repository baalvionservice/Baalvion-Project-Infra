# 04 · Environment & Secrets

Template: [`deploy/consolidated/.env.production.example`](../../../deploy/consolidated/.env.production.example).
At deploy, `.env` is **generated from SSM/Secrets Manager** — never committed. Every Node
process inherits these via the container env; pm2 adds the per-process `PORT`.

## 9. Environment variable inventory

| Variable | Consumers | Required | Default / example |
|---|---|---|---|
| `NODE_ENV` | all | yes | `production` |
| `DB_HOST` `DB_PORT` `DB_NAME` `DB_USER` | all (Sequelize) | yes | RDS endpoint / `5432` / `baalvion` / `baalvion_app` |
| `DB_SSL` | all | yes (prod) | `true` |
| `DB_JDBC_PARAMS` | payments JVM | yes | `?sslmode=require` |
| `REDIS_HOST` `REDIS_PORT` | all (queues/sessions/cache) | yes | `redis` / `6379` |
| `NEO4J_URI` `NEO4J_USER` `NEO4J_PASSWORD` `NEO4J_DATABASE` | network-graph (app-trade) | **yes — boot-blocking** | `bolt://neo4j:7687` / `neo4j` |
| `JWT_ISSUER` `JWT_AUDIENCE` | auth + consumers | yes | `baalvion-auth` / `baalvion-platform` |
| `ISLAND_AUTH_MODE` | auth, BFFs | yes (prod) | `strict` |
| `APP_SECURITY_ENABLED` | payments JVM | yes | `false` *(edge-locked — see note)* |
| `PSP_MOCK` | order/commerce/ctm | yes | `false` (prod) |
| `RATE_LIMIT_IP_MAX` | gateways | no | `1000` |
| `CORS_ORIGINS` | all HTTP | yes | `https://app.baalvion.com,…` |
| `SMTP_HOST` `SMTP_PORT` | notification, auth email | yes | `email-smtp.ap-south-1.amazonaws.com` / `587` |
| `EMAIL_FROM` | notification, auth | yes | `noreply@baalvion.com` (SES-verified) |
| `AWS_REGION` `S3_BUCKET` | trade, law, cms | yes (media) | `ap-south-1` / `baalvion-prod-media` |
| `KAFKA_BOOTSTRAP` / `SPRING_KAFKA_BOOTSTRAP_SERVERS` | payments JVM | yes (payments) | `kafka:9092` |
| `OPENSEARCH_URL` | search-service | no (degrades) | unset ⇒ 503 degraded |
| `ES_URL` / `ELASTICSEARCH_URL` | jobs-service | no (DB fallback) | unset ⇒ DB search |
| `ECR_REGISTRY` `IMAGE_TAG` | compose/deploy | yes | `<acct>.dkr.ecr…` / `prod-<sha>` |
| `SUPERADMIN_EMAIL` | bootstrap script | once | `ops@baalvion.com` |

> **`APP_SECURITY_ENABLED=false` note:** proven core-stack pattern — the JVM's own security is
> off and the **Caddy edge denies** its sensitive paths (`/refund`, `/capture`, `/actuator/*`,
> internal). Flipping to `true` requires configuring the JVM's auth or webhooks 401. Decide
> explicitly; document the choice. This is **not** a dry-run artifact.

## 10. Secrets inventory

All of these are `[SECRET]` — store in **Secrets Manager / SSM SecureString**, inject at deploy,
rotate on a schedule, and keep out of git (push-protection + `.gitignore` already enforce this).

| Secret | Consumer(s) | Rotation | Notes |
|---|---|---|---|
| `DB_PASSWORD` | all | 90d | RDS app user |
| `NEO4J_PASSWORD` | network-graph, neo4j | 90d | |
| `JWT_PRIVATE_KEY_B64` | auth-service (signs) | on incident / 180d | base64 of RSA private PEM; KMS-backed |
| **`JWT_PUBLIC_KEY`** | **all fleet consumers (verify)** | with the keypair | **⚠ must be the PEM itself as a `\n`-escaped string, NOT a path** — see risk R1 in [07](07-risks-and-readiness.md) |
| `JWT_ACCESS_SECRET` `JWT_REFRESH_SECRET` | auth | 180d | ≥32 chars |
| `GATEWAY_SIGNING_SECRET` | gateways/BFFs | 90d | service-to-service trust |
| `INTERNAL_SERVICE_SECRET` | all (x-internal-secret) | 90d | internal API auth |
| `METRICS_SECRET` | proxy/metrics | 90d | |
| `CART_SESSION_SECRET` | order-service | 90d | signed guest cart |
| `BILLING_SIGNING_SECRET` | law/billing | 90d | |
| `RBAC_INTERNAL_API_KEY` | rbac consumers | 90d | |
| `AUDIT_INTERNAL_KEY` | audit ingestion | 90d | |
| `CMS_SECRETS_KEY` | cms vault | on incident | encrypts provider keys at rest |
| `PROVIDER_SECRET_KEY` | proxy vault | on incident | |
| `FINANCE_WEBHOOK_SECRET` | payments | on incident | webhook signature |
| `SMTP_USER` `SMTP_PASS` | notification/auth | 90d | **SES SMTP creds, not IAM keys** |
| `RAZORPAY_*` `PAYU_*` `CASHFREE_*` | order/ctm/payment | per provider | usually synced from the CMS vault |
| `SUPERADMIN_PASSWORD` | bootstrap | rotate **immediately after first use** | never the dev value |

**Handling rules:** no secret in an image layer, compose file, or git; inject only via `.env`
(deploy-time) or Docker secrets; restrict SSM/Secrets Manager read to the EC2 instance role;
audit access via CloudTrail.

➡ Next: [05 · Runbooks](05-runbooks.md)

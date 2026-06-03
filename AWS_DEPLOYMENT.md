# Amarisé Commerce — AWS Production Deployment Runbook

Scope: the Amarisé storefront + admin console + the backend services they need
(commerce, order, inventory, fulfillment, payment, auth, auth-gateway, rbac, cms).
Status legend: ✅ ready · 🟡 partial · ❌ missing.

> Grounded in a full read-only audit of the repo (2026-06-03). Use this as the build order.

## 0. Current readiness scorecard
| Concern | Status | Notes |
|---|---|---|
| Backend service Dockerfiles | ✅ | All 8 backend services have monorepo turbo-prune + pnpm multi-stage Dockerfiles |
| Storefront Dockerfile + standalone | ✅ (this pass) | Added `output:'standalone'` + `Frontend/AmariseMaisonAvenue-main/Dockerfile` |
| admin-platform standalone | ✅ (this pass) | Added `output:'standalone'` (its Dockerfile already expected it) |
| **auth-gateway Dockerfile** | ❌ | No Dockerfile, not in compose — it is the storefront's `/auth-bff` cookie boundary. **Blocker.** |
| **Migrations on deploy** | ❌ | Dockerfiles run `node index.js` only; services `CREATE SCHEMA` but not tables. Need a pre-deploy `sequelize-cli db:migrate` task per service. **Blocker.** |
| Secrets / NODE_ENV | 🟡 | `baalvion_dev_pass` + `NODE_ENV=development` baked in compose / `s3Client.js` default. Move to Secrets Manager; set `NODE_ENV=production`. |
| `NEXT_PUBLIC_*` build-time | 🟡 | Next bakes these at BUILD; compose sets them at runtime (ignored). Pass as `--build-arg`. |
| Health endpoints | ✅ | commerce/order/inventory expose `/health` `/healthz` `/readyz` `/metrics`; others `/health`. |
| Postgres (per-domain schemas) | ✅ | One DB, schema-isolated → one RDS instance. DB is the only hard boot dependency. |
| Redis fault-tolerance | ✅ | cacheService fail-open; fxRateProvider static fallback; BullMQ lazy. |
| S3 media | ✅ | `commerce-service/utils/s3Client.js` SigV4 client; `MEDIA_DRIVER=s3` + `S3_*` envs. |
| Storefront media host / CSP | ✅ (this pass) | `NEXT_PUBLIC_MEDIA_HOST` now whitelisted in `remotePatterns` + CSP `img-src`. |
| Rate limiting | 🟡 | `express-rate-limit` in-memory → per-instance only; use a Redis store for multi-replica. |
| Graceful shutdown (SIGTERM) | 🟡 | Add handlers for clean ECS task draining. |
| admin-platform CSP | 🟡 | Only basic headers; add a CSP. |

## 1. Recommended AWS architecture (minimal, this stack)
- **Backends → ECS Fargate** (one service each), behind an **internal ALB** (host/path routing); target-group health = `/readyz` or `/health`.
- **Next apps → AWS Amplify Hosting** (simplest for Next 15 SSR) **or** ECS Fargate using the new Dockerfiles. Front with **CloudFront**.
- **RDS PostgreSQL** (Multi-AZ) — schemas already isolated (`commerce`, `orders`, …).
- **ElastiCache Redis** — cache, BullMQ queues, and the rate-limit store.
- **S3** (`amarise-media`) + **CloudFront** for product photos → set `S3_*` on commerce/cms; set `NEXT_PUBLIC_MEDIA_HOST` to the CloudFront/S3 host.
- **Secrets Manager** — DB creds, RS256 `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`, `INTERNAL_SERVICE_SECRET`, `GATEWAY_SIGNING_SECRET`, Razorpay/PayU, `S3_*`. Inject via ECS task-def `secrets:`.
- **Public ALB** → auth-gateway + Next apps; **ACM** TLS (HSTS already set by storefront).

## 2. Deploy order
1. **Network/data**: VPC + subnets/SGs; create RDS, ElastiCache, S3, CloudFront; populate Secrets Manager; generate RS256 keypair (`Backend/services/identity/auth-service/scripts/generateKeys.js`) and store both keys.
2. **Images → ECR**: build all backend Dockerfiles (context = repo root) + the storefront Dockerfile (this pass) + admin-platform. **Add an auth-gateway Dockerfile** (mirror another identity service). Pass storefront/admin `NEXT_PUBLIC_*` as `--build-arg` pointing at the public prod API origin + `NEXT_PUBLIC_MEDIA_HOST`.
3. **Migrations**: run a one-shot ECS task per service: `pnpm --filter <service> migrate` (sequelize-cli db:migrate) against RDS, gate on success.
4. **Backends**: deploy ECS services behind the internal ALB; verify `/readyz`.
5. **Edge**: deploy auth-gateway + Next apps behind the public ALB/CloudFront.
6. **Seed + smoke**: seed the Amarisé store (`commerce-service/scripts/seedAmarise.js`, with `NEXT_PUBLIC_STORE_ID`), then smoke test: anonymous catalog → cart → checkout → order; per-market FX/tax; admin RBAC; product images from S3.

## 3. Remaining P0/P1 code work (not yet done)
- ❌ **auth-gateway Dockerfile** + add to compose/ECS.
- ❌ **Migration-on-deploy** task wiring.
- 🟡 **Secrets** out of compose (`baalvion_dev_pass`) → Secrets Manager; `NODE_ENV=production`.
- 🟡 **Rate-limit Redis store**; **SIGTERM** handlers; **admin CSP**.
- 🟡 **Checkout → real order + payment**: storefront checkout currently a demo mirror (does not POST to order-service); payment is sandbox. (Functional gap — see app TODO.)
- 🟡 **Standardize storefront `NEXT_PUBLIC_*` defaults** (catalog.ts vs api-client.ts diverge) + document in `.env.example`.

## 4. Required env (per app)
**Storefront (build-arg):** `NEXT_PUBLIC_COMMERCE_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STORE_ID`, `NEXT_PUBLIC_MEDIA_HOST`, `NEXT_PUBLIC_REFRESH_COOKIE_NAME`, `AUTH_PROXY_TARGET`.
**Backends (runtime/Secrets):** `DB_HOST/PORT/NAME/USER/PASSWORD`, `REDIS_HOST/PORT`, `JWT_PUBLIC_KEY` (+ `JWT_PRIVATE_KEY` on auth), `JWT_ISSUER`, `JWT_AUDIENCE`, `CORS_ORIGINS`, `INTERNAL_SERVICE_SECRET`, `RBAC_BASE_URL`, `MEDIA_DRIVER=s3` + `S3_*`, `NODE_ENV=production`, FX overrides `FX_USD_*`.

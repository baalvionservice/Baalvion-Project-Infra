# FRONTEND AWS DEPLOYMENT PLAN

> ⚠️ **DEPRECATED — superseded by [MASTER_DEPLOYMENT_COMMANDS.md](MASTER_DEPLOYMENT_COMMANDS.md).**
> Legacy reference only. This is an **earlier ECS Fargate + CloudFront + ALB + ACM** design for
> 7 frontends; it is **NOT the shipped architecture.** Production runs **3 independent EC2 +
> Docker-Compose + Caddy stacks** deploying **5 in-scope frontends**, with **Caddy automatic TLS**
> (no ECS / ALB / CloudFront / ACM). Canonical domains per MASTER (e.g. Amarisé = `shop.baalvion.com`,
> proxy = `proxy.baalvionstack.com`). Where this file disagrees with MASTER, **MASTER wins.**

> Proposed AWS production deployment design for all 7 Baalvion frontends.
> Generated 2026-06-20. **Design document only — nothing was provisioned or deployed.**

## 1. Deployment classification

Two architectural classes drive the design:

| Class | Apps | Why | Compute |
|-------|------|-----|---------|
| **SSR (Node server)** | admin-platform, AmariseMaisonAvenue, controlthemarket, Law-Elite-Network, Imperialpedia, Global-Trade-Infrastructure | Next.js `output: 'standalone'` — needs a long-running Node process for SSR, RSC, API routes, ISR, BFF rewrites | **ECS Fargate** (containers) |
| **Static SPA** | Proxy-BaalvionStack | Vite build → static `dist/`; no server runtime | **S3 + CloudFront** (preferred) — or ECS Fargate nginx if same-origin `/auth-bff` proxy must stay in-container |

> **Recommendation: ECS Fargate for the 6 SSR apps; S3+CloudFront for the SPA.** Rationale below (§7).

## 2. Domain & routing map

| App | Production domain | Port (container) | Health path | Compute | Edge |
|-----|-------------------|------------------|-------------|---------|------|
| admin-platform | `admin.baalvion.com` | 3030 | `/api/health-check` | ECS Fargate | CloudFront → ALB |
| AmariseMaisonAvenue | `amarisemaisonavenue.com` (+`www`) | 3033 | `/` | ECS Fargate | CloudFront → ALB |
| controlthemarket | `controlthemarket.com` | 3000 | `/` | ECS Fargate | CloudFront → ALB |
| Law-Elite-Network | `lawelite.network` | 9002 | `/` | ECS Fargate | CloudFront → ALB |
| Imperialpedia | `imperialpedia.com` | 3029 | `/` | ECS Fargate | CloudFront → ALB |
| Global-Trade-Infrastructure | `trade.baalvion.com` | 9003 | `/api/health` | ECS Fargate (+RDS) | CloudFront → ALB |
| Proxy-BaalvionStack | `proxy.baalvion.com` | 8080 (n/a if S3) | `/healthz` | S3 + CloudFront | CloudFront (OAC) → S3 |

## 3. Compute design — ECS Fargate (6 SSR apps)

- **One ECS service per app** in a shared **ECS cluster** (`baalvion-frontends-prod`), private subnets across 2 AZs.
- **Task sizing (starting point, tune via load test):**
  - Content/marketing (Law-Elite, Imperialpedia, CTM): 0.5 vCPU / 1 GB, min 2 tasks.
  - Commerce/admin (Amarisé, admin-platform): 1 vCPU / 2 GB, min 2 tasks.
  - GTI (DB-backed): 1 vCPU / 2 GB, min 2 tasks, + RDS connection.
- **Autoscaling:** target-tracking on ALB request count per target (~1000 rpm) and CPU 60%; min 2 / max 6.
- **Images:** push to **ECR** (`<acct>.dkr.ecr.<region>.amazonaws.com/baalvion/<app>`). Build from **repo root** with the existing Dockerfiles (turbo-prune monorepo build) — except Law-Elite (single-context). Tag with git SHA + `prod`.
- **Secrets/config:** task definition pulls runtime env from **SSM Parameter Store** (non-secret URLs) and **Secrets Manager** (`DATABASE_URL`, `GATEWAY_SIGNING_SECRET`, `REVALIDATE_SECRET`, AI keys). Build-time `NEXT_PUBLIC_*`/`VITE_*` are passed as `--build-arg` in CI (CodeBuild/GitHub Actions), **not** task env.
- **Health checks:** ECS container health = the Dockerfile HEALTHCHECK; ALB target-group health = app health path (table above). Use `/api/health` (GTI) and `/api/health-check` (admin) where available; root `/` for the rest. **Action item:** add a lightweight `/api/health` to Amarisé/CTM/Law/Imperialpedia to avoid flapping on app 5xx.

### GTI database
- Provision **RDS PostgreSQL** (Multi-AZ) for `gti_orchestration`, in private subnets; SG allows only the GTI task SG on 5432; enforce `sslmode=require`.
- Run Prisma migrations as a **one-off ECS task / CodeBuild step** before the service is marked healthy (init-container pattern). Do not auto-migrate on every task start.

## 4. ALB routing

- **Two ALBs** (or one shared, host-based):
  - **`alb-frontends-prod`** (HTTPS:443) — host-header rules route each domain to its target group:
    - `admin.baalvion.com` → admin TG · `amarisemaisonavenue.com`,`www.` → amarise TG · `controlthemarket.com` → ctm TG · `lawelite.network` → law TG · `imperialpedia.com` → imperialpedia TG · `trade.baalvion.com` → gti TG.
  - ALB sits in public subnets; tasks in private subnets; SG: ALB→task on the app port only.
- **HTTP:80 listener** → 301 redirect to HTTPS.
- **Same-origin BFF:** the Next.js `/auth-bff`, `/trade-bff`, `/finance-bff` rewrites are handled **inside** each container (Next rewrites → `AUTH_PROXY_TARGET`/`GATEWAY_PROXY_TARGET`). No ALB path rule needed; just ensure those targets resolve from the task's subnet (internal NLB/Cloud Map to auth-gateway).

## 5. CloudFront

- **One CloudFront distribution per domain** (or one multi-alias dist per app) in front of the ALB origin (SSR apps) / S3 origin (SPA).
- **SSR apps:** CloudFront caches static assets (`/_next/static/*`, `/assets/*`, images) with long TTL; **forwards** dynamic routes to the origin with caching disabled (forward `Host`, `Cookie`, `Authorization`). Use the AWS-managed `CachingDisabled` policy for HTML/API and `CachingOptimized` for `/_next/static/*`.
- **SPA (Proxy):** CloudFront with **OAC** to a private S3 bucket; SPA fallback via a CloudFront Function / custom error response mapping 403/404 → `/index.html` (200). `/healthz` and the `/auth-bff/*` path need a **second origin** — if same-origin auth proxy is required, deploy Proxy as ECS-nginx instead (see §7), since S3 can't proxy `/auth-bff`.
- Attach **security headers** via CloudFront response-headers policy (HSTS, X-Content-Type-Options, Referrer-Policy) to complement each app's CSP. WAF (`AWSManagedRulesCommonRuleSet`) on each distribution.

## 6. SSL / TLS strategy

- **ACM certificates** in **us-east-1** (required for CloudFront):
  - `*.baalvion.com` (covers admin, trade, proxy) + apex if needed.
  - `amarisemaisonavenue.com` + `www.amarisemaisonavenue.com`.
  - `controlthemarket.com`.
  - `lawelite.network`.
  - `imperialpedia.com`.
- **TLS 1.2+ minimum**, DNS validation via Route 53.
- For the **regional ALB**, issue matching ACM certs in the **deployment region** (ALB cannot use us-east-1 certs unless via CloudFront). Pattern: CloudFront (us-east-1 cert) → ALB (regional cert) → task.
- App-level **HSTS** is already configured in several apps (Law-Elite 2-yr preload, etc.); CloudFront adds it uniformly.

## 7. S3 / CloudFront vs ECS for the SPA (decision)

| Option | Pros | Cons |
|--------|------|------|
| **S3 + CloudFront** (preferred) | Cheapest, fully managed, infinite scale, no patching | Cannot serve the nginx `/auth-bff/*` same-origin proxy → auth cookies must go cross-origin to `api.baalvion.com` (needs CORS + `SameSite=None` cookies) |
| **ECS Fargate (nginx)** | Keeps the existing `nginx.conf.template` `/auth-bff` same-origin proxy + `/healthz` intact; zero code change | Pays for always-on containers to serve static files |

**Recommendation:** If the auth model relies on **same-origin httpOnly cookies via `/auth-bff`** (it does — `AUTH_PROXY_TARGET`/`AUTH_PROXY_HOST` exist precisely for this), deploy Proxy-BaalvionStack as **ECS Fargate nginx** to preserve that contract with no code change. Migrate to S3+CloudFront later only if/when auth is reworked for cross-origin cookies. Either way, CloudFront fronts it.

## 8. DNS mapping (Route 53)

| Record | Type | Target |
|--------|------|--------|
| `admin.baalvion.com` | A/AAAA alias | CloudFront dist (admin) |
| `amarisemaisonavenue.com` / `www` | A/AAAA alias | CloudFront dist (amarise) |
| `controlthemarket.com` | A/AAAA alias | CloudFront dist (ctm) |
| `lawelite.network` | A/AAAA alias | CloudFront dist (law) |
| `imperialpedia.com` | A/AAAA alias | CloudFront dist (imperialpedia) |
| `trade.baalvion.com` | A/AAAA alias | CloudFront dist (gti) |
| `proxy.baalvion.com` | A/AAAA alias | CloudFront dist (proxy) |
| `api.baalvion.com` | (existing) | backend gateway (already provisioned) |

> Note: app code references several apex/`www` variants (`www.amarisemaisonavenue.com`, `lawelitenetwork.com`). Align the deployed domain with each app's `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_APP_URL` **build args** so SEO/canonical/OG URLs match the real domain. Decide apex-vs-www per brand and redirect the other at CloudFront.

## 9. CI/CD build contract

Per app, the pipeline (CodeBuild or GitHub Actions → ECR → ECS deploy):
1. Checkout repo (recursive for GTI submodule).
2. `docker build -f Frontend/<app>/Dockerfile -t <ecr>/baalvion/<app>:<sha> --build-arg NEXT_PUBLIC_...=... .` (build context = repo root for the 6 turbo apps; app dir for Law-Elite).
   - For admin-platform use **`Dockerfile.deploy`** (ARG→ENV re-export).
   - For Proxy pass all 8 `VITE_*` args.
3. Push to ECR; `aws ecs update-service --force-new-deployment`.
4. ECS rolling deploy (min healthy 100%, circuit breaker on), ALB drains old tasks.
5. Post-deploy smoke: curl the health path through the ALB + a key page.

**Hard rule:** the build command must pass **every** required build arg from §2 of the Environment Master List. A missing arg bakes a localhost/wrong-domain URL into the bundle.

## 10. Observability & guardrails
- CloudWatch Logs (`/ecs/baalvion-<app>`), Container Insights on the cluster.
- Alarms: ALB 5xx rate, target unhealthy count, task CPU/mem, RDS connections (GTI).
- WAF managed rules + rate limiting per distribution.
- Secrets rotation via Secrets Manager; never bake secrets into images.

## 11. Open decisions for the owner
1. **Region** (e.g. `ap-south-1` vs `us-east-1`) — affects latency + ACM cert placement.
2. **Apex vs www** per brand (Amarisé, Law-Elite).
3. **Proxy SPA hosting:** ECS-nginx (preserve `/auth-bff`) vs S3+CloudFront (requires auth rework). Recommended: ECS-nginx now.
4. **One CloudFront per app** vs shared multi-alias — cost/ops tradeoff.
5. **GTI RDS** sizing + whether `gti_orchestration` shares the platform DB cluster or gets a dedicated instance.

# FRONTEND DEPLOYMENT MATRIX

> ⚠️ **DEPRECATED — superseded by [MASTER_DEPLOYMENT_COMMANDS.md](MASTER_DEPLOYMENT_COMMANDS.md).**
> Legacy reference only — a useful per-app build/Docker audit of all 7 frontends. The "AWS target"
> column (ECS Fargate / CloudFront) reflects the **superseded** design; production uses the
> **3-stack EC2 + Caddy** model in MASTER (5 in-scope frontends; canonical image names, ports, and
> domains live in MASTER §5–§8). Where this file disagrees with MASTER, **MASTER wins.**

> Baalvion frontend ecosystem — AWS production deployment readiness.
> Generated 2026-06-20. **Audit / documentation only — no deployment performed, no infrastructure changed.**
> Scope: the 7 production frontends. All paths relative to repo root `d:\Baalvion Projects`.

## 1. At-a-glance matrix

| # | Application | Framework | Port | Build command | Docker image (suggested) | Health endpoint | AWS target |
|---|-------------|-----------|------|---------------|--------------------------|-----------------|------------|
| 1 | admin-platform | Next.js 15.5.18 (SSR, standalone) | 3030 | `turbo run build --filter=admin-platform` (from repo root) | `baalvion/admin-platform` | `/api/health-check` (rich, multi-service) | ECS Fargate |
| 2 | AmariseMaisonAvenue-main | Next.js 15.5.18 (SSR, standalone) | 3033 | `turbo run build --filter=…amarise…` | `baalvion/amarise-web` | `/` (HTTP <500) | ECS Fargate |
| 3 | controlthemarket-main | Next.js 15.5.18 (SSR, standalone) | 3000 | `turbo run build --filter=controlthemarket-web` | `baalvion/ctm-web` | `/` (HTTP <500) | ECS Fargate |
| 4 | Law-Elite-Network-main | Next.js 15.5.18 (SSR, standalone) | 9002 | `npm run build` (single-context Dockerfile) | `baalvion/law-elite-web` | `/` (HTTP <500) | ECS Fargate |
| 5 | Imperialpedia-main | Next.js 15.5.18 (SSR, standalone) | 3029 | `turbo run build --filter=imperialpedia-web` | `baalvion/imperialpedia-web` | `/` (HTTP <500) | ECS Fargate |
| 6 | Global-Trade-Infrastructure-main | Next.js 15.5.18 (SSR, standalone, **+Prisma DB**) | 9003 | `turbo run build --filter=baalvion-eternal-absolute-singularity` | `baalvion/gti-web` | `/api/health` (DB-backed) | ECS Fargate |
| 7 | Proxy-BaalvionStack | Vite 7 + React 18 (**static SPA**, nginx) | 8080 (nginx) | `vite build` → `dist/` (multi-stage → nginx) | `baalvion/proxy-web` | `/healthz` (nginx static) | S3 + CloudFront *or* ECS Fargate (nginx) |

## 2. Per-application detail

### 1. admin-platform — `admin.baalvion.com`
- **Framework:** Next.js 15.5.18, pnpm workspace, SSR.
- **Build:** `output: 'standalone'` (gated `process.platform !== 'win32'`; Linux/CI emits `.next/standalone`). next.config.ts:48.
- **Docker:** `node:20-alpine`, 4-stage (base→pruner→installer→runner), `turbo prune`, non-root `nextjs:1001`, HEALTHCHECK present. **Two Dockerfiles** — `Dockerfile` and `Dockerfile.deploy`. **Use `Dockerfile.deploy`** (it re-exports `ARG`→`ENV` so `next build` actually inlines `NEXT_PUBLIC_*`; plain `Dockerfile` does not).
- **Dockerignore:** `.dockerignore` + `Dockerfile.dockerignore` (override keeps `Frontend/` source for turbo prune). ✅
- **Health:** `src/app/api/health-check/route.ts` — probes 6 backends; needs 6 server URLs (see env list) or returns degraded.
- **Required build args:** `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GATEWAY_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ADMIN_API_URL`, `NEXT_PUBLIC_SESSION_API_URL`, `NEXT_PUBLIC_OAUTH_URL`, `NEXT_PUBLIC_CMS_API_URL`, `NEXT_PUBLIC_AUTH_URL`, `NEXT_PUBLIC_APP_ENV=production`.
- **Required runtime env:** `NODE_ENV`, `PORT`, `HOSTNAME` (set by Dockerfile); health URLs `AUTH_SERVICE_URL`, `ADMIN_SERVICE_URL`, `SESSION_SERVICE_URL`, `OAUTH_SERVICE_URL`, `NOTIF_SERVICE_URL`, `CTM_SERVICE_URL`; `AUTH_PROXY_TARGET`.
- **Backend services consumed:** auth-service, auth-gateway (BFF, optional via `NEXT_PUBLIC_BFF_MODE`), session, oauth, admin-service, cms-service, ctm-service, notification, + 18 per-service clients (jobs, mining, imperialpedia, commerce, order-execution, inventory, law, rbac, audit, marketplace, crm…) via `NEXT_PUBLIC_SERVICE_URLS` JSON map.
- **Workspace deps:** `@baalvion/auth-sdk` (workspace:*).

### 2. AmariseMaisonAvenue-main — `amarisemaisonavenue.com`
- **Framework:** Next.js 15.5.18, pnpm workspace, SSR e-commerce.
- **Build:** standalone (gated win32). next.config.ts:52.
- **Docker:** `node:20-alpine`, 4-stage turbo-prune, non-root `nextjs:1001`, HEALTHCHECK present, `--no-frozen-lockfile` (documented: turbo prune drops uuid@11 override). ARG→ENV correctly re-exported.
- **Dockerignore:** `Dockerfile.dockerignore` present. ✅
- **Health:** No dedicated route — HEALTHCHECK hits `127.0.0.1:3033/` (HTTP <500). Acceptable; a dedicated `/api/health` would be more robust.
- **Required build args (11):** `NEXT_PUBLIC_COMMERCE_URL`, `NEXT_PUBLIC_COMMERCE_API_URL`, `NEXT_PUBLIC_ORDER_URL`, `NEXT_PUBLIC_INVENTORY_URL`, `NEXT_PUBLIC_CMS_URL`, `NEXT_PUBLIC_CMS_WEBSITE_SLUG`, `NEXT_PUBLIC_STORE_ID`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_MEDIA_HOST`, (`NEXT_PUBLIC_ADMIN_CONSOLE_URL`).
- **Required runtime env:** `NODE_ENV`, `PORT`, `HOSTNAME` (Dockerfile), `AUTH_PROXY_TARGET`.
- **Backend services consumed:** auth-service/auth-gateway (`/auth-bff`), commerce-service, order-service, inventory-service, cms-service, crm-service. Payments via Razorpay/Stripe hosted checkout (CSP allowlisted).
- **Workspace deps:** `@baalvion/auth-sdk`.

### 3. controlthemarket-main — `controlthemarket.com`
- **Framework:** Next.js 15.5.18, pnpm workspace, SSR; middleware fail-closed auth gate.
- **Build:** standalone (gated win32). next.config.ts:48.
- **Docker:** `node:20-alpine`, 3-stage turbo-prune, non-root `nextjs:1001`, HEALTHCHECK present, port 3000. Production-hardened — no blockers.
- **Dockerignore:** `Dockerfile.dockerignore` present. ✅
- **Health:** HEALTHCHECK hits `127.0.0.1:3000/` (HTTP <500).
- **Required build args:** `NEXT_PUBLIC_CTM_API_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_USE_MOCK=false`. *(Recommend adding `NEXT_PUBLIC_BFF_MODE`, `NEXT_PUBLIC_GATEWAY_URL` as ARGs if gateway auth is enabled.)*
- **Required runtime env:** `NODE_ENV`, `PORT`, `HOSTNAME` (Dockerfile), `AUTH_PROXY_TARGET`, `NEXT_PUBLIC_REFRESH_COOKIE_NAME`.
- **Backend services consumed:** auth-gateway (`/auth-bff` rewrite → `AUTH_PROXY_TARGET`), ctm-service (`NEXT_PUBLIC_CTM_API_URL`, with mock fallback). No direct commerce/cms/rbac.
- **Workspace deps:** `@baalvion/auth-sdk`.
- **Note:** No `.env.example` in app dir — add one for operators.

### 4. Law-Elite-Network-main — `lawelite.network`
- **Framework:** Next.js 15.5.18 + React 19, SSR. **NOT a monorepo workspace member** (no `@baalvion/*` deps) → single-context Docker build.
- **Build:** standalone (gated win32). next.config.ts:108. **Dockerfile uses `npm`, not `pnpm`** (inconsistent with monorepo; works because no workspace deps).
- **Docker:** `node:20-alpine`, 3-stage (deps→builder→runner), non-root `nextjs`, HEALTHCHECK present, port 9002.
- **Dockerignore:** Has `.dockerignore` (single-context). **No `Dockerfile.dockerignore`** — correct for this app (single dir context, not repo-root turbo build).
- **Health:** HEALTHCHECK hits `127.0.0.1:9002/` (HTTP <500).
- **Required build args:** `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_APP_URL`.
- **Required runtime env:** `AUTH_SERVICE_URL`, `CMS_PUBLIC_URL`, `CMS_WEBSITE_SLUG`, `NEXT_PUBLIC_ADMIN_CONSOLE_URL` (optional), `GOOGLE_GENAI_API_KEY` (if AI flows used), Algolia keys (optional), `PORT`.
- **Backend services consumed:** auth-service (BFF `/api/auth/*` proxy), law-service (`NEXT_PUBLIC_API_BASE_URL`), cms-service (`CMS_PUBLIC_URL`, graceful). No commerce/order/inventory/rbac.
- **⚠ Issues:** (a) `src/lib/api/client.ts:3` falls back to **wrong domain** `https://api.baalvion.com/api/v1/knowledge/law/v1` if build arg missing; (b) `public/` is empty (`.gitkeep` only) — no OG/favicon assets; (c) consider `pnpm` for consistency.

### 5. Imperialpedia-main — `imperialpedia.com`
- **Framework:** Next.js 15.5.18, pnpm workspace, SSR; **hybrid CMS pipeline** (live CMS → committed `src/generated/personal-finance-content.json` snapshot → demo fallback). Can render with **no live backend**.
- **Build:** standalone (gated win32). next.config.ts:28.
- **Docker:** `node:20-alpine`, 4-stage turbo-prune, non-root `nextjs:1001`, HEALTHCHECK present, port 3029. ARG→ENV re-exported.
- **Dockerignore:** `.dockerignore` present.
- **Health:** HEALTHCHECK hits `127.0.0.1:3029/` (HTTP <500).
- **Required build args:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_IMPERIALPEDIA_API_URL`, `NEXT_PUBLIC_CMS_PUBLIC_URL`, `NEXT_PUBLIC_SITE_URL`; optional `NEXT_PUBLIC_CMS_SITE_SLUG=imperialpedia`, `NEXT_PUBLIC_ADMIN_PLATFORM_URL`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_ADSENSE_CLIENT`.
- **Required runtime env:** `REVALIDATE_SECRET` (webhook auth — required for ISR revalidate route), optional `INDEXNOW_KEY`, `GEMINI_API_KEY`/`GOOGLE_GENAI_API_KEY` (AI flows), `NODE_ENV`/`PORT`/`HOSTNAME` (Dockerfile), `AUTH_PROXY_TARGET`.
- **Backend services consumed:** cms-service (public content), imperialpedia-service (structured KB), auth-service/auth-gateway (`/auth-bff`). No commerce/order/inventory/rbac.
- **Workspace deps:** `@baalvion/auth-sdk`.
- **Note:** content snapshot must be regenerated (`pnpm run generate:content`) + committed before build when CMS content changes, else prod serves stale copy.

### 6. Global-Trade-Infrastructure-main — `trade.baalvion.com`
- **Framework:** Next.js 15.5.18 + React 18, SSR. **Git submodule** + **owns a Prisma/PostgreSQL DB** (`gti_orchestration`). Build runs `prisma generate && next build`.
- **Build:** standalone (gated win32). next.config.ts:41.
- **Docker:** `node:20-alpine`, 4-stage turbo-prune (builds from repo root — cannot build from submodule alone due to `@baalvion/auth-sdk` workspace dep), non-root `nextjs:1001`, HEALTHCHECK present, port 9003.
- **Dockerignore:** `Dockerfile.dockerignore` present. ✅
- **Health:** `src/app/api/health/route.ts` — `SELECT 1` DB probe, 200 healthy / 503 down. HEALTHCHECK hits `/api/health`.
- **Required build args:** `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_APP_URL`, optional `NEXT_PUBLIC_TELEMETRY_INGEST`. *(Recommend `NEXT_PUBLIC_BFF_MODE=on`, `NEXT_PUBLIC_GATEWAY_URL`, `NEXT_PUBLIC_REFRESH_COOKIE_NAME` if BFF prod auth.)*
- **Required runtime env (secrets):** `DATABASE_URL` (Prisma — **must override** committed localhost default), `GATEWAY_SIGNING_SECRET` (≥32 chars, RS256 identity envelope), `GATEWAY_PROXY_TARGET` (auth-gateway URL — defaults localhost), optional `SANCTIONS_API_URL`, `GOOGLE_GENAI_API_KEY`.
- **Backend services consumed:** auth-gateway + trade-service + financial-services-java (via `/trade-bff`, `/finance-bff` rewrites → `GATEWAY_PROXY_TARGET`), order-service (payments), risk/sanctions-service. Multi-gateway payments (Razorpay/Stripe/PayU/Bank) — hosted checkout, CSP allowlisted.
- **Workspace deps:** `@baalvion/auth-sdk`.
- **⚠ Issues:** committed `.env` carries localhost `DATABASE_URL` with placeholder creds `gti:gti` (non-secret placeholder, but must be overridden); needs DB migrations applied before pod readiness; needs 3 runtime secrets.

### 7. Proxy-BaalvionStack — `proxy.baalvion.com`
- **Framework:** Vite 7.3.2 + React 18 — **pure static SPA, no Node server runtime**. nginx serves `dist/`.
- **Build:** `vite build` → `dist/`. Multi-stage Docker: node build stage → `nginxinc/nginx-unprivileged:1.27-alpine` serve stage (uid 101), port 8080.
- **Docker:** turbo-prune, `--no-frozen-lockfile` (documented), non-root nginx, HEALTHCHECK present. `Dockerfile.dockerignore` present (the audit agent's "no .dockerignore" note refers to a plain `.dockerignore`; the build-relevant `Dockerfile.dockerignore` **does exist**). ✅
- **Health:** nginx `/healthz` → `200 ok` (static). ALB/ECS friendly.
- **Required build args (8, BUILD-TIME baked — cannot change at runtime):** `VITE_API_PLATFORM_BASE_URL`, `VITE_API_AUTH_BASE_URL`, `VITE_GATEWAY_URL`, `VITE_BFF_MODE`, `VITE_PROXY_GATEWAY_HOST`, `VITE_PROXY_GATEWAY_HTTP_PORT`, `VITE_PROXY_GATEWAY_SOCKS_PORT`, `VITE_PAYU_ACTION_URL`.
- **Required runtime env (nginx envsubst):** `AUTH_PROXY_TARGET`, `AUTH_PROXY_HOST` (Dockerfile defaults point to prod `api.baalvion.com`). These drive the same-origin `/auth-bff/*` proxy for httpOnly cookies.
- **Backend services consumed:** auth-service + auth-gateway (`/auth-bff`), proxy-service BFF (`:4000` / platform API), payment-service (BFF `/billing/checkout`; Razorpay/Stripe/PayU/Cashfree hosted checkout). No card data in SPA.
- **Workspace deps:** `@baalvion/auth-sdk`.
- **Safety:** localhost fallback in `gatewayCheckout.ts` is gated behind `import.meta.env.PROD` → empty string (relative) in prod, never ships localhost.

## 3. Cross-cutting notes
- **All 7** use `node:20-alpine` (or nginx-unprivileged), run non-root, and ship a Docker HEALTHCHECK. No broken Dockerfiles.
- **6 of 7** are Next.js SSR with `output: 'standalone'` (gated off on Windows dev; Linux/CI emits standalone correctly). Only **Proxy-BaalvionStack** is a static SPA.
- **`NEXT_PUBLIC_*` / `VITE_*` are build-time baked** → must be supplied as `--build-arg` at image build, not runtime. This is the single most important deployment gotcha across the fleet.
- **5 of 7** are monorepo workspace members (depend on `@baalvion/auth-sdk`) → must build from **repo root** with `turbo prune`. **Law-Elite is standalone** (single-context, npm).
- **GTI is unique:** owns a Prisma DB and requires runtime secrets (`DATABASE_URL`, `GATEWAY_SIGNING_SECRET`) + migrations.

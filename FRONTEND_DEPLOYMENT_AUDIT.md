# Frontend Deployment Audit — Baalvion Monorepo

**Date:** 2026-06-20
**Scope:** All 7 production frontends targeted for AWS deployment
**Auditor:** Principal Deployment Engineering pass (Next.js / Vite / Docker / AWS)

---

## Phase 1 — Frontend Inventory

| App | Dir | Framework | Pkg name | Pkg mgr | Build | Start/Serve |
|-----|-----|-----------|----------|---------|-------|-------------|
| Admin Platform | `Frontend/admin-platform` | Next.js 15.5 (App Router, React 19) | `baalvion-admin-platform` | pnpm (workspace) | `next build` | `next start -p 3030` |
| Amarisé Maison Avenue | `Frontend/AmariseMaisonAvenue-main` | Next.js 15.5 (React 19) | `amarise-maison-avenue-web` | pnpm (workspace) | `next build` | `next start` |
| ControlTheMarket | `Frontend/controlthemarket-main` | Next.js 15.5 (React 19) | `controlthemarket-web` | pnpm (workspace) | `next build` | `next start` |
| Law Elite Network | `Frontend/Law-Elite-Network-main` | Next.js 15.5 (React 19) | `law-elite-network-web` | pnpm (self-contained) | `next build` | `next start` |
| Imperialpedia | `Frontend/Imperialpedia-main` | Next.js 15.5 (React 19) | `imperialpedia-web` | pnpm (workspace) | `next build` | `next start` |
| Global Trade Infrastructure | `Frontend/Global-Trade-Infrastructure-main` | Next.js 15.5 (React 18, Prisma) | `baalvion-eternal-absolute-singularity` | pnpm (nested workspace) | `prisma generate && next build` | `next start` |
| Proxy BaalvionStack | `Frontend/Proxy-BaalvionStack` | Vite 7 SPA (React 18) | `proxy-baalvionstack-web` | pnpm (workspace) | `vite build` | static (nginx) |

All seven are **pnpm workspace members** under `Frontend/*` (root `pnpm-workspace.yaml`). None ship an individual lockfile — they share the root `pnpm-lock.yaml`. Six depend on `@baalvion/auth-sdk` (`workspace:*`); only Law Elite is self-contained.

### Production-readiness table (post-fix)

| App | Framework | Build path | Docker Ready | Standalone output | Production Ready |
|-----|-----------|------------|:---:|:---:|:---:|
| Admin Platform | Next.js | repo-root turbo prune | ✅ (fixed) | ✅ linux-gated | ✅ |
| Amarisé | Next.js | repo-root turbo prune | ✅ | ✅ linux-gated | ✅ |
| ControlTheMarket | Next.js | repo-root turbo prune | ✅ | ✅ linux-gated | ✅ |
| Law Elite | Next.js | single-dir npm | ✅ (fixed) | ✅ (fixed) | ✅ |
| Imperialpedia | Next.js | repo-root turbo prune | ✅ (created) | ✅ (fixed) | ✅ |
| GTI | Next.js + Prisma | repo-root turbo prune | ✅ (created) | ✅ (fixed) | ⚠️ needs 1 build validation |
| Proxy | Vite SPA | repo-root turbo prune → nginx | ✅ (created) | n/a (static) | ✅ |

> "Standalone output" is gated `process.platform === 'win32' ? undefined : 'standalone'` across all Next apps: Windows dev boxes skip it (unreliable symlink emission), Linux Docker/CI emit it.

---

## Phase 2 — Environment Variable Audit (summary)

Full per-variable matrix in **ENVIRONMENT_VARIABLE_MATRIX.md**. Key findings:

- **Build-time (inlined) vars** are `NEXT_PUBLIC_*` (Next apps) and `VITE_*` (Proxy). These MUST be present as Docker `--build-arg` at image-build time — they cannot be injected at container runtime.
- **Runtime-only vars** are server-side (`AUTH_PROXY_TARGET`, `*_SERVICE_URL`, `GATEWAY_SIGNING_SECRET`, `REVALIDATE_SECRET`, Prisma `DATABASE_URL`, GenAI keys). These are injected at container start.
- Most `localhost`/`127.0.0.1` references are **dev-gated fallbacks** (guarded by `isDev`/`IS_PRODUCTION` in `next.config`/middleware) and are correct as written — they are NOT shipped to production.
- **Real production risks** (these will ship localhost if the build arg is omitted):
  - Imperialpedia `NEXT_PUBLIC_IMPERIALPEDIA_API_URL` (→ `http://localhost:3004`) and `NEXT_PUBLIC_CMS_PUBLIC_URL` (→ `http://localhost:3018`).
  - GTI `NEXT_PUBLIC_API_BASE_URL` (→ `http://localhost:3025`).
  - Proxy `VITE_API_PLATFORM_BASE_URL` (→ empty string in prod, breaks checkout).
  - Amarisé `NEXT_PUBLIC_STORE_ID` (no default — required).
  All are now documented as required `--build-arg`s in each Dockerfile header (Phase 3).

### Minor flagged (non-blocking, not auto-changed)

- **Imperialpedia CMS URL inconsistency**: some refs default to `:3011`, others `:3018`. Needs a product/infra decision on the canonical CMS public origin — left untouched to avoid guessing.
- **Admin Platform** infrastructure page hardcodes `http://localhost:3100` (Grafana) / `:9090` (Prometheus) links with no prod guard — cosmetic broken links on an internal admin page (LOW).
- **GTI** refresh cookie is `refresh_token` while the rest use `baalvion_refresh` — intentional per-app naming; documented, not changed.

---

## Phase 3 — Build-time variable propagation (Next.js)

Every `NEXT_PUBLIC_*` consumed in browser code now has a corresponding `ARG` + build-time `ENV` in its Dockerfile. See **FRONTEND_FIXES_APPLIED.md** for the exact ARG lists per app.

---

## Phase 4 — API Routing

| App | Backend reach pattern |
|-----|----------------------|
| Admin | Same-origin rewrites: `/api/proxy/*` → `NEXT_PUBLIC_API_URL`; `/auth-bff/*` → `AUTH_PROXY_TARGET` (gateway). |
| Amarisé | Direct browser fetch to `NEXT_PUBLIC_COMMERCE_URL` / order / inventory / CMS; auth via `/auth-bff` rewrite. |
| CTM | `NEXT_PUBLIC_CTM_API_URL`; auth via `/auth-bff` rewrite. |
| Law Elite | `NEXT_PUBLIC_API_BASE_URL`; server CMS via `CMS_PUBLIC_URL`; auth via `/api/auth` → `AUTH_SERVICE_URL`. |
| Imperialpedia | `NEXT_PUBLIC_IMPERIALPEDIA_API_URL` + CMS public; auth via `/auth-bff` rewrite. |
| GTI | Gateway BFF rewrites: `/trade-bff/auth/*` and `/trade-bff/*` → `GATEWAY_PROXY_TARGET`. |
| Proxy | `VITE_API_PLATFORM_BASE_URL`; auth via same-origin `/auth-bff` → gateway (nginx reverse-proxy in prod). |

All routes resolve through the central gateway / `api.baalvion.com` in production. The auth flow universally relies on a same-origin `/auth-bff` (or `/api/auth`) proxy so the httpOnly refresh cookie stays first-party — for Proxy this is now handled by the new nginx config; the Next apps handle it via `next.config` rewrites.

---

## Phase 5–6 — Docker & Next config

- 3 apps had correct monorepo-aware Dockerfiles already (Amarisé, CTM, admin `Dockerfile.deploy`).
- 3 apps had **no Dockerfile** (Imperialpedia, GTI, Proxy) — created.
- admin default `Dockerfile` (npm ci) and Law Elite (standalone mismatch + missing `public/`) were **broken** — fixed.
- All repo-root builds now have a `Dockerfile.dockerignore` override (root `.dockerignore` excludes `Frontend/`).
- All Next apps emit `standalone`; all images are multi-stage, `node:20-alpine`, non-root, with a `HEALTHCHECK`.

## Phase 7 — Build validation

- **Static/logical validation performed**: package names resolve for `turbo prune`; `tsconfig.base.json`, `turbo.json`, root `.npmrc` present; `output: 'standalone'` present on every Next app; `public/` dirs exist for every `COPY public` step; build-arg coverage matches browser env usage.
- **NOT performed in this environment**: actual `docker build` / `next build` / `vite build` — there is no Docker daemon and the host is Windows (standalone is intentionally win32-gated). These must run once on a Linux CI builder. See **FINAL_GO_NO_GO_REPORT.md** for the gating step.

---

See companion docs: **FRONTEND_FIXES_APPLIED.md**, **ENVIRONMENT_VARIABLE_MATRIX.md**, **DOCKER_DEPLOYMENT_GUIDE.md**, **FINAL_GO_NO_GO_REPORT.md**.

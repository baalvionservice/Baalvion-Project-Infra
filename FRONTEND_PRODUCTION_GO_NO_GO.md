# FRONTEND PRODUCTION GO / NO-GO

> ⚠️ **DEPRECATED — superseded by [MASTER_DEPLOYMENT_COMMANDS.md](MASTER_DEPLOYMENT_COMMANDS.md).**
> Legacy reference only — a frontend readiness assessment. Its ACM / CloudFront / ALB references
> reflect the **superseded** ECS design; production uses the **EC2 + Caddy** 3-stack model in
> MASTER (Caddy auto-TLS, no ACM/CloudFront/ALB). Where this file disagrees, **MASTER wins.**

> Final verification across the 7 Baalvion frontends. Generated 2026-06-20.
> Audit & documentation only — no deployment performed, no infrastructure changed.

## Verdict

# ✅ READY_FOR_FRONTEND_DEPLOYMENT — CONDITIONAL

All 7 frontends are **architecturally production-ready**: every app builds to a standalone/static artifact, ships a valid non-root Docker image with a HEALTHCHECK, and resolves to prod-safe URLs **when build args are supplied**. There are **no build-blocking defects and no broken Dockerfiles.**

The "CONDITIONAL" qualifier means: deployment is gated on **operational prerequisites** (passing the correct `--build-arg` / runtime secrets at deploy time) plus **two HIGH code fixes** that should land before go-live (Law-Elite wrong-domain fallback; GTI runtime secrets). None of these prevent the images from building or running — they prevent the apps from talking to the *right* backends. With the per-app checklist below satisfied, the fleet is GO.

## Verification checklist (the 7 required gates)

| Gate | Result | Detail |
|------|--------|--------|
| No localhost production dependencies | ⚠️ Conditional | Localhost appears only as **fallback defaults** for build args. Mostly NODE_ENV-gated or `import.meta.env.PROD`-gated. Eliminated by passing build args. Exceptions flagged below (Law-Elite, GTI). |
| No missing build args | ⚠️ Conditional | All build args exist and are wired in Dockerfiles; CI **must supply** them. Missing args bake wrong URLs. |
| No broken Dockerfiles | ✅ Pass | All 7 valid: multi-stage, non-root, correct standalone/static copy, healthcheck. |
| No missing standalone output | ✅ Pass | 6 Next.js apps emit `output: 'standalone'` on Linux/CI; Proxy is static `dist/` (n/a). |
| No missing health checks | ✅ Pass | All 7 have Docker HEALTHCHECK. GTI `/api/health` (DB), admin `/api/health-check` (rich), Proxy `/healthz`, others root `/`. |
| No missing environment variables | ⚠️ Conditional | All identified & documented (see Environment Master List). admin-platform's 6 `*_SERVICE_URL` health vars are undocumented in `.env` — add to task def. |
| No unresolved backend dependencies | ✅ Pass | All deps mapped (see Dependency Graph). auth-service/auth-gateway are the universal hard deps; must be live before cutover. |

## Per-application status

| App | Status | Blocking before go-live? |
|-----|--------|--------------------------|
| admin-platform | ✅ GO (conditional) | Use **`Dockerfile.deploy`** (not `Dockerfile`); set 6 `*_SERVICE_URL` health env vars; supply all `NEXT_PUBLIC_*` build args. |
| AmariseMaisonAvenue | ✅ GO (conditional) | Supply all 11 `NEXT_PUBLIC_*` build args (commerce/order/inventory/cms/store/site URLs); confirm `NEXT_PUBLIC_STORE_ID` or domain map. |
| controlthemarket | ✅ GO (conditional) | Supply 3 build args; ensure `NEXT_PUBLIC_USE_MOCK=false`; set `AUTH_PROXY_TARGET`. Cleanest of the fleet. |
| Law-Elite-Network | ⚠️ GO after 1 HIGH fix | **Fix `src/lib/api/client.ts:3` wrong-domain fallback** (`api.baalvion.com/...law` → empty + error); supply build args; set `AUTH_SERVICE_URL`/`CMS_PUBLIC_URL`; add `public/` OG+favicon assets (MEDIUM). |
| Imperialpedia | ✅ GO (conditional) | Supply 4 build args; set `REVALIDATE_SECRET`; regenerate+commit content snapshot if CMS changed. |
| Global-Trade-Infrastructure | ⚠️ GO after secrets wired | Provision **RDS + `DATABASE_URL`**, **`GATEWAY_SIGNING_SECRET`** (≥32), **`GATEWAY_PROXY_TARGET`**; run Prisma migrations pre-readiness; build recursively (submodule). |
| Proxy-BaalvionStack | ✅ GO (conditional) | Pass all 8 `VITE_*` build args (baked!); set nginx `AUTH_PROXY_TARGET`/`AUTH_PROXY_HOST`; deploy as ECS-nginx to preserve `/auth-bff` same-origin proxy. |

## Issues by severity

### 🔴 CRITICAL (block deploy) — **none**
No app has a defect that prevents building or running.

### 🟠 HIGH (fix before go-live)
1. **Law-Elite `src/lib/api/client.ts:3`** falls back to `https://api.baalvion.com/api/v1/knowledge/law/v1` (wrong service path) when the build arg is missing — silently masks misconfiguration. Make the build arg mandatory / fallback to empty + error.
2. **GTI runtime secrets** (`DATABASE_URL`, `GATEWAY_SIGNING_SECRET`, `GATEWAY_PROXY_TARGET`) default to localhost/unset. Must come from Secrets Manager; DB + migrations must exist before the service is marked healthy.
3. **admin-platform Dockerfile choice** — the plain `Dockerfile` does not re-export `ARG`→`ENV`, so `next build` won't inline `NEXT_PUBLIC_*` (bakes hardcoded defaults). **Use `Dockerfile.deploy`.**
4. **Build-arg discipline (fleet-wide)** — every required `NEXT_PUBLIC_*`/`VITE_*` must be passed in CI. This is the single highest-probability deployment failure mode.

### 🟡 MEDIUM (should fix)
- admin-platform: 6 `*_SERVICE_URL` health env vars absent from `.env` examples → `/api/health-check` reports those backends down in prod until set.
- Amarisé/CTM/Law/Imperialpedia: HEALTHCHECK hits root `/` → can flap on any app 5xx. Add a dedicated dependency-free `/api/health` route.
- Law-Elite: empty `public/` (no OG image/favicon); uses `npm` in Dockerfile vs monorepo `pnpm`.
- controlthemarket: no `.env.example` in app dir for operators.
- GTI/Amarisé: CSP allows demo image hosts (picsum/unsplash) — audit out of prod CSP.

### 🟢 LOW
- Standalone disabled on Windows dev builds (intentional; Linux/CI fine).
- CSP `unsafe-inline` for styles (CSS-in-JS requirement) across several apps.
- Several apps hardcode `unsafe-eval` only in dev (correctly gated).

## Pre-deployment gate (must be true before cutover)
- [ ] CI build command for each app passes **all** required build args (Environment Master List §2).
- [ ] admin-platform built from `Dockerfile.deploy`; GTI built recursively (submodule).
- [ ] Runtime secrets in Secrets Manager: GTI `DATABASE_URL`/`GATEWAY_SIGNING_SECRET`/`GATEWAY_PROXY_TARGET`, Imperialpedia `REVALIDATE_SECRET`, AI keys where used.
- [ ] admin-platform 6 `*_SERVICE_URL` health vars set in task def.
- [ ] Law-Elite `client.ts:3` fallback fixed (or build arg verified present in CI).
- [ ] GTI RDS provisioned, reachable (SSL), migrations applied.
- [ ] auth-service + auth-gateway live and reachable from the frontend subnets (universal hard dep).
- [ ] ACM certs issued (us-east-1 for CloudFront + regional for ALB); Route 53 records point to CloudFront.
- [ ] Post-deploy smoke: health path + login flow + one data page per app.

## Summary
Infrastructure quality across the fleet is **high and consistent** — uniform multi-stage Alpine images, non-root users, healthchecks, standalone output, prod-safe defaults, real auth (httpOnly cookie BFF), and configured CSP/security headers. The remaining work is **deploy-time configuration and two code hardening fixes**, not rebuilding anything.

**FINAL: READY_FOR_FRONTEND_DEPLOYMENT** — conditional on the pre-deployment gate above. Recommended order: wire CI build args + secrets → fix Law-Elite fallback → provision GTI RDS → deploy content/marketing apps (Law, Imperialpedia, CTM) first (lowest backend coupling) → then admin/Amarisé/GTI.

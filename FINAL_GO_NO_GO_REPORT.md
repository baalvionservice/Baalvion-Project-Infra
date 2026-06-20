# Final GO / NO-GO Report — Frontend AWS Deployment

**Date:** 2026-06-20
**Scope:** 7 production frontends

---

## 1. Issues found: **20**

**Build/Docker blockers (would prevent a successful production build or container start):**
1. Admin Platform default `Dockerfile` used `npm ci` — cannot build a pnpm workspace member.
2. Admin Platform missing `Dockerfile.dockerignore` (root `.dockerignore` excludes `Frontend/`).
3. Law Elite `next.config.ts` forced `output: undefined` — Dockerfile copies non-existent `.next/standalone`.
4. Law Elite missing `public/` dir — `COPY /app/public` fails the build.
5. Law Elite missing `.dockerignore` — host Windows `node_modules` clobber the clean install.
6. Imperialpedia had **no Dockerfile**.
7. Imperialpedia had no `standalone` output.
8. Imperialpedia missing `Dockerfile.dockerignore`.
9. GTI had **no Dockerfile**.
10. GTI had no `standalone` output.
11. GTI `postinstall: prisma generate` would fail in the pruned installer stage.
12. GTI missing `Dockerfile.dockerignore`.
13. Proxy (Vite) had **no Dockerfile** / no production static-serving image.
14. Proxy had no `/auth-bff` reverse-proxy for prod (cookie flow would break).
15. Proxy missing `Dockerfile.dockerignore`.

**Configuration requirements (ship-time, not code bugs — now documented as required build args):**
16. Imperialpedia `NEXT_PUBLIC_IMPERIALPEDIA_API_URL` defaults to localhost.
17. Imperialpedia `NEXT_PUBLIC_CMS_PUBLIC_URL` defaults to localhost **and is inconsistent (`:3011` vs `:3018`)**.
18. GTI `NEXT_PUBLIC_API_BASE_URL` defaults to localhost.
19. Proxy `VITE_API_PLATFORM_BASE_URL` ships empty in prod if unset.
20. Amarisé `NEXT_PUBLIC_STORE_ID` has no default (required) + Commerce/CMS URLs default to localhost.

---

## 2. Fixed automatically: **15 of 15 build/Docker blockers** (items 1–15)

All structural blockers are resolved in code: Dockerfiles created/repaired, standalone output enabled on every Next app, `.dockerignore` overrides added, Law Elite `public/` placeholder added, GTI Prisma install path handled, Proxy nginx static image + auth-bff proxy created. See **FRONTEND_FIXES_APPLIED.md**.

Items 16–20 are **deploy-time configuration**, not auto-fixable in code (the correct production values are an infra/ops decision). They are now fully documented as required `--build-arg`s in each Dockerfile header and in **ENVIRONMENT_VARIABLE_MATRIX.md**, so the CI build matrix can supply them.

---

## 3. Remaining blockers

**None that are structural.** Two gating actions remain before flipping to unconditional GO:

| # | Action | Owner | Risk |
|---|--------|-------|------|
| A | Run one clean `docker build` per app on a **Linux** CI builder (standalone is win32-gated; no Docker/Linux available in this audit environment). | CI/DevOps | Low for 6 apps; **medium for GTI** — verify Prisma client loads at runtime inside the Next standalone bundle. |
| B | Supply the required production build args (items 16–20) + reconcile the Imperialpedia CMS port (`:3011` vs `:3018`). | Infra/Ops | Low — values known, decision needed. |

**Minor (non-blocking, LOW):** Admin Platform internal infrastructure page hardcodes `localhost` Grafana/Prometheus links; GTI uses a different refresh-cookie name (`refresh_token`). Neither blocks deployment.

---

## 4. Verdict: **CONDITIONAL GO** ✅ (pending one Linux build-matrix pass)

All seven applications are **structurally production-ready**: each has a correct multi-stage, non-root, healthchecked image with proper build-arg propagation and standalone/static output. Logical validation passed (turbo package names, standalone output, build prerequisites, `public/` dirs, build-arg coverage all confirmed).

I am **not** marking unconditional GO because the actual `docker build` / `next build` / `vite build` could not be executed here (no Docker daemon; Windows host with win32-gated standalone). Per the directive that GO requires all seven to *successfully build and run*, the honest verdict is:

> **GO once the CI Linux build matrix is green for all 7 images** with the documented build args. Treat **GTI** as the one image to watch (Prisma + nested workspace). The other six are expected to build clean — three already shipped on this exact pattern (Amarisé, CTM, admin `Dockerfile.deploy`).

### Recommended next step
Add a `frontend-images` CI job that runs the 7 build commands from **DOCKER_DEPLOYMENT_GUIDE.md** with `DOCKER_BUILDKIT=1`, pushes to ECR on success, and gates the ECS deploy on it.

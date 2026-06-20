# Frontend Deployment Verification — v1.0.1-frontend-hardening

> ⚠️ **DEPRECATED — superseded by [MASTER_DEPLOYMENT_COMMANDS.md](MASTER_DEPLOYMENT_COMMANDS.md).**
> Legacy reference only — a historical record of the `v1.0.1-frontend-hardening` release.
> Execution authority for deployment is MASTER. Where this file disagrees, **MASTER wins.**

**Release:** Baalvion Frontend Hardening Release v1.0.1
**Tag:** `v1.0.1-frontend-hardening` → commit `3f3f1b65` (base `v1.0.0-mvp` / `28761797`)
**Repo:** baalvionservice/Baalvion-Project-Infra · **Branch:** `main`
**Status:** ✅ Released. Code-layer hardening verified. Deployment gated on operator config (below).

---

## 1. Release-finalization audit (performed)

| Step | Result |
|------|--------|
| All modified files tracked | ✅ 31 tracked-modified + 2 new files added (`Law-Elite .../lib/env.ts`, `GTI .../DEPLOYMENT_MIGRATION_CHECKLIST.md`) |
| `git status` / `git diff --stat` | ✅ 33 files, +244 / −34, all under `Frontend/` |
| Files changed since `v1.0.0-mvp` | ✅ exactly the 33 hardening files (tag was at HEAD; no intervening commits) |
| Scope control | ✅ 11 pre-existing top-level docs (AWS_*, FINAL_*, MVP_*, FRONTEND_* matrices) left **untracked** — not part of hardening |
| Secret scan (33 files) | ✅ CLEAN — no AWS / Razorpay / PayU / Stripe live keys, JWT secrets, private keys, or DB passwords |
| Type-check (`tsc --noEmit`) | ✅ exit 0 — Law-Elite, Imperialpedia, Proxy, GTI |
| Commit created | ✅ `3f3f1b65` (conventional commit; pre-commit hooks passed) |
| Annotated tag created | ✅ `v1.0.1-frontend-hardening` → `3f3f1b65` |
| Pushed to origin | ✅ `28761797..3f3f1b65 main`; tag pushed |
| GitHub release | ✅ created (latest=false; `V2.0.0` remains the latest tag) |
| `main` == `origin/main` | ✅ verified post-push (see §4) |

### Secret-scan detail
Categories scanned: AWS access/secret keys (`AKIA…`/`ASIA…`/`aws_secret…`), Razorpay (`rzp_live_`/`rzp_test_`), PayU (merchant key/salt), Stripe (`sk_live_`/`pk_live_`), JWT/HS256 secrets, `.env`-style literal credential assignments, PEM private keys, and `postgres://user:pass@` DB URLs. **Only matches:** a `USER:PASS` documentation placeholder in the GTI checklist and the now dev-gated `password123` demo string — neither is a production credential.

## 2. Fix verification (the 5 categories)

| Area | Verified |
|------|----------|
| Law-Elite fail-fast env | ✅ `requireServerEnv` throws in prod (build-phase guarded); `AUTH_SERVICE_URL` + `CMS_PUBLIC_URL` required; wrong-domain API fallback removed |
| Imperialpedia privacy | ✅ personal email default removed → env-driven brand default; mock PII anonymized; CMS/IMP/admin `localhost` dev-guarded |
| GTI Prisma deployment | ✅ `env("DATABASE_URL")` confirmed; `prisma:deploy`/`prisma:status` added; gateway dev-guarded; migration checklist present |
| Proxy CSP hardening | ✅ CSP + HSTS + X-Frame-Options + X-Content-Type-Options + Referrer-Policy + Permissions-Policy added to nginx; PayU prod routing |
| Amarisé email | ✅ malformed footer email corrected to `mailto:info@amarisemaisonavenue.com` |

## 3. Operator deployment checklist (per app)

Pre-cutover gate — these are **runtime/build config**, not code (this release does not set them):

- [ ] **All apps:** supply required `NEXT_PUBLIC_*` / `VITE_*` build args at build time.
- [ ] **Law-Elite:** set `AUTH_SERVICE_URL`, `CMS_PUBLIC_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_APP_URL`. Confirm prod build does **not** throw at startup (vars present).
- [ ] **Imperialpedia:** set `NEXT_PUBLIC_CMS_PUBLIC_URL`, `NEXT_PUBLIC_IMPERIALPEDIA_API_URL`, `AUTH_PROXY_TARGET`, `NEXT_PUBLIC_ADMIN_PLATFORM_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`.
- [ ] **GTI:** provision RDS + `DATABASE_URL` (SSL); set `GATEWAY_SIGNING_SECRET` (≥32), `GATEWAY_PROXY_TARGET`; run `pnpm prisma:deploy`; confirm `pnpm prisma:status` = up to date; verify standalone engine: `find .next/standalone -name 'libquery_engine-*'`.
- [ ] **Proxy:** deploy as nginx (preserves `/auth-bff`); set `AUTH_PROXY_TARGET` / `AUTH_PROXY_HOST`; pass `VITE_PAYU_ACTION_URL=https://secure.payu.in/_payment`; if API origin ≠ `api.baalvion.com`, update nginx CSP `connect-src`.
- [ ] **Amarisé:** no new config; verify footer contact renders `mailto:info@amarisemaisonavenue.com`.
- [ ] **Universal:** auth-service + auth-gateway live and reachable before cutover.

### Post-deploy smoke (per app)
- [ ] Health endpoint returns 200.
- [ ] Login / refresh flow works (httpOnly cookie via same-origin BFF).
- [ ] One data page renders with live backend data.
- [ ] Proxy: response headers include `Content-Security-Policy` + `Strict-Transport-Security`.
- [ ] GTI: `/api/health` (DB-touching) green after migrations.

## 4. Branch sync verification

```
local  main      = 3f3f1b65
origin/main       = 3f3f1b65
v1.0.1-frontend-hardening = 3f3f1b65
```
`main` is equal to `origin/main` after push. Working tree carries only untracked release/audit docs (do not affect tracked-tree equality).

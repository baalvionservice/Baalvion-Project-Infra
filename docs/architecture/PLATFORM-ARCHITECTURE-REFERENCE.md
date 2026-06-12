# Baalvion Platform — Authoritative Architecture Reference

**Version:** 1.0 (frozen baseline)
**Date:** 2026-06-12
**Status:** ADOPTED as the authoritative platform record. ARCHITECTURE FREEZE ACTIVE.
**Scope:** Documentation only. No rename, repository move, deployment, infrastructure, DNS, PM2, Docker, CI/CD, or gateway change is authorized by this document.

> This file is the single source of truth for domain ownership, repository identity,
> service dependencies, and the (not-yet-executed) folder-standardization plan.
> Corrections approved 2026-06-12 are incorporated (see Change Log).

---

## Change Log

| Date | Change | Approved |
|------|--------|----------|
| 2026-06-12 | Initial adoption of inventory as authoritative record | Yes |
| 2026-06-12 | C1 correction: `jobs.baalvion.com → Baalvion-Jobs-Portal-main` (was wrongly mapped to IR) | Yes |
| 2026-06-12 | Added `founders.baalvion.com → For Invstors and Founders` | Yes |
| 2026-06-12 | Added `insiders.baalvion.com → insiders-seo` | Yes |
| 2026-06-12 | `Proxy-BaalvionStack` rename target set to `BaalvionStack-Web` (not `-Gateway`) | Yes |
| 2026-06-12 | `baalviongroup.com` placed ON HOLD pending corporate-structure review | Yes |

---

# PART A — Architecture Inventory

## A1. Domain Registry (authoritative)

| # | Domain | Repository (current) | Standardized name (proposed) | Primary backend | Deploy method | Status |
|---|--------|----------------------|------------------------------|-----------------|---------------|--------|
| 1 | baalvion.com / trade.baalvion.com (see R-C3) | `Global-Trade-Infrastructure-main` | `Baalvion-Core` | trade-service:3025 + Java finance | Firebase App Hosting | domain ambiguity open |
| 2 | admin.baalvion.com | `admin-platform` | `Baalvion-Admin` | admin-service:3021 (+19 svc) | Docker (compose `admin` profile) + PM2 | active |
| 3 | amarisemaisonavenue.com | `AmariseMaisonAvenue-main` | `AmariseMaisonAvenue` | commerce-service:3012 | Firebase + Docker + PM2 | active |
| 4 | imperialpedia.com | `Imperialpedia-main` | `Imperialpedia` | imperialpedia-service:3004 | Firebase + PM2 | active |
| 5 | proxy.baalvionstack.com | `Proxy-BaalvionStack` | `BaalvionStack-Web` | proxy-service:4000 | PM2 (Vite SPA) | active |
| 6 | lawelitenetwork.com | `Law-Elite-Network-main` | `LawEliteNetwork` | law-service:3015 + law-elite-gateway:8090 | Firebase + Docker | active |
| 7 | controlthemarket.com | `controlthemarket-main` | `ControlTheMarket` | ctm-service:3017 | Firebase + PM2 + CI | active |
| 8 | mining.baalvion.com | `Mining.Baalvion-main` | `Baalvion-Mining` | mining-service:3003 | Firebase + PM2 | active |
| 9 | ir.baalvion.com | `IR-Baalvion-main` | `Baalvion-InvestorRelations` | ir-service:3008 | Firebase + PM2 | active |
| 10 | jobs.baalvion.com | `Baalvion-Jobs-Portal-main` | `Baalvion-Jobs` | jobs-service:3002 | Firebase + PM2 + CI | active |
| 11 | founders.baalvion.com | `For Invstors and Founders` | `Baalvion-Insiders` | insiders-service:3050 + auth-gateway:3099 | none configured | active app, no deploy |
| 12 | insiders.baalvion.com | `insiders-seo` | `Baalvion-Insiders-SEO` | insiders-service:3050 | none configured | active app, no deploy |
| 13 | dashboard.baalvion.com | `company-unified-Dashboard-main` | `Baalvion-Dashboard` | dashboard-service:3009 + realtime:3040 | Firebase + PM2 | active |
| 14 | connect.baalvion.com | `brand-connector-main` | `Baalvion-Connect` | brand-connector-service:3006 | Firebase + PM2 | active |
| 15 | about.baalvion.com | `about-baalvion-main` | `Baalvion-About` | about-service:3010 + cms:3011 | PM2 (`next start`) | active |
| 16 | baalviongroup.com | — (none) | `Baalvion-Group` (proposed) | cms-service:3011 (proposed) | — | ON HOLD |

## A2. Repository Technical Inventory

| Folder | package.json name | Framework | Dev Port | Git tracking |
|--------|-------------------|-----------|----------|--------------|
| `Global-Trade-Infrastructure-main` | `baalvion-eternal-absolute-singularity` | Next 15.0.3 | 9003 | nested repo (own `.git`) |
| `admin-platform` | `baalvion-admin-platform` | Next 15.5.18 | 3030 | plain |
| `AmariseMaisonAvenue-main` | `amarise-maison-avenue-web` | Next 15.5.18 | 3033 | plain |
| `Imperialpedia-main` | `imperialpedia-web` | Next 15.5.18 | 3029 | plain |
| `Proxy-BaalvionStack` | `proxy-baalvionstack-web` | Vite 6 + React 18 | 8080 | plain |
| `Law-Elite-Network-main` | `law-elite-network-web` | Next 15.5.18 | 9002 | plain |
| `controlthemarket-main` | `controlthemarket-web` | Next 15.5.18 | 3034 | plain |
| `Mining.Baalvion-main` | `mining-baalvion-web` | Next 15.5.18 | 3028 | plain |
| `IR-Baalvion-main` | `ir-baalvion-web` | Next 15.5.18 | 3027 | plain |
| `Baalvion-Jobs-Portal-main` | `baalvion-jobs-portal-web` | Next 15.5.18 | 3026 | plain |
| `For Invstors and Founders` | `investors-and-founders-web` | Vite 6 + React 18 | 8082 | plain (name has typo + spaces) |
| `insiders-seo` | `baalvion-insiders-seo` | Next 15.5.18 | 3060 | plain |
| `company-unified-Dashboard-main` | `company-unified-dashboard-web` | Next 15.5.18 | 3024 | plain |
| `brand-connector-main` | `brand-connector-web` | Next 15.5.18 | 3035 | plain |
| `about-baalvion-main` | `about-baalvion-web` | Next 15.5.18 | 3020 | plain |

> Only `Global-Trade-Infrastructure-main` is a nested git repository. All other 14 are plain folders tracked by the parent monorepo.

## A3. Backend Services Registry

**Identity:** auth-service:3001 · auth-gateway:3099 · session-service:3022 · oauth-service:3023 · rbac-service:3055
**Commerce (Node):** commerce-service:3012 · market-service:3007 · order-service:3013 · inventory-service:3014 · fulfillment-service:3016 · trade-service:3025 · ledger-service:3014 (collision R-R2) · payment-service:3015
**Knowledge:** imperialpedia-service:3004 · cms-service:3011 / 3018 (R-R1) · law-service:3015 · ml-service:8000 (Python, HMAC)
**Infrastructure:** notification-service:3031 · audit-service:3032 · search-service:3036 · realtime-service:3040 · report-service:3041 · developer-service:3042 · proxy-service:4000
**Platform:** dashboard-service:3009 · admin-service:3021 · realtime-service:3026 (R-R4) · tenant-service:3043
**Ecosystem:** about-service:3010 · brand-connector-service:3006 · ir-service:3008 · jobs-service:3002 · mining-service:3003 · real-estate-service:3005 · ctm-service:3017 · insiders-service:3050 · crm-service:3063 · agent-service:3044 · law-elite-gateway:8090 (→ case/payment/user sub-services)
**Marketplace:** marketplace-service:3062
**Trade / GTOS suite** (own `docker-compose.gtos.yml`, NOT gateway-routed): network-graph:3047 · product-registry:3048 · trade-documentation:3049 · quality-inspection:3050 (R-R3) · supplier-lifecycle:3051 (R-R3) · order-execution:3052
**Java finance suite** (`financial-services-java/`, separate Maven + compose, 21 modules): account, aml, audit, credit, deal-room, dispute, escrow, fx, invoice, ledger, payment-rails, payment, reconciliation, reporting, risk, settlement, smart-contract, trade-finance, trade-intelligence, trust-score, wallet.

## A4. Shared Package Substrate (`Backend/packages/`)

`@baalvion/auth-node` (CJS — universal JWT authority) · auth-sdk · cache · commerce-rbac (commerce/order/inventory/fulfillment PEP) · config · contracts (gRPC + event SSOT) · crypto · errors · events · graceful-shutdown · logger · middleware · rbac · resilience (only order-execution) · response · sdk (payment, cms, all 6 trade svcs) · search · security · service-kit · telemetry · tenancy (RLS — search + 6 trade svcs) · types · upload · validation.

> These are `@baalvion/*`-scoped package names, independent of frontend folder names. Frontend renames do not touch them.

## A5. Frontend → Backend Dependency Matrix

| Frontend | Auth path | Primary API | Other backends |
|----------|-----------|-------------|----------------|
| Baalvion-Core (GTI) | auth-gateway:3099 BFF | trade-service:3025 | Java finance via `/finance-bff`; own Postgres `gti_orchestration` |
| Baalvion-Admin | auth:3001 BFF | admin-service:3021 | session:3022, oauth:3023, cms:3011, realtime:3026 WS, rbac:3055, all 19 domain svcs via `NEXT_PUBLIC_SERVICE_URLS`, crm:3063 |
| AmariseMaisonAvenue | auth:3001 / proxy:4000 | commerce:3012 | real-estate:3005, inventory:3014, order:3013, cms:3011, crm:3063 |
| Imperialpedia | auth:3001 BFF | imperialpedia:3004 | cms:3011, admin:3030 |
| BaalvionStack-Web | auth:3001 | proxy-service:4000 | Go data-plane (:10000 HTTP / :1080 SOCKS) |
| LawEliteNetwork | via law | law-service:3015 | cms:3011, law-elite-gateway:8090, Algolia (opt), Razorpay (via svc) |
| ControlTheMarket | auth-gateway:3099 | ctm-service:3017 | — |
| Baalvion-Mining | proxy:4000 | mining:3003 | cms:3018/3011 (R-R1), admin:3030 |
| Baalvion-InvestorRelations | auth:3001 BFF / local seed | ir-service:3008 | cms:3011, marketplace:3062 |
| Baalvion-Jobs | same-origin BFF | jobs-service:3002 | Keycloak:8088 (legacy, R-R6) |
| Baalvion-Insiders (founders) | auth-gateway:3099 | insiders-service:3050 | single gateway ingress |
| Baalvion-Insiders-SEO | none (public) | insiders-service:3050 | — |
| Baalvion-Dashboard | proxy:4000 / gw:3099 | dashboard:3009 | realtime:3040 WS |
| Baalvion-Connect | auth:3001 `/auth-bff` | brand-connector:3006 | — |
| Baalvion-About | cms only | about-service:3010 | cms:3011, admin:3030 |

## A6. Routing & Identity Backbone

- **Edge:** external TLS/host termination (not in repos) → **Traefik v3.1** (`Backend/infra/api-gateway/`), `:80→:443`, network `baalvion-net`. Routes by path `/api/v1/{group}/{service}`; forwards `Authorization` verbatim (no blanket gateway JWT).
- **Auth authority:** auth-service:3001 (RS256/JWKS) + auth-gateway:3099 (cookie BFF) + session:3022 + oauth:3023 + rbac:3055. Every JS/TS backend depends on `@baalvion/auth-node`.
- **Content:** cms-service serves about, mining, IR, imperialpedia, law via slug (port canonicalization: see R-R1).
- **Edge proxy clarification:** `Proxy-BaalvionStack` is a Vite/React SPA (the BaalvionStack product UI), NOT the platform reverse proxy. Public-domain TLS/host routing is handled by external infra.

## A7. Deployment & Environment Dependency Map

| Deploy channel | Apps | Notes |
|----------------|------|-------|
| Firebase App Hosting (`apphosting.yaml`) | Core, Amarise, Imperialpedia, Law, Mining, IR, Jobs, CTM, Connect, Dashboard | Mining scaled (max 10 / min 1) |
| Docker (Dockerfile) | admin-platform (compose `admin` profile), Amarise (3033), Law (9002) | only admin is compose-wired |
| PM2 (`pm2.config.js`) | about-web, fe-amarise, fe-jobs, fe-brand, fe-dashboard, fe-market, fe-imperial, fe-ir, fe-mining, fe-proxy, fe-admin | `ecosystem.config.js` also runs admin (`next start`, absolute path `D:/...`) |
| CI/CD (`.github/workflows/`) | jobs-portal.yml, ctm-frontend.yml, law-service.yml | only these 3 frontends gated |
| No deploy config | Baalvion-Insiders (Vite SPA), Baalvion-Insiders-SEO | active apps, no deploy path (R-R5) |

**Env-contract substrate (local defaults):** auth `:3001/v1/auth` or gateway `:3099`; CMS `:3011/api/v1/public` (mining uses `:3018`); realtime WS `:3040`/`:3026`; each app's `NEXT_PUBLIC_APP_URL` = its dev port. `For Invstors and Founders` + `insiders-seo` ship only `.env.example`.

## A8. Risk & Discrepancy Register

| ID | Sev | Item | Impact |
|----|-----|------|--------|
| R-C3 | HIGH | baalvion.com vs trade.baalvion.com — GTI `SITE_URL=trade.baalvion.com` contradicts map apex | SEO/canonical + map authority |
| R-R1 | HIGH | cms-service port 3018 (.env / mining) vs 3011 (Traefik/compose/most apps) | content fetch breakage risk |
| R-R2 | MED | host-port `:3014` shared by Node inventory-service & ledger-service | cannot co-run |
| R-R3 | MED | GTOS quality-inspection:3050 / supplier-lifecycle:3051 collide with insiders-service:3050 / elite-circle:3051 | separate compose mitigates; flag |
| R-R4 | MED | two realtime services (3040 infra, 3026 platform); admin WS → 3026 | confirm intended split |
| R-R5 | MED | Insiders (founders) + Insiders-SEO have no deploy config | not deployable as-is |
| R-R6 | LOW | Jobs references Keycloak:8088 (legacy) alongside platform auth | auth duplication |
| R-R7 | LOW | `ci.yml:35-36` lints `admin-platform/src` / `Proxy-BaalvionStack/src` without `Frontend/` prefix | already-broken paths |
| R-R8 | LOW | `For Invstors and Founders` folder name has typo + spaces | fragile in scripts |
| R-R9 | INFO | `Baalvion-Core` is a nested git repo | rename needs special handling |

---

# PART B — Folder-Name Standardization Plan (NOT EXECUTED)

**Execution authorization: NOT GRANTED. Plan only. Each phase is a separate PR requiring explicit approval. Do not begin Phase 1.**

## B0. Preconditions (all must be TRUE before Phase 1)
1. Inventory approved (done).
2. Branch `feat/mining-trust-compliance` uncommitted work committed or stashed — start from a clean tree.
3. R-R1 (cms port) and R-C3 (apex domain) decided to avoid compounding churn.
4. Dedicated branch `chore/folder-standardization` off `main`.
5. No active deploy windows; PM2 snapshot `pm2 jlist > snapshot.json` captured for rollback.

## B1. Standardized Rename Map

| Current | Proposed |
|---------|----------|
| `Global-Trade-Infrastructure-main` | `Baalvion-Core` |
| `admin-platform` | `Baalvion-Admin` |
| `AmariseMaisonAvenue-main` | `AmariseMaisonAvenue` |
| `Imperialpedia-main` | `Imperialpedia` |
| `Proxy-BaalvionStack` | `BaalvionStack-Web` |
| `Law-Elite-Network-main` | `LawEliteNetwork` |
| `controlthemarket-main` | `ControlTheMarket` |
| `Mining.Baalvion-main` | `Baalvion-Mining` |
| `IR-Baalvion-main` | `Baalvion-InvestorRelations` |
| `company-unified-Dashboard-main` | `Baalvion-Dashboard` |
| `brand-connector-main` | `Baalvion-Connect` |
| `about-baalvion-main` | `Baalvion-About` |
| `Baalvion-Jobs-Portal-main` | `Baalvion-Jobs` |
| `For Invstors and Founders` | `Baalvion-Insiders` |
| `insiders-seo` | `Baalvion-Insiders-SEO` |

## B2. Generic Per-Rename Runbook (atomic unit)
1. `git mv "Frontend/<old>" "Frontend/<new>"` (preserves history).
2. Update PM2: `pm2.config.js` `cwd`; `ecosystem.config.js` (admin only, incl. absolute path).
3. Update Docker: `docker-compose.yml` `build.context` (admin only).
4. Update root scripts: `scripts/install-all.js`, `verify_ai_builds.sh`, `package.json` turbo filter (admin only).
5. Update `local-env/*.ps1` + `local-env/README.md` (imperialpedia, admin, IR only).
6. Update CI: `.github/workflows/{jobs-portal,ctm-frontend,law-service,ci}.yml` (affected apps only).
7. Regenerate lockfile: `pnpm install`.
8. Update docs/runbooks referencing `Frontend/<old>`.
9. Validate (B4 gate). 10. Commit as one PR per app; merge only on green.

## B3. Phases (lowest → highest risk)

| Phase | Apps | Special handling |
|-------|------|------------------|
| P0 (prep) | decisions R-R1/R-C3, branch, PM2 snapshot | — |
| P1 — zero-config | insiders-seo → Baalvion-Insiders-SEO | lockfile only |
| P2 — simple PM2/Firebase | Amarise, Imperialpedia, Mining, About, Connect, Dashboard | About uses `next start` — rebuild |
| P3 — Docker/CI single-workflow | Law, CTM | update workflow paths; law-service.yml also gates backend |
| P4 — CI + name cleanup | Jobs (jobs-portal.yml); For Invstors and Founders → Baalvion-Insiders (fix spaces/typo, no deploy config) | verify no script assumed the spaced path |
| P5 — IR | IR → Baalvion-InvestorRelations | local-env scripts |
| P6 — Admin (widest) | admin-platform → Baalvion-Admin | 9 files incl. Docker, absolute path, turbo filter; do alone |
| P7 — Core (nested repo) | GTI → Baalvion-Core | R-R9; verify nested repo remotes/CI; do last, alone |
| P8 — BaalvionStack-Web | Proxy-BaalvionStack → BaalvionStack-Web | also fix R-R7 stale ci.yml prefix |
| P9 — closeout | update PROJECT_STRUCTURE.txt, this doc, memory map | re-freeze |

> Apps within a phase are independent and may be parallelized, but MERGE SERIALLY to keep the lockfile conflict-free.

## B4. Validation Gate (per rename — all must pass before merge)
- `pnpm install` clean (lockfile regenerated, no missing workspace).
- `pnpm --filter <pkg> build` green for the renamed app.
- `pm2 start <config> --only <app>` smoke → HTTP 200 on its port.
- CI-gated apps: workflow dry-run / branch push shows green.
- `grep -r "Frontend/<old>"` returns zero operative hits (docs-only residue acceptable, tracked).

## B5. Rollback Procedures
- **Pre-merge:** `git reset --hard` the branch (renames not live → no impact).
- **Post-merge, single app:** `git revert <merge-sha>` → `pnpm install` (restores lockfile) → `pm2 reload <app>`. 14/15 are plain folders, so revert fully restores path + history.
- **Baalvion-Core (nested repo):** rollback = `git mv` parent folder back; nested git state is unaffected by parent-folder name; re-verify its CI remote paths.
- **PM2 fleet recovery:** `pm2 resurrect` from P0 `snapshot.json` if process names drift.
- **Firebase App Hosting:** folder rename does not change hosted backend ID; redeploy previous commit if a deploy fired mid-rollback. No DNS/domain change in any phase — domains are folder-name-independent.

## B6. Out of Scope (freeze-safe boundaries)
- No domain, DNS, reverse-proxy, or gateway changes (routing is folder-name-independent).
- No backend service, package, port, or schema changes (R-R1…R-R6 are flagged, not fixed here).
- No creation of `baalviongroup.com` (on hold).
- No deploy-config creation for the two unconfigured apps (R-R5 = separate decision).

---

## Open Decisions (deferred to executive review)
1. R-C3 — `Baalvion-Core` canonical domain: `baalvion.com` apex vs `trade.baalvion.com`.
2. R-R1 — canonical `cms-service` port: 3011 vs 3018.
3. `baalviongroup.com` — future role and whether to create.

See `ARCHITECTURE-RECOMMENDATIONS.md` for the recommendation report on items 1–3.

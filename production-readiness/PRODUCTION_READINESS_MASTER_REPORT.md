# Baalvion + Global Trade Infrastructure — Production Readiness Master Report

**Date:** 2026-06-03 · **Branch:** `feat/platform-foundation`
**Author:** Production-readiness mission (Staff Eng / DevOps / QA / Security)
**Backing detail:** see the per-phase reports in `production-readiness/`.

---

## Executive Summary

The platform is **architecturally strong and largely real** — this is not a mock prototype. The identity core (RS256/BFF), commerce core (orders/payments/RBAC/CMS/audit), and a mature GTI trade-service are genuinely DB-backed and were verified live. The **headline P0 financial defect (order FX) is fixed and proven across all 5 markets**, and the full paid checkout flow works end-to-end.

However, **public production launch is blocked** by a small set of CRITICAL security issues, GTI authorization gaps, AWS deployment blockers, and a content gap (100% placeholder product imagery). These are finishable, not foundational.

### Launch Status

| Scope | Status | Rationale |
|-------|--------|-----------|
| **Overall platform** | 🔴 **NOT READY** | 3 open CRITICAL security issues, GTI P0 authz gaps, AWS root-container/TLS blockers, placeholder imagery. |
| **Amarisé commerce (order→pay)** | 🟡 **READY WITH RISKS** (limited beta, behind auth) | Pricing now financially correct (5-market verified); paid flow works. Gated by: stored-XSS fix (affects Amarisé CMS render) + real product images. |
| **GTI** | 🔴 **NOT READY** (limited-beta grade) | Core loop real & demoable, but P0 input-validation/IDOR/tenant-spoofing + dormant finance engines. |
| **Admin platform** | 🟡 **READY WITH RISKS** | Core 9/16 capabilities real & DB-verified; 4 modules unmounted (404), 1 missing. |

---

## What was fixed & verified this session (committed)

| # | Fix | Commit | Evidence |
|---|-----|--------|----------|
| 1 | **Order FX conversion (P0)** — orders persisted base USD labelled as market currency; now converted + market tax rule, all 5 markets | `3aba9d77` | 28/28 unit tests + live E2E (IN total ₹34,500 → **₹2,873,900**, matching display) + DB rows |
| 2 | **Runtime conflict** — `cms-service` ran in both PM2 & Docker (3,302 crash restarts); removed PM2 zombie, Docker-first standard documented | `93d39e8e` | PM2 40→39; :3011 still served by Docker |
| 3 | **Security C-01** — dev inter-service secret fail-fast in prod (proxy, insiders) | `a660cc1c` | matches payment/cms guard pattern |
| 4 | **Phase 7 validation** — browse↔checkout price parity (5 markets) + full paid guest flow | (this report) | live E2E PASS |

---

## Open Issues (consolidated, prioritized)

### 🔴 P0 — must fix before public launch

| ID | Area | Issue | Source |
|----|------|-------|--------|
| P0-1 | Security | **trade-service mass-assignment** — `Model.create(req.body)` in 6 controllers lets callers forge `buyer_org_id`/`seller_org_id`/`status`/tenant. Allowlist fields. | SEC C-02 / GTI |
| P0-2 | Security | **Stored XSS** — `dangerouslySetInnerHTML` on unsanitized CMS HTML in 5 frontends (controlthemarket, Imperialpedia, Mining, **Amarisé**, brand-connector). Add DOMPurify. | SEC C-03 |
| P0-3 | Security | **HS256 fallback** when `JWT_PUBLIC_KEY` absent in `@baalvion/auth-node` — enforce RS256 in prod (`requireRs256InProduction`). | SEC C-04 |
| P0-4 | GTI | **No server-side input validation** on trade routes; **document/compliance IDOR** (no tenant scoping); **tenant-spoofing** on `createDeal`/`createListing`. | GTI / SEC |
| P0-5 | AWS | **Node images run as root** but Helm asserts `runAsNonRoot:true` → pods fail to start. Add `USER node`. | AWS |
| P0-6 | AWS | **No graceful SIGTERM** in ~28 Node services (`@baalvion/graceful-shutdown` adopted by 0) → rolling deploys drop in-flight requests. | AWS |
| P0-7 | AWS | **`NEXT_PUBLIC_*` passed as runtime env, not build args** → client bundles ship wrong API URLs. | AWS |
| P0-8 | AWS | **No edge TLS** — Traefik ACME commented out; no ALB/CloudFront/Route53/WAF. | AWS |
| P0-9 | Media | **100% placeholder product images** (picsum); commerce-service stores media on local FS, not object storage; no category/collection hero images. | Media |
| P0-10 | Admin | **4 admin modules unmounted** (analytics/developer/support/feature-flags) — controllers+migrations exist but not in `routes/v1.js` → pages 404; `admin` schema empty. | Admin |

### 🟠 P1 — fix before GA / scale

- **Security HIGH (7):** SSRF in `auditExportService` (admin-configurable webhook → internal metadata); + 6 others — see SECURITY_AUDIT_REPORT.
- **GTI:** stand up the (now-compiled) Java finance suite — `FINANCE_ENABLED=false`, only payment-service running → money/AML/intelligence dormant. Document "vault" is metadata-only (no S3). Replace mock dashboard KPIs; remove dead/throwing `/auth/*` local endpoints.
- **AWS:** 8 backend services + 13/15 frontends have **no Dockerfile**; CI prod build matrix covers only 2/~35 images; migrate job not ECS-portable (raw `node:20` + bind-mount + hardcoded DB pw); unstructured `console.*` logging (`@baalvion/logger` unused); no `/metrics` despite Prometheus annotations.
- **Admin:** analytics/feature-flags clients point at wrong base URL (proxy gateway vs admin-service); identity-center api-keys/JWKS/SSO/MFA/devices/token-revocation are stubs (404).
- **Media:** S3 + CloudFront, install `sharp`, enable AVIF/WebP + backfill thumbnails, drop placeholder hosts from `remotePatterns`/CSP.
- **Runtime:** delete stale `pm2.config.js`; add Postgres/Redis readiness gate for any interim PM2 use; migrate remaining services into `docker-compose.yml`.

### 🟡 P2 / 🟢 P3

- P2: Security MED (5) — CORS/headers/error-leak hardening; audit-log consumer not ingesting (`audit.events=0`); only 3 RBAC tenants seeded; Users CSV export 404; commerce↔order base-price source unification; inclusive-tax shipping table.
- P3: Security LOW (3); AI module (migration only, no code); Reviews "Coming Soon" stub; extract `@baalvion/markets` shared package (FX logic mirrored between commerce & order services).

---

## Severity rollup (across phases)

| Source | CRITICAL | HIGH | MED | LOW |
|--------|:--------:|:----:|:---:|:---:|
| Security audit | 4 (1 fixed → **3 open**) | 7 | 5 | 3 |
| AWS readiness | 0 | 9 | 9 | 4 |
| GTI | (4 P0 items) | — | — | — |
| Admin | (4 broken + 1 missing) | — | — | — |
| Media | (content/hosting P0) | — | — | — |

---

## Estimated effort remaining

| Track | Scope | Estimate |
|-------|-------|----------|
| **P0 security** (C-02/03/04 + GTI authz) | mass-assignment allowlists, DOMPurify ×5, RS256 enforcement, trade input validation + tenant scoping | **5–8 days** |
| **P0 AWS** (containerize for ECS/EKS) | non-root images, SIGTERM, NEXT_PUBLIC build args, migrate-as-init, ALB/CloudFront/Route53/ACM/WAF | **8–12 days** |
| **P0 content/media** | real photography + flip commerce to object storage + category heroes | **3–5 days** (mostly content/ops) |
| **P0 admin** | mount 4 modules + run migrations + base-URL fixes | **1–2 days** |
| **P1 backlog** | Dockerfiles for remaining services/frontends, finance suite, logging/metrics, media CDN | **2–4 weeks** |

**To limited commerce beta (Amarisé, behind auth):** ~1 week (P0-2 XSS for Amarisé + P0-9 images + P0-3 auth). **To full GA:** ~4–6 weeks.

---

## Deployment recommendation

1. **Adopt Docker-first → ECS/EKS** as the single standard (see RUNTIME_CONFLICT_AUDIT). It also resolves the PM2 boot crash-loop via compose/K8s dependency ordering.
2. **Do not accept public traffic** until the 3 open CRITICALs (P0-1/2/3), GTI P0 authz (P0-4), and AWS root-container + TLS blockers (P0-5/8) are cleared.
3. **Sequence:** (a) P0 security — fast, high-leverage; (b) P0 AWS containerization hardening in parallel; (c) P0 admin module mounting (1–2 days); (d) media content/hosting; then (e) staged limited beta of the now-correct Amarisé commerce path behind auth, with canary + Argo Rollouts (already wired) before GA.
4. **Keep the strengths:** OIDC + Trivy + gosec + ArgoCD GitOps, SHA image tags, `/readyz` DB checks, gateway HPA, RS256/BFF auth, server-authoritative pricing — these are production-grade; the work is finishing coverage, not rebuilding.

---

## Appendix — phase reports

- `PHASE1_ORDER_FX_FIX.md` — Phase 1.1 (order FX, fixed & verified)
- `RUNTIME_CONFLICT_AUDIT.md` — Phase 1.2 (PM2/Docker, single standard)
- `AWS_PRODUCTION_READINESS_REPORT.md` — Phase 2
- `ADMIN_AUDIT_REPORT.md` — Phase 3
- `GTI_AUDIT_REPORT.md` — Phase 4
- `MEDIA_AUDIT_REPORT.md` — Phase 5
- `SECURITY_AUDIT_REPORT.md` — Phase 6
- Phase 7 (E2E validation) — results summarized in this report (browse↔checkout parity ×5 markets + full paid guest flow, both PASS).

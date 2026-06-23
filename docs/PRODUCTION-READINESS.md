# Backend Production-Readiness Scorecard

> **Audit date:** 2026-06-23
> **Branch:** `feat/consolidated-prod-readiness`
> **Scope:** 42 prod-bound backend services (from `deploy/consolidated/pm2/*.config.js`)
> **Method:** parallel static audit (one auditor per service) + objective `tsc`/`turbo` checks
> + catalog contract enforcement (`architecture:check`).

This document is a generated audit artifact. Re-run the audit to refresh it.

---

## Executive summary

| Dimension | Result |
| --- | --- |
| Architecture contract (`architecture:check`) | ✅ **0 violations** (58 descriptors, 2607 files) |
| TypeScript compile (`tsc --noEmit`) | ✅ **12/12 TS backend services pass** |
| Secret leaks (git-tracked) | ✅ **None** (`.env` gitignored; 2 dev-default fallbacks only) |
| Duplicate / orphaned services | ✅ **None** |
| **Average readiness score** | **73 / 100** |
| **Services without any tests** | 🔴 **27 / 42 (64%)** |

**The dominant finding:** services have excellent operational plumbing (health probes,
graceful shutdown, telemetry, rate limiting, `zod` available) but lack a **verification
layer** — tests. Almost every D/F grade reduces to *"well-architected, but zero tests."*

---

## Grade distribution

| Grade | Range | Count | Services |
| --- | --- | --- | --- |
| 🟢 A | 90–100 | 8 | search (100), rbac (99), ir (95), marketplace (95), inventory (94), ctm (92), auth (91), trade (90) |
| 🟢 B | 80–89 | 5 | commerce (88), order-execution (87), oauth (86), jobs (83), proxy (80) |
| 🟡 C | 70–79 | 13 | order (78), law (77), audit (75), agent (75), developer (75), real-estate (73), cms (72), dashboard (72), report (71), about (70), market (70), brand-connector (70), mining (70) |
| 🟠 D | 60–69 | 11 | quality-inspection (65)…product-registry (60); also notification, session, realtime-infra, tenant, network-graph, trade-doc, fulfillment, imperialpedia, supplier |
| 🔴 F | < 60 | 5 | insiders (55), admin (51), auth-gateway (50), crm (40), realtime-platform (34) |

---

## Systemic issues (whole-fleet counts)

| Issue | Count | Severity |
| --- | --- | --- |
| Services with **no automated tests** | 27 / 42 | 🔴 High |
| Swallowed / silent `catch` blocks | 93 | 🟠 High — hides JWT/DB/socket failures |
| `console.log` instead of structured logger | 313 | 🟡 Medium |
| `zod` declared but **not wired** at request boundaries | ~10 services | 🟠 High |
| No backend **lint** layer (ESLint not installed; 2/42 have lint scripts) | fleet-wide | 🟡 Medium |
| Missing service `README.md` | most | 🟡 Medium |
| Files > 800 lines | 3 (admin aiService 995, admin 900, order 1038) | 🟢 Low |
| Dead duplicate entrypoint (`insiders/server.js`) | 1 | 🟢 Low (removed) |
| Dev-password fallbacks in source (not leaks) | 2 | 🟢 Low |

---

## The 5 F-grade services (fix first)

| Service | Score | Top blockers |
| --- | --- | --- |
| `platform/realtime-service` | 34 | Hand-rolled RFC6455 WS, **0 tests**; hardcoded `baalvion_dev_pass` fallback (index.js:84); ~12 silent catches |
| `ecosystem/crm-service` | 40 | No body validation (zod declared, unused); **0 tests**; public create endpoints (`/crm/appointments`, `/crm/support-tickets`) |
| `identity/auth-gateway` | 50 | Security-critical trust boundary; **0 tests**; no input validation on `/auth/login`,`/register`; 21 silent catches |
| `platform/admin-service` | 51 | **0 tests**; no validation (zod unused); 995-line `aiService.js`, 900-line `adminService.js` |
| `ecosystem/insiders-service` | 55 | **0 tests**; no validation; dead `server.js` stub (removed) |

## The 8 A-grade services (the template to clone)

`search-service` (100) and `rbac-service` (99) have everything — health/readiness split,
graceful shutdown, telemetry, zod validation, rate limiting, tests. **Use these as the
reference pattern when bringing the rest up to bar.**

---

## Remediation roadmap

**Phase 1 — Quick wins & safety**
- Stand up a backend **ESLint** layer (flat config + install + scripts)
- Remove dead code (`insiders/server.js` ✅), split 3 oversized files
- Harden dev-password fallbacks to fail-loud in production

**Phase 2 — Close silent failures & validation**
- Replace 93 swallowed catches with logged handling
- Wire the already-declared `zod` schemas as route middleware
- Replace 313 `console.log` with `@baalvion/telemetry`

**Phase 3 — Tests** (worst-first)
- Start with the 5 F + security-critical (`auth-gateway`, `session-service`)
- Clone A-grade patterns; drive to 80% coverage

**Phase 4 — Enforce in CI**
- Required gates on `main`: coverage ≥ 80%, lint, type-check, no-console, `architecture:check`

---

## Storage cleanup (completed 2026-06-23)

| | Before | After | Reclaimed |
| --- | --- | --- | --- |
| Repo size | 10.98 GB | 7.05 GB | 3.93 GB + 366 pruned store packages |

Deleted 26 project-owned build-artifact dirs (`.next`, `dist`, `.turbo` outside
`node_modules`) + `pnpm store prune`. All regenerable via `pnpm build`; zero source impact.

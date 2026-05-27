# Auth Production Readiness Scorecard + GO/NO-GO (Phase 11)

Tags: **[V]** verified · **[S]** sampled · **[U]** uncertain (no live env). This static environment has
**no running stack, DB, Redis, or load tooling** — so Phase-11 live steps (staging validation, REAL
migrations, secret rotation, load/abuse tests) were **NOT executed** and are **not** claimed.

## Step 2 — Migration execution status: ❌ NOT EXECUTED
Tooling is built + committed (no DB to run it): `scripts/import-island-users.mjs`,
`scripts/analyze-password-reset.mjs`, `auth-unification/000_add_password_reset_required.sql`,
`auth-service/migrations/003_auth_audit_log.sql`, `SNAPSHOT_RUNBOOK.md`. **Cannot run**: no DB here, and
**trade/elite-circle/insiders are not yet cut over** (importing their users is premature). law import is
runnable once a DB is available. `migration-run-report.md` will be produced from the real run.

## Step 7 — Security validation summary
| Check | Status |
|---|---|
| Forged-token rejection | [V] auth-node verifies signature (RS256) — invalid sig rejected (unit) |
| HS256 downgrade rejection | [V] `rejectHs256` + RS256-only verifier (unit) |
| Audience mismatch rejection | [V] verifier enforces `aud` when set (jsonwebtoken) |
| Issuer mismatch rejection | [V] verifier enforces `iss` when set |
| Replay (revoked) rejection | [V] shared blacklist unit-proven (7/7); [U] live cross-service |
| Expired-token rejection | [V] jsonwebtoken `exp` |
| Load / refresh-storm / abuse tests | ❌ NOT RUN (no stack) |

## Step 8 — Scorecards
### A. SECURITY
| Item | Status |
|---|---|
| Issuer centralization | ⚠️ 1 canonical + 3 sanctioned, **but 3 HS256 islands remain** [V] |
| Secret management | ❌ rotation NOT executed; verify no plaintext/fallback before go [U] |
| Token storage (no localStorage) | ❌ 7 frontend violations [V] |
| Blacklist propagation | ⚠️ mechanism done + unit-proven; per-consumer Redis injection + live proof pending [V/U] |
| Impersonation safety | ✅ isolated issuer, ≤15m, super_admin, audited, banner [V] |

### B. RELIABILITY
| Item | Status |
|---|---|
| Failover readiness | [U] no live env |
| Rollback readiness | ✅ runbook + snapshots + provenance + `.down.sql` + dual-key [V doc] |
| Migration safety | ✅ dry-run-default, idempotent, non-destructive tooling [V] / ❌ not executed |
| Monitoring coverage | ⚠️ spec authored; not deployed [V doc] |

### C. PERFORMANCE — [U] (no load tests; no live latency data)
### D. OPERATIONS
| Item | Status |
|---|---|
| Dashboards | spec only [V doc] |
| Alerts | rules defined [V doc] |
| Runbooks | cutover + rollback authored [V] |
| Escalation paths | owners/SLAs in rollback runbook [V] |

## Step 9 — FINAL GO / NO-GO

# 🔴 NO GO

**Rationale:** A "fully unified canonical auth" production cutover cannot proceed while three services
(**trade, elite-circle, insiders**) still issue **HS256** tokens, frontends still persist tokens in
**localStorage**, **Keycloak** is not fully retired, and **no migration / secret rotation / live
validation** has been executed. CI guards confirm: **3 of 4 FAIL** (only RS256-algorithm passes).

**Blockers (must clear):**
1. Migrate trade / elite-circle / insiders to canonical (retire their HS256 issuers).
2. Frontend cutover: remove 7 localStorage token writes + Firebase/Supabase; cookie auth.
3. Full Keycloak retirement (infra/realm/env) + verify.
4. Execute + verify DB migrations (snapshots first) in staging → `migration-run-report.md`.
5. Rotate all auth secrets; prove no plaintext/fallback in repo.
6. Run live staging validation (§1 cutover runbook) + load/abuse tests → green.

**Risks if forced now:** mixed-auth breakage (island logins issue tokens the canonical verifier
rejects, and vice-versa), frontend token theft via localStorage, no executed rollback rehearsal.

**Mitigation / path to GO:** complete blockers 1–6; `npm run ci:auth:guards` all green; staging
validation + security tests pass; then re-issue GO/NO-GO.

**Rollback confidence:** High (docs/snapshots/provenance) once migrations are actually run with snapshots.
**Estimated downtime (when ready):** 30–60 min maintenance window; ≤30 min full rollback.
**Operator requirements:** DBA on-call, Platform on-call, Security on-call (key rotation), Frontend on-call.

## Done-slice note
The **canonical backend consumers + law + shared infra (blacklist/audit/impersonation)** ARE
production-grade and regression-guarded — a *scoped* go-live of that slice is defensible, but the
**program-level cutover is NO GO** until the above blockers clear.

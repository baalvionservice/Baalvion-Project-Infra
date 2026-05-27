# Auth Production Cutover Runbook (Phase 11)

> ⚠️ **NOT YET EXECUTABLE — preconditions unmet (see §0).** This runbook is the procedure for when
> the migration is actually complete. It was authored in a static environment with **no running
> stack, no DB, no Redis** — so steps 1, 2, 7 of Phase 11 (live staging validation, real migrations,
> load tests) were **not performed** and must be run by operators with the real environment.

## 0. BLOCKING preconditions (all must be ✅ before cutover)
| Precondition | Status (Phase 10 evidence) |
|---|---|
| `npm run ci:auth:guards` all green | ❌ 3/4 FAIL (localStorage 7, auth-middleware 12, jwt-imports 1) |
| trade / elite-circle / insiders migrated to canonical | ❌ still HS256 issuers |
| Keycloak fully retired (infra/realm/env) | ❌ partial only |
| Frontends on cookie auth / auth-sdk; 0 localStorage tokens | ❌ Mining + Proxy-BaalvionStack still localStorage |
| DB migrations executed + verified in staging | ❌ not executed (no DB) |
| Secrets rotated (RS256/refresh/internal/impersonation) | ❌ not executed |
| Live staging validation (§1 below) green | ❌ not executed |
**→ Cutover is NO-GO until every row is ✅.**

## 1. Deployment order
1. `auth-service` (issuer + JWKS + audit) — must be healthy first.
2. Shared `packages/auth-node` consumers (no per-service order; backward-compatible).
3. `proxy-service`, `realtime-service` (verify-only / websocket).
4. Islands AFTER their migration: law (done), then trade/elite-circle/insiders.
5. Frontends LAST (after backends canonical), behind feature flag.

## 2. Maintenance windows
- Low-traffic window; 30–60 min. Auth-service is the only hard dependency — keep its old + new versions both able to verify during the window (JWKS dual-publish, §rollback).

## 3. Rollback
See `auth-rollback-runbook.md` (per-operation triggers/commands/owners/SLAs).

## 4. Validation checkpoints (run after each deploy)
- `/health` 200 + `redis:true`; `/.well-known/jwks.json` + `/.well-known/openid-configuration` 200.
- Login → canonical RS256 token (assert iss/aud/sub/org_id/sid/jti/roles[]).
- Call 2 migrated services with the token → 200; with a tampered token → 401.
- Logout → same token rejected on a *different* service within 1s (blacklist propagation).
- RBAC: admin route denied to member; allowed to admin/owner/super_admin.
- Audit rows present for login/logout/token_revoked.

## 5. DNS cutover
- Point the auth domain (e.g. `auth.baalvion.com`) at the new auth-service ingress; TTL lowered 24h prior.

## 6. Cache invalidation
- Invalidate JWKS caches (verifier `jwksTtlMs` default 5m — wait one TTL or call `resetCache`).
- Purge CDN/edge caches for `/.well-known/*`.

## 7. Cookie domain validation
- Refresh cookie (`httpOnly; Secure; SameSite`) scoped to the shared parent domain for cross-app SSO; verify it is sent on all app subdomains and NOT readable by JS (except the non-httpOnly `baalvion_impersonation` banner flag).

## 8. TLS verification
- Valid cert on the auth domain + all app domains; HSTS; no mixed content; JWKS served over HTTPS.

## 9. Cross-domain auth validation
- Login on one app → access another app without re-login (shared cookie + canonical token).

## 10. Session invalidation strategy
- Logout writes `auth:blacklist:<jti>` (TTL = token expiry delta) → all consumers reject within ≤ JWKS/verify path (sub-second).
- "Sign out everywhere": revoke all refresh-token families (`revokeAllForUser`) + blacklist active jtis.

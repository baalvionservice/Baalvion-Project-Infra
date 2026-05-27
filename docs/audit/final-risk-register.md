# Final Risk Register — Baalvion Auth Unification (Phase 12)

| # | Risk | Severity | Likelihood | Mitigation | Owner |
|---|---|---|---|---|---|
| 1 | trade/elite-circle/insiders still issue HS256 (not unified) | **Critical** | Certain (present) | migrate islands (A2–A5 each); retire HS256 issuers | Backend |
| 2 | Keycloak still wired in baalvion-os (`jwt.strategy`, `realm_access`) | High | Certain | finish Keycloak retirement → auth-service JWKS verify in baalvion-os | Platform |
| 3 | Firebase auth in brand-connector FE | High | Certain | remove `fb-compat`; cookie/auth-sdk | Frontend |
| 4 | Supabase auth in elite-circle/law FEs | High | Certain | remove Supabase auth shims | Frontend |
| 5 | localStorage token writes (7) | High | Certain | cookie auth cutover (Phase 7) | Frontend |
| 6 | Blacklist not injected into every consumer (opt-in) | Medium | Likely | inject shared Redis client into each `createAuthMiddleware` | Platform |
| 7 | No executed migration / snapshots / rollback rehearsal | **Critical** | Certain | run in staging with snapshots → `migration-run-report.md` | DBA |
| 8 | Secrets not rotated; verify no plaintext/fallback | High | Unknown | rotate RS256/refresh/internal/impersonation; secret-store only | Security |
| 9 | No live revocation-propagation / load / abuse validation | High | Certain | run in a Redis+DB+multi-service env | Platform/Security |
| 10 | Impersonation issuer accepted by no consumer yet (inert) | Low | Likely | opt consumers into `baalvion-auth-impersonation` issuer if cross-service impersonation needed | Platform |
| 11 | `packages/middleware` unused but uses direct jwt | Low | Certain | migrate to auth-node or delete | Platform |
| 12 | trade dual-tenancy (tenant_id/org_code) ↔ canonical org_id unresolved | Medium | Certain | decide mapping during trade A2/A3 | Backend |
| 13 | trade/island id↔email reconciliation (like law) | Medium | Certain | email-resolution-in-middleware pattern | Backend |
| 14 | Embedded git repo (trade-service) blocks parent commits | Medium | Certain | commit in trade repo or de-embed | Platform |

Top blockers to certification: **#1, #7** (Critical); then #2–#5, #8, #9 (High).

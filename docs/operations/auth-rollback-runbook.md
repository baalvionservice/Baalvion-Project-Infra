# Auth Rollback Runbook (Phase 11)

> Authored without a live environment; rollback commands are the procedure for operators. Every
> critical operation below has a trigger, command, owner, and recovery SLA. **Snapshots are taken
> BEFORE any migration (see migration-run-report.md §pre).**

| Operation | Rollback trigger | Rollback command / action | Owner | SLA |
|---|---|---|---|---|
| **DB migration (island/keycloak import)** | row-count mismatch, dup corruption, or post-migrate verify fail | `psql "$DB" < <snapshot>.sql` (restore) OR targeted, non-destructive: `DELETE FROM auth.team_members tm USING auth.users u WHERE tm.user_id=u.id AND u.imported_from='<island>'; DELETE FROM auth.users WHERE imported_from='<island>';` (provenance column) | DBA on-call | 15 min |
| **auth_audit_log / blacklist schema** | migration error | run the paired `*.down.sql` (e.g. `000_add_password_reset_required.down.sql`) | DBA | 5 min |
| **auth-service deploy** | health check fail / 5xx spike / JWKS error | redeploy previous image tag; keep DB compatible (no destructive auth schema change in same deploy) | Platform on-call | 10 min |
| **JWKS / RS256 rotation** | consumers reject valid tokens (unknown kid) | revert `JWT_ACTIVE_KID` to prior key; keep BOTH public keys published via `JWT_ADDITIONAL_PUBLIC_KEYS` during any roll (overlap window) | Security on-call | 10 min |
| **RBAC rollout** | mass 403s | revert the RBAC config/deploy; auth-node rbac is additive — prior tokens still verify | Platform | 10 min |
| **Frontend auth rollout** | login broken on an app | flip the app's auth feature flag back to legacy; backends still accept prior tokens during overlap | Frontend on-call | 10 min |
| **Shared blacklist (Redis) misbehaving** | false revocations / latency | the verifier fails CLOSED on Redis outage by design — if that blocks all traffic, scale/restore Redis; do NOT disable the check (would re-open revoked tokens) | Platform/Security | 15 min |

## Rollback confidence
- DB: **High** — snapshots + non-destructive `imported_from` provenance + `.down.sql` for additive migrations.
- Deploy/JWKS: **High** — image-tag rollback + dual-key publish.
- Frontend: **Medium** — depends on feature-flag wiring (not yet built; see Phase 7).
- Islands: **N/A** — not yet migrated; their cutover is gated behind their own dual-issue window.

## Global "break glass"
Revert auth-service to the last known-good tag; restore the auth DB snapshot; keep the prior signing
key published. Estimated full rollback: **≤ 30 min** with snapshots present.

# Auth Observability & Alerts (Phase 11)

> Spec for the metrics + alerts to wire into the existing stack (services already expose
> `prom-client` via `middleware/metrics.js`; auth-node logs blacklist hits; AuditService writes
> `auth.auth_audit_log`). **Not deployed here** (no live Prometheus/Grafana) — this is the
> dashboards-as-config + alert-rules definition.

## Metrics catalog
### AUTH
| Metric | Source |
|---|---|
| `auth_login_total{result=success\|failure}` | auth-service login controller (audit events login_success/failure) |
| `auth_refresh_total{result}` | refresh controller / audit `refresh` |
| `auth_blacklist_hits_total` | auth-node `logger.warn('[auth-node] blacklisted token rejected')` + audit `token_revoked` |
| `auth_token_verify_fail_total{reason}` | auth-node VerifyError `code` (blacklisted, alg_not_allowed, missing_claim, malformed, blacklist_unavailable) |
| `auth_jwks_fetch_fail_total` | createJwksVerifier fetchJwks rejections |
| `auth_rbac_denied_total{service}` | rbac guards (403s) |
| `auth_impersonation_total{event=start\|end}` | admin audit impersonation_started/ended |

### SECURITY
- `auth_invalid_token_total{reason=forged\|expired\|replay\|revoked}` (from VerifyError codes + jsonwebtoken errors).
- `auth_impersonation_active` gauge; `auth_impersonation_start_total` (spike detection).

### INFRA
- `redis_command_latency_seconds` (blacklist GET path), `pg_query_latency_seconds`,
  `authservice_http_request_duration_seconds`, `jwt_verify_duration_seconds`.

## Alert rules (thresholds — tune per traffic)
| Alert | Condition | Severity |
|---|---|---|
| Blacklist unavailable | `rate(auth_token_verify_fail_total{reason="blacklist_unavailable"}[5m]) > 0` | **critical** (fail-closed → auth outage) |
| JWKS unavailable | `rate(auth_jwks_fetch_fail_total[5m]) > 0` for 2m | critical |
| auth-service down | `up{job="auth-service"} == 0` for 1m | critical |
| Excessive login failures | `rate(auth_login_total{result="failure"}[5m]) > N` (per-IP/email guards already lock at 5) | warning |
| Impersonation spike | `increase(auth_impersonation_start_total[10m]) > 3` | warning (security) |
| Refresh storm | `rate(auth_refresh_total[1m]) > M` | warning |
| Revoked-token attempts | `rate(auth_blacklist_hits_total[5m]) > K` | info/security |

## Health endpoints
- auth-service `/health` (already returns `{status, redis}`); add `/health/auth` aggregating JWKS reachability + Redis (blacklist) + audit DB write probe.
- JWKS: `/.well-known/jwks.json`; OIDC: `/.well-known/openid-configuration`.

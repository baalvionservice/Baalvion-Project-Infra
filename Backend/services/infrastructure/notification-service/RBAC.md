# notification-service — RBAC (Phase 3)

Migrated to canonical auth via `@baalvion/auth-node` `createAuthMiddleware`.

## Roles
notification-service exposes **no user-facing role-gated routes**. Access is either:
- **service-to-service** via HMAC (`internalAuth`, `INTERNAL_SERVICE_SECRET`), or
- **canonical bearer token** (`authMiddleware`) on user-scoped endpoints, scoped by
  `req.auth.userId` / `req.auth.orgId`.

No `requireRole` is used → **no legacy→canonical role mapping required.**

## req.auth (canonical)
`{ userId, orgId, sessionId, roles[], permissions[], jti, issuer, audience }`

## Revocation
Consumer-side JTI blacklist is **not yet wired** (no shared Redis client in this
service); revocation is enforced at the issuer (auth-service). Tracked as a follow-up.

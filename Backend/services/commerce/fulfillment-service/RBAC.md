# fulfillment-service — RBAC (Phase 3)

Migrated to canonical auth via `@baalvion/auth-node` `createAuthMiddleware` +
hierarchical `requireRole`/`requirePermission`.

## Active authorization
Routes authenticate via `authMiddleware` and scope by `req.auth.userId` /
`req.auth.orgId`. No route currently uses `requireRole` (the previous local
exact-match `requireRole` was defined but unused).

## Canonical role hierarchy (for any future gate)
`viewer < member < editor < manager < admin < owner < super_admin` — hierarchical;
`super_admin` passes every check.

## Legacy → canonical role mapping (reference)
| legacy | canonical |
|--------|-----------|
| (none used in this service) | — |

## req.auth (canonical)
`{ userId, orgId, sessionId, roles[], permissions[], jti, issuer, audience }`

## Revocation
Consumer-side JTI blacklist not yet wired; enforced at the issuer. Follow-up.

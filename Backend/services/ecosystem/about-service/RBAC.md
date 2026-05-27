# about-service — RBAC (Phase 3 Batch A)

Canonical auth via `@baalvion/auth-node` `createAuthMiddleware`. `req.auth` canonical;
back-compat `req.user = {id, orgId, roles}` (no scalar role) for `req.user.id` readers.

## Active authorization
Authenticated write routes (news/pages) scope by `req.user.id`. No `requireRole` in use.

## Canonical hierarchy
`viewer < member < editor < manager < admin < owner < super_admin` (hierarchical).
`requireRole`/`requirePermission` available for future content-admin gating.

## Legacy → canonical role mapping
| legacy | canonical |
|--------|-----------|
| (none used) | — |

## Revocation
Consumer-side JTI blacklist not yet wired (enforced at issuer). Follow-up.

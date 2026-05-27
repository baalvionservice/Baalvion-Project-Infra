# market-service — RBAC (Phase 3 Batch A)

Canonical auth via `@baalvion/auth-node` `createAuthMiddleware`. `req.auth` is canonical
(`userId/orgId/sessionId/roles[]/permissions[]/jti`); a back-compat `req.user = {id, orgId,
roles}` is also set (no scalar role) for controllers that read `req.user.id`.

## Active authorization
Routes authenticate via `authMiddleware` and scope by `req.user.id` / `req.auth.orgId`.
No route uses `requireRole` (none was defined here).

## Canonical hierarchy (for any future gate)
`viewer < member < editor < manager < admin < owner < super_admin` (hierarchical;
`super_admin` passes all). Available via `requireRole`/`requirePermission`.

## Legacy → canonical role mapping
| legacy | canonical |
|--------|-----------|
| (none used) | default token role applies (e.g. member/owner from auth-service) |

## Revocation
Consumer-side JTI blacklist not yet wired (enforced at issuer). Follow-up.

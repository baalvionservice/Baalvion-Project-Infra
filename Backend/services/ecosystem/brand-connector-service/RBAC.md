# brand-connector-service — RBAC (Phase 3 Batch A)

Canonical auth via `@baalvion/auth-node` `createAuthMiddleware`. `req.auth` canonical;
back-compat `req.user = {id, orgId, roles}` (no scalar role) — controllers read
`req.user.id` / `req.user.orgId` extensively (org scoping).

## Role-logic repair (Step 3)
Admin gates converted from scalar `req.user.role === 'admin'` to canonical roles[]:

| before | after |
|--------|-------|
| `req.user.role !== 'admin'` (adminController, disputeController) | `!(req.auth.roles).some(r => ['admin','owner','super_admin'].includes(r))` |

Hierarchical: `admin`, `owner`, `super_admin` all pass the admin gate.

## App roles (carried verbatim in roles[])
`admin`, `brand`, `creator` — app roles used for domain authorization; preserved in the
canonical `roles[]` (the issuer/import must include them). Hierarchy mapping (reference):
`admin→admin`, `brand→member`, `creator→member`.

## Revocation
Consumer-side JTI blacklist not yet wired (enforced at issuer). Follow-up.

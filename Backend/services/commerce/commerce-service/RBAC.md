# commerce-service — RBAC (Phase 3)

Migrated to canonical auth via `@baalvion/auth-node` `createAuthMiddleware` +
hierarchical `requireRole`/`requirePermission`.

## Two layers
1. **Platform roles** (canonical token `roles[]`): `viewer < member < editor <
   manager < admin < owner < super_admin`. `super_admin` passes all checks.
2. **Store roles** (`middleware/commerceAccess.js`, DB `CommerceStoreMember`):
   store_admin(100) > commerce_manager(80) > inventory_manager(60) >
   fulfillment_manager(50) ≈ seo_manager(50) > content_editor(40) >
   support_agent(30) > reviewer(20). These are store-membership levels, distinct
   from platform roles.

## Role-logic repair (Task E)
`commerceAccess.js` PLATFORM_BYPASS check now reads canonical `req.auth.roles[]`
(was scalar `req.auth.role`):

| before | after |
|--------|-------|
| `PLATFORM_BYPASS.includes(req.auth.role)` | `callerRoles.some(r => PLATFORM_BYPASS.includes(r))` where `callerRoles = req.auth.roles ?? [req.auth.role]` |

PLATFORM_BYPASS = `['super_admin','owner','admin']` (canonical platform roles) →
grants `store_admin` level 100.

## req.auth (canonical)
`{ userId, orgId, sessionId, roles[], permissions[], jti, issuer, audience }`

## Revocation
Consumer-side JTI blacklist not yet wired; enforced at the issuer. Follow-up.

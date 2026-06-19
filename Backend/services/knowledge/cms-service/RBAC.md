# cms-service — RBAC (Phase 3 Batch A)

Canonical auth via `@baalvion/auth-node`. `req.auth` canonical; back-compat
`req.user = {id, orgId, roles}` (no scalar role) for `req.user.id`/`orgId` readers.

## Two layers
1. **Platform roles** (canonical token `roles[]`): `viewer < member < editor < manager <
   admin < owner < super_admin`. `super_admin` passes all.
2. **CMS website roles** (`middleware/cmsAccess.js`, DB `cms.website_members.role`):
   cms_admin(100) > cms_editor(80) > cms_publisher(70) > cms_reviewer(60) >
   cms_seo_manager(50) > cms_author(40) > cms_contributor(20) > cms_viewer(10).
   Distinct from platform roles (website-membership levels).

## Role-logic repair (Step 3)
`cmsAccess.js` platform-bypass check now reads canonical `roles[]`:

| before | after |
|--------|-------|
| `PLATFORM_BYPASS_ROLES.includes(req.auth.role)` | `callerRoles.some(r => PLATFORM_BYPASS_ROLES.includes(r))` where `callerRoles = req.auth.roles ?? [req.auth.role]` |

`PLATFORM_BYPASS_ROLES = ['super_admin','owner','admin']` → grants `cms_admin` (level 100).
The local exact-match `requireRole` was replaced with auth-node's hierarchical guard.

## Website org-scope bypass for platform admins
`controller/websiteController.js` builds a `callerScope = { orgId, isPlatformAdmin }`
(`isPlatformAdmin` reuses `PLATFORM_BYPASS_ROLES`). `service/websiteService.js#orgFilter`
drops the `organizationId` filter when `isPlatformAdmin` is true, so a platform principal
lists/reads/manages **every** website across orgs — consistent with `loadCmsRole` already
granting them `cms_admin` on any site. Non-platform callers stay strictly org-scoped.
This fixes the "websites list is empty" glitch that occurred when a platform owner's token
carried a non-platform org (personal workspace / test org) while all sites live under the
`Baalvion Platform` org.

## Revocation
Consumer-side JTI blacklist not yet wired (enforced at issuer). Follow-up.

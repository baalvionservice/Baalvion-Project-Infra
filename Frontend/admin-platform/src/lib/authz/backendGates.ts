/**
 * What the SERVER actually enforces for each console section, as read from the route files
 * on 2026-09-05. This is documentation, not a gate — but it is the reference the policy in
 * policy.ts must eventually match, and it records a gap worth fixing deliberately.
 *
 * RESOLVED 2026-09-05. admin-service previously applied a blanket
 * `router.use(requireSuperAdmin)` across every one of its route modules, so the console's
 * `admin` and `owner` tiers had no real power anywhere it backed — every call 403'd, which
 * is why roles felt like they "didn't work". All nine modules now use `requireRole('admin')`,
 * which is hierarchical and therefore admits admin, owner and super_admin.
 *
 * Three operations were deliberately held back at super_admin in adminRoutes.js because they
 * are irreversible or allow acting as another person:
 *   DELETE /users/:userId, DELETE /orgs/:orgId, POST /users/:userId/impersonate
 */

export type BackendGate =
  | 'admin' // router.use(requireRole('admin')) — hierarchical: admin, owner, super_admin
  | 'super_admin' // router.use(requireSuperAdmin) — nothing below super_admin passes
  | 'tenant_admin' // rbac-service requireTenantAdmin — scoped, graduated
  | 'audit_reader' // audit-service requireAuditReader
  | 'cms_membership' // cms-service requireCmsRole — per-website, graduated
  | 'authenticated' // authMiddleware only
  | 'unverified'; // not yet traced

export interface SectionGate {
  gate: BackendGate;
  service: string;
  /** Where the gate is declared, for re-verification. */
  source: string;
}

/**
 * The gate each section's backing service enforces. Keep in step with policy.ts: a section
 * offered below the tier named here is a section whose every request will 403.
 */
export const SECTION_GATES: Record<string, SectionGate> = {
  '/users': { gate: 'admin', service: 'admin-service', source: 'routes/adminRoutes.js:7' },
  '/organizations': { gate: 'admin', service: 'admin-service', source: 'routes/adminRoutes.js:7' },
  '/sessions': { gate: 'admin', service: 'admin-service', source: 'routes/adminRoutes.js:7' },
  '/audit-logs': { gate: 'admin', service: 'admin-service', source: 'routes/adminRoutes.js:7' },
  '/payments': { gate: 'admin', service: 'admin-service', source: 'routes/adminRoutes.js:39' },
  '/billing': { gate: 'admin', service: 'admin-service', source: 'routes/paymentsRoutes.js' },
  '/revenue': { gate: 'admin', service: 'admin-service', source: 'routes/paymentsRoutes.js' },
  '/staff': { gate: 'admin', service: 'admin-service', source: 'routes/staffRoutes.js:15' },
  '/support': { gate: 'admin', service: 'admin-service', source: 'routes/supportRoutes.js:15' },
  '/developers': { gate: 'admin', service: 'admin-service', source: 'routes/developerRoutes.js:10' },
  '/feature-flags': { gate: 'admin', service: 'admin-service', source: 'routes/featureFlagsRoutes.js:11' },
  '/ai': { gate: 'admin', service: 'admin-service', source: 'routes/aiRoutes.js:13' },
  '/identity': { gate: 'admin', service: 'admin-service', source: 'routes/identityRoutes.js' },
  '/platform-management': { gate: 'admin', service: 'admin-service', source: 'routes/platformRoutes.js' },

  // These two are shown to every signed-in user but draw from admin-service, so anyone below
  // the admin tier still sees empty widgets rather than a usable page. /dashboard is the
  // post-login landing page, which makes it the most visible remaining gap — it wants
  // per-widget access awareness, not a page-level gate.
  '/analytics': { gate: 'admin', service: 'admin-service', source: 'routes/analyticsRoutes.js:23' },
  '/dashboard': { gate: 'admin', service: 'admin-service', source: 'lib/api/identity-admin.ts → adminApiClient' },

  // Graduated gates that already work properly — the model the rest should follow.
  '/rbac': { gate: 'tenant_admin', service: 'rbac-service', source: 'middleware/guards.js requireTenantAdmin' },
  '/audit-center': { gate: 'audit_reader', service: 'audit-service', source: 'middleware/guards.js requireAuditReader' },
  '/cms': { gate: 'cms_membership', service: 'cms-service', source: 'middleware/cmsAccess.js requireCmsRole' },
  '/media': { gate: 'cms_membership', service: 'cms-service', source: 'routes/mediaRoutes.js' },
};

/**
 * Sections still shown to users below the tier their service will serve. /dashboard and
 * /analytics remain here on purpose: locking the landing page behind admin would be worse
 * than showing a signed-in editor a thinner version of it.
 */
export const OVERPROMISED_SECTIONS = ['/dashboard', '/analytics'];

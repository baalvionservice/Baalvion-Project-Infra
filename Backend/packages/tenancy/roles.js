'use strict';
/**
 * Canonical platform-vs-tenant role model (C4 remediation).
 *
 * ROOT CAUSE this fixes: organization-scoped roles (`admin`, `owner`) and the legacy
 * top-of-hierarchy `super_admin` were treated as tenant-RLS-bypass roles, so a per-org
 * administrator could read across tenants. Tenant isolation MUST never be bypassable by a
 * tenant-scoped principal.
 *
 * Two strictly separate dimensions:
 *   - TENANT roles (per-organization authorization): viewer..owner. NEVER bypass RLS.
 *   - PLATFORM roles (global operators): platform_*. Only these may bypass tenant isolation,
 *     and only the two below — platform_support_admin is a platform role but deliberately
 *     does NOT get blanket data bypass (least privilege).
 *
 * There is no dual-purpose role name: a name is either a tenant role or a platform role.
 */

// Global platform-operator roles. These are NOT organization-membership roles.
const PLATFORM_ROLES = Object.freeze([
    'platform_admin',
    'platform_security_admin',
    'platform_support_admin',
]);

// The ONLY roles permitted to bypass tenant (RLS) isolation. Narrowed from the old
// ['super_admin','admin','owner']. super_admin is intentionally excluded — platform operators
// must hold an explicit platform_* role (see migration granting platform_admin to super_admins).
const PLATFORM_BYPASS_ROLES = Object.freeze([
    'platform_admin',
    'platform_security_admin',
]);

// Tenant-scoped (organization) roles. Authoritative list used to reject role confusion at
// token issuance — none of these may ever appear as a platform role.
const TENANT_ROLES = Object.freeze([
    'owner', 'admin', 'manager', 'buyer', 'supplier',
    'finance', 'compliance', 'auditor', 'viewer',
    // legacy hierarchy roles still issued by auth-service memberships:
    'super_admin', 'editor', 'member',
]);

const isPlatformRole = (role) => PLATFORM_ROLES.includes(role);

/** True if any of the caller's roles is a platform role permitted to bypass tenant isolation. */
function hasTenantBypass(roles) {
    if (!Array.isArray(roles)) roles = roles != null ? [roles] : [];
    return roles.some((r) => PLATFORM_BYPASS_ROLES.includes(r));
}

module.exports = { PLATFORM_ROLES, PLATFORM_BYPASS_ROLES, TENANT_ROLES, isPlatformRole, hasTenantBypass };

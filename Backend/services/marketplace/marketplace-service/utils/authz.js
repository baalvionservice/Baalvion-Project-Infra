'use strict';
// In-service authorization helpers (the PEP). Cross-cutting authz is also enforceable via
// rbac-service's PDP; these guards are the lightweight, in-process checks the controllers and
// services share so the role lists live in exactly one place.
const { AppError } = require('./errors');

// Staff may review/administer onboarding across the platform surface they own.
const STAFF_ROLES = ['super_admin', 'owner', 'admin', 'compliance', 'platform_admin'];
// Platform roles see and act across every org (RLS bypass equivalents).
const PLATFORM_ROLES = ['super_admin', 'owner', 'platform_admin'];

const hasAnyRole = (user, roles) => Array.isArray(user?.roles) && user.roles.some((r) => roles.includes(r));

const isStaff = (user) => hasAnyRole(user, STAFF_ROLES);
const isPlatform = (user) => hasAnyRole(user, PLATFORM_ROLES);

/**
 * Allow the call only if the caller owns the resource's org or is platform/compliance staff.
 * @param {string} ownerOrgId - the resource's `org_id`
 * @param {{ orgId?: string, roles?: string[] }} user - `req.user`
 */
function assertOwnerOrStaff(ownerOrgId, user) {
    if (isStaff(user)) return;
    if (user?.orgId && ownerOrgId && user.orgId === ownerOrgId) return;
    throw new AppError('FORBIDDEN', 'You do not have permission to modify this resource', 403);
}

module.exports = { STAFF_ROLES, PLATFORM_ROLES, hasAnyRole, isStaff, isPlatform, assertOwnerOrStaff };

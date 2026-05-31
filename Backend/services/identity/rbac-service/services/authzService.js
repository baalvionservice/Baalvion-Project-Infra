'use strict';
const db = require('../models');
const { SCOPE, LEVEL, ROLE_KEY } = require('../config/systemRoles');
const tenantService = require('./tenantService');

/**
 * Resolves the CALLER's effective administrative reach for guarding rbac-service's
 * own management APIs. It bridges two sources of truth WITHOUT conflating them:
 *   1. the canonical token roles[] (platform hierarchy: super_admin etc.), and
 *   2. the rbac-service DB role_assignments (the scoped super/country/org admins).
 *
 * A caller is super_admin if EITHER source says so. Country/org reach comes from
 * the DB assignments, mapped to the tenant subtree each one administers.
 */

/** Map an admin assignment to the tenant whose subtree it governs. */
async function administeredTenantId(assignment) {
    if (assignment.scope_type === SCOPE.PLATFORM) {
        const platform = await tenantService.getPlatformTenant();
        return platform ? platform.id : null;
    }
    const t = await db.Tenant.findOne({ where: { type: assignment.scope_type, external_ref: assignment.scope_id } });
    return t ? t.id : null;
}

async function resolve(req) {
    const auth = req.auth || {};
    const tokenRoles = Array.isArray(auth.roles) ? auth.roles : [];
    const tokenSuperAdmin = tokenRoles.includes(ROLE_KEY.SUPER_ADMIN) || req.internal === true;

    const assignments = await db.RoleAssignment.findAll({
        where: { user_id: String(auth.userId), status: 'active' },
        include: [{ model: db.Role }],
    });
    const active = assignments.filter((a) => !a.expires_at || new Date(a.expires_at).getTime() > Date.now());

    let dbSuperAdmin = false;
    const adminReach = []; // { level, tenantId } for assignments of admin grade
    for (const a of active) {
        const role = a.role;
        if (!role) continue;
        if (role.key === ROLE_KEY.SUPER_ADMIN || (role.scope_type === SCOPE.PLATFORM && role.level >= LEVEL.SUPER_ADMIN)) {
            dbSuperAdmin = true;
        }
        if (role.level >= LEVEL.ORGANIZATION_ADMIN) {
            const tid = await administeredTenantId(a);
            if (tid) adminReach.push({ level: role.level, tenantId: tid, scopeType: a.scope_type, scopeId: a.scope_id });
        }
    }

    return {
        userId: String(auth.userId || ''),
        isSuperAdmin: tokenSuperAdmin || dbSuperAdmin,
        adminReach,
    };
}

async function isSuperAdmin(req) {
    return (await resolve(req)).isSuperAdmin;
}

/** Can the caller administer the given tenant (itself or an ancestor in reach)? */
async function canManageTenant(req, tenantId) {
    const ctx = await resolve(req);
    if (ctx.isSuperAdmin) return true;
    if (!tenantId) return false;
    for (const reach of ctx.adminReach) {
        if (await tenantService.isWithin(tenantId, reach.tenantId)) return true;
    }
    return false;
}

/** Can the caller grant/manage roles at a given (scopeType, scopeId)? */
async function canManageScope(req, scopeType, scopeId) {
    const ctx = await resolve(req);
    if (ctx.isSuperAdmin) return true;
    let targetTenantId = null;
    if (scopeType === SCOPE.PLATFORM) return ctx.isSuperAdmin; // platform scope = super only
    const t = await db.Tenant.findOne({ where: { type: scopeType, external_ref: String(scopeId) } });
    targetTenantId = t ? t.id : null;
    if (!targetTenantId) return false;
    for (const reach of ctx.adminReach) {
        if (await tenantService.isWithin(targetTenantId, reach.tenantId)) return true;
    }
    return false;
}

module.exports = { resolve, isSuperAdmin, canManageTenant, canManageScope, administeredTenantId };

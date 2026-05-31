'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { Errors } = require('../utils/errors');
const { SCOPE, SCOPES } = require('../config/systemRoles');
const roleService = require('./roleService');
const permissionService = require('./permissionService');

function serialize(a, role) {
    if (!a) return null;
    return {
        id: a.id, userId: a.user_id, roleId: a.role_id, tenantId: a.tenant_id,
        scopeType: a.scope_type, scopeId: a.scope_id, grantedBy: a.granted_by,
        status: a.status, expiresAt: a.expires_at, attributes: a.attributes || {},
        createdAt: a.created_at, updatedAt: a.updated_at,
        role: role ? { id: role.id, key: role.key, name: role.name, level: role.level, scopeType: role.scope_type } : undefined,
    };
}

const isExpired = (a) => a.expires_at && new Date(a.expires_at).getTime() <= Date.now();

/** Default scopeId for an assignment given the role's scope. */
async function resolveScope(role, scopeIdInput) {
    const scopeType = role.scope_type;
    if (scopeType === SCOPE.PLATFORM) return { scopeType, scopeId: '*' };
    if (scopeIdInput) return { scopeType, scopeId: String(scopeIdInput) };
    // Fall back to the owning tenant's external_ref (country code / org id).
    const tenant = await db.Tenant.findByPk(role.tenant_id);
    if (tenant && tenant.external_ref) return { scopeType, scopeId: tenant.external_ref };
    throw Errors.badRequest(`scopeId is required for a ${scopeType}-scoped role`);
}

async function assignRole({ userId, roleId, scopeId, expiresAt, attributes }, actorId) {
    if (!userId) throw Errors.badRequest('userId is required');
    if (!roleId) throw Errors.badRequest('roleId is required');
    const role = await roleService.getRole(roleId);
    if (!role.is_assignable) throw Errors.forbidden('This role is not assignable');
    if (role.status !== 'active') throw Errors.badRequest('Cannot assign an inactive role');

    const { scopeType, scopeId: resolvedScope } = await resolveScope(role, scopeId);

    const [a, created] = await db.RoleAssignment.findOrCreate({
        where: { user_id: String(userId), role_id: roleId, scope_id: resolvedScope },
        defaults: {
            tenant_id: role.tenant_id, scope_type: scopeType, granted_by: actorId || null,
            status: 'active', expires_at: expiresAt || null, attributes: attributes || {},
        },
    });
    if (!created) {
        // Re-activate / refresh an existing (possibly revoked) grant.
        a.status = 'active';
        a.expires_at = expiresAt || null;
        if (attributes) a.attributes = attributes;
        a.granted_by = actorId || a.granted_by;
        await a.save();
    }
    return serialize(a, role);
}

async function revokeAssignment(id) {
    const a = await db.RoleAssignment.findByPk(id);
    if (!a) throw Errors.notFound('Assignment not found');
    a.status = 'revoked';
    await a.save();
    return { id, revoked: true };
}

async function listAssignments({ userId, roleId, tenantId, scopeId, status } = {}) {
    const where = {};
    if (userId) where.user_id = String(userId);
    if (roleId) where.role_id = roleId;
    if (tenantId) where.tenant_id = tenantId;
    if (scopeId) where.scope_id = scopeId;
    if (status) where.status = status;
    const rows = await db.RoleAssignment.findAll({ where, include: [{ model: db.Role }], order: [['created_at', 'DESC']] });
    return rows.map((a) => serialize(a, a.role));
}

/** A user's currently-active (non-expired) role assignments, with role detail. */
async function getActiveAssignments(userId, { scopeId } = {}) {
    const where = { user_id: String(userId), status: 'active' };
    const rows = await db.RoleAssignment.findAll({ where, include: [{ model: db.Role }] });
    return rows
        .filter((a) => !isExpired(a))
        .filter((a) => (scopeId ? (a.scope_id === scopeId || a.scope_id === '*') : true));
}

async function getUserRoles(userId, opts = {}) {
    const rows = await getActiveAssignments(userId, opts);
    return rows.map((a) => serialize(a, a.role));
}

/**
 * Effective access for a user: their highest role level overall and per-scope,
 * the set of role keys, and the union of effective (inherited) RBAC permissions.
 * This is the RBAC half of the PDP decision.
 */
async function getUserEffective(userId, opts = {}) {
    const rows = await getActiveAssignments(userId, opts);
    const roleKeys = new Set();
    let maxLevel = 0;
    const perScope = {}; // scopeId → { level, roles[] }
    const permissions = new Map(); // key → { effect, constraints, source }

    for (const a of rows) {
        const role = a.role;
        if (!role) continue;
        roleKeys.add(role.key);
        maxLevel = Math.max(maxLevel, role.level);
        const bucket = perScope[a.scope_id] || (perScope[a.scope_id] = { scopeType: a.scope_type, level: 0, roles: [] });
        bucket.level = Math.max(bucket.level, role.level);
        bucket.roles.push(role.key);

        const eff = await permissionService.getEffectivePermissions(role.id);
        for (const [key, val] of eff.entries()) {
            const existing = permissions.get(key);
            if (existing && existing.effect === 'deny') continue;
            if (!existing || val.effect === 'deny') permissions.set(key, { ...val, viaRole: role.key, scopeId: a.scope_id });
        }
    }

    return {
        userId: String(userId),
        roles: [...roleKeys],
        maxLevel,
        perScope,
        permissions: [...permissions.entries()].map(([key, v]) => ({
            key, effect: v.effect, constraints: v.constraints, viaRole: v.viaRole, scopeId: v.scopeId,
        })),
    };
}

module.exports = {
    serialize, assignRole, revokeAssignment, listAssignments,
    getActiveAssignments, getUserRoles, getUserEffective, isExpired, SCOPES,
};

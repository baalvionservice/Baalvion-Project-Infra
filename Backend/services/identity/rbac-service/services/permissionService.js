'use strict';
const db = require('../models');
const { Errors } = require('../utils/errors');
const roleService = require('./roleService');
const hierarchyService = require('./hierarchyService');

const normPart = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9_.*-]+/g, '');

function serialize(p) {
    if (!p) return null;
    return {
        id: p.id, key: p.key, resource: p.resource, action: p.action,
        description: p.description, module: p.module, isSystem: p.is_system,
        attributes: p.attributes || {}, createdAt: p.created_at, updatedAt: p.updated_at,
    };
}

async function getPermission(id) {
    const p = await db.Permission.findByPk(id);
    if (!p) throw Errors.notFound('Permission not found');
    return p;
}

async function listPermissions({ module, resource } = {}) {
    const where = {};
    if (module) where.module = module;
    if (resource) where.resource = normPart(resource);
    const rows = await db.Permission.findAll({ where, order: [['resource', 'ASC'], ['action', 'ASC']] });
    return rows.map(serialize);
}

async function createPermission(input) {
    const resource = normPart(input.resource);
    const action = normPart(input.action);
    if (!resource || !action) throw Errors.badRequest('resource and action are required');
    const key = input.key ? normPart(input.key) : `${resource}:${action}`;
    try {
        const p = await db.Permission.create({
            key, resource, action,
            description: input.description || null,
            module: input.module ? normPart(input.module) : null,
            is_system: Boolean(input.isSystem),
            attributes: input.attributes || {},
        });
        return serialize(p);
    } catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') throw Errors.conflict(`Permission '${key}' already exists`);
        throw e;
    }
}

async function deletePermission(id) {
    const p = await getPermission(id);
    if (p.is_system) throw Errors.forbidden('System permissions cannot be deleted');
    await p.destroy();
    return { id, deleted: true };
}

// ─── Role ⇄ Permission mapping ────────────────────────────────────────────────

async function attachToRole(roleId, permissionId, { effect = 'allow', constraints = {}, actorId } = {}) {
    await roleService.getRole(roleId);
    await getPermission(permissionId);
    if (!['allow', 'deny'].includes(effect)) throw Errors.badRequest("effect must be 'allow' or 'deny'");
    const [rp, created] = await db.RolePermission.findOrCreate({
        where: { role_id: roleId, permission_id: permissionId },
        defaults: { effect, constraints, created_by: actorId || null },
    });
    if (!created) { rp.effect = effect; rp.constraints = constraints; await rp.save(); }
    return { roleId, permissionId, effect: rp.effect, constraints: rp.constraints, created };
}

async function detachFromRole(roleId, permissionId) {
    const n = await db.RolePermission.destroy({ where: { role_id: roleId, permission_id: permissionId } });
    if (!n) throw Errors.notFound('That permission is not attached to the role');
    return { roleId, permissionId, detached: true };
}

/** Direct (non-inherited) permission grants on a role. */
async function listRolePermissions(roleId) {
    await roleService.getRole(roleId);
    const rows = await db.RolePermission.findAll({ where: { role_id: roleId }, include: [{ model: db.Permission }] });
    return rows.map((rp) => ({
        permission: serialize(rp.permission),
        effect: rp.effect, constraints: rp.constraints || {},
    }));
}

/**
 * Effective permissions for a role = own grants PLUS everything inherited from
 * parent roles (closest role wins on conflict; an explicit deny anywhere wins).
 * Returns a map keyed by permission key → { effect, constraints, source, permission }.
 */
async function getEffectivePermissions(roleId) {
    const chain = await hierarchyService.getInheritanceChain(roleId); // [self, parent, ...]
    const effective = new Map();
    for (let depth = 0; depth < chain.length; depth++) {
        const role = chain[depth];
        const rows = await db.RolePermission.findAll({ where: { role_id: role.id }, include: [{ model: db.Permission }] });
        for (const rp of rows) {
            if (!rp.permission) continue;
            const key = rp.permission.key;
            const existing = effective.get(key);
            // deny-overrides: a deny anywhere in the chain sticks.
            if (existing && existing.effect === 'deny') continue;
            if (!existing || rp.effect === 'deny') {
                effective.set(key, {
                    effect: rp.effect,
                    constraints: rp.constraints || {},
                    source: { roleId: role.id, roleKey: role.key, inherited: depth > 0 },
                    permission: serialize(rp.permission),
                });
            }
        }
    }
    return effective;
}

module.exports = {
    serialize, getPermission, listPermissions, createPermission, deletePermission,
    attachToRole, detachFromRole, listRolePermissions, getEffectivePermissions, normPart,
};

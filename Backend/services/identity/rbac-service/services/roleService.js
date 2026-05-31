'use strict';
const db = require('../models');
const { Errors } = require('../utils/errors');
const { SCOPES } = require('../config/systemRoles');
const tenantService = require('./tenantService');

const keyify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64);

function serialize(r) {
    if (!r) return null;
    return {
        id: r.id, tenantId: r.tenant_id, key: r.key, name: r.name, description: r.description,
        scopeType: r.scope_type, level: r.level, parentRoleId: r.parent_role_id,
        isSystem: r.is_system, isAssignable: r.is_assignable, status: r.status,
        attributes: r.attributes || {}, metadata: r.metadata || {},
        createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

async function getRole(id) {
    const r = await db.Role.findByPk(id);
    if (!r) throw Errors.notFound('Role not found');
    return r;
}

async function listRoles({ tenantId, scopeType, key, includeSystem = true } = {}) {
    const where = {};
    if (tenantId) where.tenant_id = tenantId;
    if (scopeType) where.scope_type = scopeType;
    if (key) where.key = keyify(key);
    if (!includeSystem) where.is_system = false;
    const rows = await db.Role.findAll({ where, order: [['level', 'DESC'], ['name', 'ASC']] });
    return rows.map(serialize);
}

async function createRole(input, actorId) {
    const { tenantId, name, description, scopeType = 'organization', level = 100, parentRoleId, attributes, isAssignable = true } = input;
    if (!tenantId) throw Errors.badRequest('tenantId is required');
    if (!name) throw Errors.badRequest('name is required');
    if (!SCOPES.includes(scopeType)) throw Errors.badRequest(`scopeType must be one of ${SCOPES.join(', ')}`);
    if (!Number.isInteger(level) || level < 0 || level > 1000) throw Errors.badRequest('level must be an integer 0..1000');

    await tenantService.getTenant(tenantId); // 404 if missing
    const key = keyify(input.key || name);
    if (!key) throw Errors.badRequest('key resolves to empty — provide a valid key/name');

    if (parentRoleId) {
        const parent = await getRole(parentRoleId);
        if (parent.tenant_id !== tenantId) throw Errors.badRequest('parentRoleId must belong to the same tenant');
    }

    try {
        const r = await db.Role.create({
            tenant_id: tenantId, key, name, description: description || null,
            scope_type: scopeType, level, parent_role_id: parentRoleId || null,
            is_system: false, is_assignable: isAssignable,
            attributes: attributes || {}, created_by: actorId || null,
        });
        return serialize(r);
    } catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') throw Errors.conflict(`Role '${key}' already exists in this tenant`);
        throw e;
    }
}

async function updateRole(id, patch, actorId) {
    const r = await getRole(id);
    const allowed = ['name', 'description', 'level', 'isAssignable', 'attributes', 'status'];
    // System roles: protect identity (key/level/scope) but allow description/attributes tweaks.
    if (r.is_system) {
        for (const f of ['level', 'status']) if (patch[f] !== undefined) throw Errors.forbidden(`Cannot modify '${f}' on a system role`);
    }
    if (patch.level !== undefined && (!Number.isInteger(patch.level) || patch.level < 0 || patch.level > 1000)) {
        throw Errors.badRequest('level must be an integer 0..1000');
    }
    const map = { name: 'name', description: 'description', level: 'level', isAssignable: 'is_assignable', attributes: 'attributes', status: 'status' };
    for (const f of allowed) if (patch[f] !== undefined) r[map[f]] = patch[f];
    r.metadata = { ...(r.metadata || {}), updatedBy: actorId || null };
    await r.save();
    return serialize(r);
}

async function deleteRole(id) {
    const r = await getRole(id);
    if (r.is_system) throw Errors.forbidden('System roles cannot be deleted');
    const assignments = await db.RoleAssignment.count({ where: { role_id: id, status: 'active' } });
    if (assignments > 0) throw Errors.conflict(`Role has ${assignments} active assignment(s); revoke them first`);
    await r.destroy();
    return { id, deleted: true };
}

/** Maintain hierarchy: set/clear a role's parent, with same-tenant + cycle guards. */
async function setParent(id, parentRoleId) {
    const r = await getRole(id);
    if (!parentRoleId) { r.parent_role_id = null; await r.save(); return serialize(r); }

    const parent = await getRole(parentRoleId);
    if (parent.tenant_id !== r.tenant_id) throw Errors.badRequest('Parent role must belong to the same tenant');
    if (parentRoleId === id) throw Errors.badRequest('A role cannot be its own parent');

    // Cycle check: walk the prospective parent chain; it must not reach `id`.
    let cursor = parent;
    const seen = new Set([id]);
    while (cursor) {
        if (seen.has(cursor.id)) throw Errors.badRequest('Setting this parent would create a cycle');
        seen.add(cursor.id);
        cursor = cursor.parent_role_id ? await db.Role.findByPk(cursor.parent_role_id) : null;
    }
    r.parent_role_id = parentRoleId;
    await r.save();
    return serialize(r);
}

module.exports = { serialize, getRole, listRoles, createRole, updateRole, deleteRole, setParent, keyify };

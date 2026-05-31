'use strict';
const db = require('../models');
const roleService = require('./roleService');

/**
 * Build the role hierarchy for a tenant as a forest keyed by parent_role_id.
 * Returns roots (roles with no parent) each with nested `children`, plus a flat
 * list ordered by level desc for convenience.
 */
async function getHierarchy(tenantId) {
    const rows = await db.Role.findAll({ where: { tenant_id: tenantId }, order: [['level', 'DESC']] });
    const roles = rows.map(roleService.serialize);
    const byId = new Map(roles.map((r) => [r.id, { ...r, children: [] }]));
    const roots = [];
    for (const node of byId.values()) {
        if (node.parentRoleId && byId.has(node.parentRoleId)) {
            byId.get(node.parentRoleId).children.push(node);
        } else {
            roots.push(node);
        }
    }
    return { tenantId, roles, tree: roots };
}

/**
 * Inheritance chain for a role: [self, parent, grandparent, ...] as role records.
 * Used to gather inherited permissions. Cycle-guarded.
 */
async function getInheritanceChain(roleId) {
    const chain = [];
    const seen = new Set();
    let cursor = await db.Role.findByPk(roleId);
    while (cursor && !seen.has(cursor.id)) {
        seen.add(cursor.id);
        chain.push(cursor);
        cursor = cursor.parent_role_id ? await db.Role.findByPk(cursor.parent_role_id) : null;
    }
    return chain;
}

module.exports = { getHierarchy, getInheritanceChain };

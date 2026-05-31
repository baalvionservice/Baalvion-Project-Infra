'use strict';
/**
 * Idempotent seed: the platform tenant, the four canonical SYSTEM roles wired into
 * the hierarchy, a base permission catalogue mapped onto those roles, and a couple
 * of example ABAC policies (a global deny + a limit-with-obligation allow).
 *
 *   node scripts/seed.js
 */
const db = require('../models');
const config = require('../config/appConfig');
const { SCOPE, SYSTEM_ROLES } = require('../config/systemRoles');
const logger = require('../utils/logger');

const PERMISSIONS = [
    { resource: '*', action: '*', module: 'platform', description: 'Full platform access (super admin)' },
    { resource: 'tenant', action: 'read' }, { resource: 'tenant', action: 'create' },
    { resource: 'role', action: 'read' }, { resource: 'role', action: 'create' },
    { resource: 'role', action: 'update' }, { resource: 'role', action: 'delete' }, { resource: 'role', action: 'assign' },
    { resource: 'permission', action: 'read' }, { resource: 'permission', action: 'manage' },
    { resource: 'policy', action: 'read' }, { resource: 'policy', action: 'manage' },
    { resource: 'user', action: 'read' }, { resource: 'user', action: 'invite' },
    { resource: 'user', action: 'update' }, { resource: 'user', action: 'suspend' },
    { resource: 'organization', action: 'read' }, { resource: 'organization', action: 'manage' },
    { resource: 'cms.content', action: 'read' }, { resource: 'cms.content', action: 'create' },
    { resource: 'cms.content', action: 'update' }, { resource: 'cms.content', action: 'publish' },
    { resource: 'cms.content', action: 'delete' },
    { resource: 'self', action: 'read' },
];

const ROLE_GRANTS = {
    super_admin: ['*:*'],
    country_admin: [
        'organization:read', 'organization:manage', 'user:read', 'user:invite', 'user:update',
        'user:suspend', 'role:read', 'role:assign', 'tenant:read', 'tenant:create',
    ],
    organization_admin: [
        'user:read', 'user:invite', 'role:read', 'role:assign',
        'cms.content:read', 'cms.content:create', 'cms.content:update', 'cms.content:publish', 'cms.content:delete',
    ],
    end_user: ['self:read', 'cms.content:read'],
};

const POLICIES = [
    {
        key: 'global-deny-suspended', name: 'Deny suspended subjects', effect: 'deny', priority: 1000,
        description: 'Hard deny for any subject whose status attribute is "suspended" (deny-overrides everything).',
        target: {}, condition: { '==': [{ var: 'subject.status' }, 'suspended'] }, obligations: {},
    },
    {
        key: 'export-business-hours-limit', name: 'Throttle exports outside business hours', effect: 'allow', priority: 200,
        description: 'Allows export actions but attaches a row-limit obligation; PEPs enforce the limit.',
        target: { actions: ['export'] },
        condition: { and: [{ '>=': [{ var: 'env.hour' }, 6] }, { '<': [{ var: 'env.hour' }, 22] }] },
        obligations: { limit: { maxRows: 5000 } },
    },
];

async function seed() {
    await db.sequelize.authenticate();
    await db.sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${config.db.schema}`);
    await db.sequelize.sync({ alter: false });

    // 1 — Platform tenant (the root).
    const [platform] = await db.Tenant.findOrCreate({
        where: { type: SCOPE.PLATFORM },
        defaults: { name: 'Baalvion Platform', slug: 'baalvion-platform', external_ref: null, attributes: {} },
    });
    logger.info(`[seed] platform tenant ${platform.id}`);

    // 2 — System roles (base → top so parent_role_id can be wired up).
    const byKey = {};
    const ordered = [...SYSTEM_ROLES].sort((a, b) => a.level - b.level); // end_user first
    for (const def of ordered) {
        const parentId = def.parent ? byKey[def.parent]?.id || null : null;
        const [role] = await db.Role.findOrCreate({
            where: { tenant_id: platform.id, key: def.key },
            defaults: {
                name: def.name, description: def.description, scope_type: def.scope,
                level: def.level, parent_role_id: parentId, is_system: true, is_assignable: true,
            },
        });
        // Ensure parent link exists even if the row pre-dated this run.
        if (role.parent_role_id !== parentId) { role.parent_role_id = parentId; await role.save(); }
        byKey[def.key] = role;
    }
    logger.info(`[seed] ${Object.keys(byKey).length} system roles`);

    // 3 — Permission catalogue.
    const permByKey = {};
    for (const p of PERMISSIONS) {
        const key = `${p.resource}:${p.action}`;
        const [perm] = await db.Permission.findOrCreate({
            where: { resource: p.resource, action: p.action },
            defaults: { key, module: p.module || null, description: p.description || null, is_system: true },
        });
        permByKey[key] = perm;
    }
    logger.info(`[seed] ${Object.keys(permByKey).length} permissions`);

    // 4 — Map permissions onto roles.
    for (const [roleKey, grants] of Object.entries(ROLE_GRANTS)) {
        const role = byKey[roleKey];
        for (const permKey of grants) {
            const perm = permByKey[permKey];
            if (!perm) { logger.warn(`[seed] missing permission ${permKey}`); continue; }
            await db.RolePermission.findOrCreate({
                where: { role_id: role.id, permission_id: perm.id },
                defaults: { effect: 'allow', constraints: {} },
            });
        }
    }
    logger.info('[seed] role → permission grants applied');

    // 5 — Example ABAC policies (global).
    for (const pol of POLICIES) {
        await db.Policy.findOrCreate({
            where: { tenant_id: null, key: pol.key },
            defaults: {
                name: pol.name, description: pol.description, effect: pol.effect, priority: pol.priority,
                target: pol.target, condition: pol.condition, obligations: pol.obligations, status: 'active',
            },
        });
    }
    logger.info(`[seed] ${POLICIES.length} example policies`);

    logger.info('[seed] ✅ done');
}

seed()
    .then(() => db.sequelize.close())
    .then(() => process.exit(0))
    .catch((err) => { logger.error({ err: err.message }, '[seed] failed'); process.exit(1); });

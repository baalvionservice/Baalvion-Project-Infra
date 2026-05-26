'use strict';

/**
 * Dynamic enterprise RBAC. Layers on top of the built-in static roles (rbac.js):
 *   - custom org roles with granular dotted permissions (proxy.sessions.write)
 *   - role inheritance (custom role inherits built-in or other custom roles)
 *   - wildcard matching ('*', 'proxy.*', 'proxy.sessions.*' + legacy 'x:y')
 *
 * permissionMatches() is PURE (unit-tested). Resolution is cached in Redis.
 */

const db = require('../models');
const rbac = require('./rbac');
const { getRedis } = require('./redisClient');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

/** Does a granted permission satisfy a needed permission? Wildcard-aware. */
function permissionMatches(granted, needed) {
  if (granted === '*' || granted === needed) return true;
  if (granted.endsWith('*')) {
    // 'proxy.*' → prefix 'proxy.'; 'proxy:' → prefix 'proxy:'; bare '*' handled above.
    const prefix = granted.slice(0, -1);
    return needed.startsWith(prefix);
  }
  return false;
}

function hasPermission(perms, needed) {
  if (!needed) return true;
  return perms.some((g) => permissionMatches(g, needed));
}

// ── Resolution ────────────────────────────────────────────────────────────────
async function resolveRole(orgId, roleName, seen = new Set()) {
  if (!roleName || seen.has(roleName)) return [];
  seen.add(roleName);

  // Built-in role → static permission list.
  if (rbac.rolePermissions[roleName]) {
    return rbac.rolePermissions[roleName].slice();
  }

  // Custom role (per-org).
  const [role] = await db.sequelize.query(
    `SELECT id, inherits FROM custom_roles WHERE org_id = :org AND name = :name`,
    { replacements: { org: orgId, name: roleName }, type: Q.SELECT },
  );
  if (!role) return [];

  const direct = await db.sequelize.query(
    `SELECT permission FROM custom_role_permissions WHERE role_id = :id`,
    { replacements: { id: role.id }, type: Q.SELECT },
  );
  const perms = new Set(direct.map((r) => r.permission));

  for (const parent of (role.inherits || [])) {
    for (const p of await resolveRole(orgId, parent, seen)) perms.add(p);
  }
  return [...perms];
}

/** Effective permissions for a user = base membership role ∪ assigned custom role. */
async function resolveForUser(orgId, baseRole, customRoleId) {
  const redis = getRedis();
  const cacheKey = `perm:eff:${orgId}:${baseRole}:${customRoleId || '-'}`;
  if (redis) {
    try { const c = await redis.get(cacheKey); if (c) return JSON.parse(c); } catch (_) {}
  }

  const perms = new Set(await resolveRole(orgId, baseRole));
  if (customRoleId) {
    const [cr] = await db.sequelize.query(`SELECT name FROM custom_roles WHERE id = :id AND org_id = :org`, { replacements: { id: customRoleId, org: orgId }, type: Q.SELECT });
    if (cr) for (const p of await resolveRole(orgId, cr.name)) perms.add(p);
  }
  const out = [...perms];
  if (redis) { try { await redis.set(cacheKey, JSON.stringify(out), 'EX', 30); } catch (_) {} }
  return out;
}

function invalidate(orgId) {
  const redis = getRedis();
  if (redis) redis.keys(`perm:eff:${orgId}:*`).then((ks) => ks.length && redis.del(...ks)).catch(() => {});
}

// ── CRUD ────────────────────────────────────────────────────────────────────
async function listRoles(orgId) {
  const custom = await db.sequelize.query(
    `SELECT r.id, r.name, r.description, r.inherits, r.is_system,
            COALESCE(array_agg(p.permission) FILTER (WHERE p.permission IS NOT NULL), '{}') AS permissions
     FROM custom_roles r LEFT JOIN custom_role_permissions p ON p.role_id = r.id
     WHERE r.org_id = :org GROUP BY r.id ORDER BY r.name`,
    { replacements: { org: orgId }, type: Q.SELECT },
  );
  return { builtIn: Object.keys(rbac.rolePermissions), custom };
}

async function createRole({ orgId, name, description, inherits = [], permissions = [] }) {
  const [role] = await db.sequelize.query(
    `INSERT INTO custom_roles (org_id, name, description, inherits) VALUES (:org, :name, :desc, :inh::jsonb)
     ON CONFLICT (org_id, name) DO UPDATE SET description = EXCLUDED.description, inherits = EXCLUDED.inherits
     RETURNING id`,
    { replacements: { org: orgId, name, desc: description || null, inh: JSON.stringify(inherits) }, type: Q.SELECT },
  );
  await setPermissions(role.id, permissions);
  invalidate(orgId);
  return { id: role.id };
}

async function setPermissions(roleId, permissions) {
  await db.sequelize.query(`DELETE FROM custom_role_permissions WHERE role_id = :id`, { replacements: { id: roleId }, type: Q.DELETE });
  for (const p of permissions) {
    await db.sequelize.query(
      `INSERT INTO custom_role_permissions (role_id, permission) VALUES (:id, :p) ON CONFLICT DO NOTHING`,
      { replacements: { id: roleId, p }, type: Q.INSERT },
    );
  }
}

module.exports = { permissionMatches, hasPermission, resolveRole, resolveForUser, invalidate, listRoles, createRole, setPermissions };

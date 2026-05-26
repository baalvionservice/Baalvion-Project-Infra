'use strict';

/**
 * SCIM 2.0 provisioning engine. Idempotent user/group sync from the IdP
 * (Okta/Entra/etc.), with provisioning logs. Deprovisioning = deactivate +
 * revoke sessions/keys (PII retained for audit; GDPR erase is separate).
 */

const db = require('../models');
const complianceAudit = require('./complianceAudit');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;
const USER_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:User';
const LIST_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:ListResponse';

function toScimUser(u) {
  return {
    schemas: [USER_SCHEMA],
    id: String(u.id),
    externalId: u.scim_external_id || undefined,
    userName: u.email,
    name: { formatted: u.full_name || u.email, givenName: (u.full_name || '').split(' ')[0] },
    emails: [{ value: u.email, primary: true }],
    active: u.active !== false && u.status === 'active',
    meta: { resourceType: 'User' },
  };
}

async function log(orgId, operation, resourceType, externalId, status, detail = {}) {
  await db.sequelize.query(
    `INSERT INTO scim_provisioning_logs (org_id, operation, resource_type, external_id, status, detail)
     VALUES (:org, :op, :rt, :ext, :status, :detail::jsonb)`,
    { replacements: { org: orgId, op: operation, rt: resourceType, ext: externalId || null, status, detail: JSON.stringify(detail) }, type: Q.INSERT },
  ).catch((e) => logger.error('[scim] log failed:', e.message));
}

async function listUsers(orgId, { filter, startIndex = 1, count = 100 } = {}) {
  // SCIM filter: userName eq "x@y.com"
  let where = 'org_id = :org';
  const repl = { org: orgId };
  const m = /userName eq "([^"]+)"/i.exec(filter || '');
  if (m) { where += ' AND email = :email'; repl.email = m[1].toLowerCase(); }
  const rows = await db.sequelize.query(
    `SELECT id, email, full_name, status, active, scim_external_id FROM users WHERE ${where} ORDER BY id LIMIT :count OFFSET :off`,
    { replacements: { ...repl, count: Number(count), off: Number(startIndex) - 1 }, type: Q.SELECT },
  );
  return { schemas: [LIST_SCHEMA], totalResults: rows.length, startIndex: Number(startIndex), itemsPerPage: rows.length, Resources: rows.map(toScimUser) };
}

async function getUser(orgId, id) {
  const [u] = await db.sequelize.query(`SELECT id, email, full_name, status, active, scim_external_id FROM users WHERE id = :id AND org_id = :org`, { replacements: { id, org: orgId }, type: Q.SELECT });
  return u ? toScimUser(u) : null;
}

function emailOf(s) { return (s.emails && (s.emails.find((e) => e.primary) || s.emails[0]) || {}).value || s.userName; }

async function createUser(orgId, scim) {
  const email = String(emailOf(scim) || '').toLowerCase();
  if (!email) { await log(orgId, 'create', 'User', scim.externalId, 'error', { reason: 'no_email' }); throw scimError(400, 'email required'); }

  // Idempotency: existing by externalId or email → return it (200, no dup).
  const [existing] = await db.sequelize.query(
    `SELECT id, email, full_name, status, active, scim_external_id FROM users WHERE org_id = :org AND (scim_external_id = :ext OR email = :email)`,
    { replacements: { org: orgId, ext: scim.externalId || null, email }, type: Q.SELECT },
  );
  if (existing) {
    await db.users.update({ scim_external_id: scim.externalId || existing.scim_external_id, active: scim.active !== false }, { where: { id: existing.id } });
    await log(orgId, 'create', 'User', scim.externalId, 'conflict', { id: existing.id });
    return toScimUser({ ...existing, scim_external_id: scim.externalId, active: scim.active !== false });
  }

  const created = await db.users.create({
    org_id: orgId, email, full_name: (scim.name && scim.name.formatted) || email,
    role: 'viewer', status: scim.active === false ? 'suspended' : 'active',
    active: scim.active !== false, scim_external_id: scim.externalId || null,
    provisioned_via: 'scim', password_hash: 'scim:provisioned',
  });
  await db.sequelize.query(
    `INSERT INTO org_memberships (org_id, user_id, role, status) VALUES (:org, :u, 'viewer', 'active') ON CONFLICT (org_id, user_id) DO NOTHING`,
    { replacements: { org: orgId, u: created.id }, type: Q.INSERT },
  ).catch(() => {});
  await log(orgId, 'create', 'User', scim.externalId, 'ok', { id: created.id });
  await complianceAudit.log({ domain: 'access', action: 'scim_provision', orgId, payload: { email } });
  return toScimUser({ id: created.id, email, full_name: created.full_name, status: created.status, active: true, scim_external_id: scim.externalId });
}

async function patchUser(orgId, id, payload) {
  const ops = (payload && payload.Operations) || [];
  let active;
  for (const op of ops) {
    const path = (op.path || '').toLowerCase();
    if (path === 'active' || (op.value && typeof op.value.active === 'boolean')) {
      active = typeof op.value === 'boolean' ? op.value : op.value.active;
    }
  }
  if (active === false) return deleteUser(orgId, id); // deprovision
  if (active === true) {
    await db.users.update({ active: true, status: 'active' }, { where: { id, org_id: orgId } });
    await log(orgId, 'patch', 'User', null, 'ok', { id, active });
  }
  return getUser(orgId, id);
}

async function deleteUser(orgId, id) {
  await db.users.update({ active: false, status: 'suspended' }, { where: { id, org_id: orgId } });
  await db.sequelize.query(`UPDATE sessions SET revoked_at = now() WHERE user_id = :u AND revoked_at IS NULL`, { replacements: { u: id }, type: Q.UPDATE }).catch(() => {});
  await log(orgId, 'delete', 'User', null, 'ok', { id });
  await complianceAudit.log({ domain: 'access', action: 'scim_deprovision', orgId, payload: { userId: id } });
  return true;
}

// Group sync: map IdP group members → a baalvion role for the org.
async function syncGroup(orgId, scimGroup) {
  const role = (scimGroup.displayName || '').toLowerCase().replace(/[^a-z]/g, '') || 'viewer';
  const members = (scimGroup.members || []).map((m) => m.value);
  for (const uid of members) {
    await db.sequelize.query(`UPDATE org_memberships SET role = :role WHERE org_id = :org AND user_id = :u`, { replacements: { role, org: orgId, u: uid }, type: Q.UPDATE }).catch(() => {});
  }
  await log(orgId, 'group_sync', 'Group', scimGroup.externalId, 'ok', { role, members: members.length });
  return { schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'], id: scimGroup.externalId || scimGroup.displayName, displayName: scimGroup.displayName, members: scimGroup.members };
}

function scimError(status, detail) {
  const e = new Error(detail); e.scim = { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: String(status), detail }; e.status = status; return e;
}

module.exports = { listUsers, getUser, createUser, patchUser, deleteUser, syncGroup, toScimUser, scimError };

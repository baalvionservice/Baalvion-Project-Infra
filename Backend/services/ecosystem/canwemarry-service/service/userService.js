'use strict';
const db = require('../models');
const config = require('../config/appConfig');
const { ROLES, ALL_ROLES, MODERATOR_GRANTABLE } = require('../domain/roles');
const { badRequest, notFound, forbidden } = require('../utils/errors');

/**
 * Provision the local row for a verified platform subject.
 *
 * Keyed on `platform_subject` — the JWT `sub` — rather than using it as the primary key,
 * because auth-service issues a bigint and this schema's ids are UUIDs. Everything
 * downstream works with the LOCAL id returned here.
 *
 * Idempotent, and stores nothing but the subject: no email, no name, no credential.
 * Identity remains owned by auth-service; this row is only an anchor for the product's
 * foreign keys.
 */
async function provision(subject) {
    const platformSubject = String(subject);

    const [user] = await db.User.findOrCreate({
        where: { platform_subject: platformSubject },
        defaults: { platform_subject: platformSubject, status: 'ACTIVE', last_seen_at: new Date() },
    });

    const existing = await db.UserRole.count({ where: { user_id: user.id } });
    if (existing === 0) {
        await db.UserRole.create({ user_id: user.id, role: ROLES.USER });
    }

    // Bootstrap operator for a fresh deployment — otherwise nobody can grant the first ADMIN
    // and the moderation queue has no reviewers. Matched on the SUBJECT, since that is the
    // only id an operator can know before the account exists here.
    //
    // Deliberately OUTSIDE the "no roles yet" branch. It used to sit inside it, which meant
    // the grant only ever fired on the very first request an account made: an operator who
    // registered before setting BOOTSTRAP_ADMIN_USER_ID — the normal order, since you need an
    // account to learn your own subject — set the variable, restarted, and stayed a plain
    // USER with no way in and no error explaining why. Re-applying it on every provision is
    // idempotent and still gated by an environment variable only a deploy operator can set.
    if (config.security.bootstrapAdminUserId && config.security.bootstrapAdminUserId === platformSubject) {
        await db.UserRole.findOrCreate({
            where: { user_id: user.id, role: ROLES.ADMIN },
            defaults: { user_id: user.id, role: ROLES.ADMIN },
        });
    }
    return user;
}

async function rolesFor(userId) {
    const rows = await db.UserRole.findAll({ where: { user_id: userId }, attributes: ['role'] });
    const roles = rows.map((r) => r.role);
    return roles.length ? roles : [ROLES.USER];
}

async function getById(userId) {
    const user = await db.User.findByPk(userId);
    if (!user) throw notFound('User');
    return user;
}

/**
 * Role grants. A moderator may only confer the two community-helper roles; promoting
 * someone to MODERATOR or ADMIN is an ADMIN act, so the moderation tier cannot expand
 * itself without an administrator.
 */
async function grantRole({ actor, userId, role }) {
    if (!ALL_ROLES.includes(role)) throw badRequest(`Unknown role '${role}'`);
    const isAdmin = actor.roles.includes(ROLES.ADMIN);
    if (!isAdmin && !MODERATOR_GRANTABLE.includes(role)) {
        throw forbidden('Only an administrator can grant that role.');
    }
    await getById(userId);
    const [row, created] = await db.UserRole.findOrCreate({
        where: { user_id: userId, role },
        defaults: { user_id: userId, role, granted_by: actor.userId },
    });
    return { role: row.role, created };
}

async function revokeRole({ actor, userId, role }) {
    if (role === ROLES.USER) throw badRequest('The baseline USER role cannot be revoked.');
    const isAdmin = actor.roles.includes(ROLES.ADMIN);
    if (!isAdmin && !MODERATOR_GRANTABLE.includes(role)) {
        throw forbidden('Only an administrator can revoke that role.');
    }
    const removed = await db.UserRole.destroy({ where: { user_id: userId, role } });
    return { role, removed: removed > 0 };
}

async function list({ page, pageSize, status }) {
    const where = status ? { status } : {};
    const { rows, count } = await db.User.findAndCountAll({
        where,
        include: [{ model: db.Profile, as: 'profile', required: false }, { model: db.UserRole, as: 'roles', required: false }],
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        distinct: true,
    });
    return { items: rows.map(serializeAdmin), total: count };
}

/** Admin-facing shape. Still carries no email — this service never had one to leak. */
const serializeAdmin = (u) => ({
    id: u.id,
    status: u.status,
    suspendedUntil: u.suspended_until,
    roles: (u.roles || []).map((r) => r.role),
    handle: u.profile ? u.profile.handle : null,
    displayName: u.profile ? u.profile.display_name : null,
    createdAt: u.created_at,
    lastSeenAt: u.last_seen_at,
});

module.exports = { provision, rolesFor, getById, grantRole, revokeRole, list, serializeAdmin };

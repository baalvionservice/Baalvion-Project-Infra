'use strict';
const db = require('../models');
const userService = require('./userService');
const notificationService = require('./notificationService');
const { cleanBody } = require('../utils/sanitize');
const { ROLES, MODERATOR_GRANTABLE } = require('../domain/roles');
const { badRequest, conflict, notFound, forbidden } = require('../utils/errors');

/**
 * Asking to become a supporter or a volunteer.
 *
 * The capability to offer support is not granted on sign-up, on purpose — see
 * migrations/006_role_requests.sql. This is how somebody asks for it, and how a moderator
 * answers.
 *
 * Three properties worth keeping:
 *
 * The applicant's reason is their own account of their own family, and it is read by
 * moderators and nobody else. It never travels with a support offer, never appears on a
 * profile, and is not part of any list a member can reach.
 *
 * A refusal carries a written note and does not bar a second attempt. Circumstances change,
 * and a permanent silent no would be the platform deciding who is allowed to help.
 *
 * And only SUPPORTER and VOLUNTEER can be asked for. There is no route here to MODERATOR or
 * ADMIN: a table that let people nominate themselves for authority over others would be a
 * different product.
 */

const STATUS = Object.freeze({
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    DECLINED: 'DECLINED',
    WITHDRAWN: 'WITHDRAWN',
});

const REASON_MIN = 40;
const REASON_MAX = 2000;

/** What the applicant sees about their own request. */
const serializeMine = (r) => ({
    id: r.id,
    role: r.role,
    reason: r.reason,
    status: r.status,
    decisionNote: r.decision_note,
    decidedAt: r.decided_at,
    createdAt: r.created_at,
});

/**
 * What a moderator sees. Carries the handle so a decision is about a person rather than a
 * UUID — and carries no email, because this service has never held one.
 */
const serializeForReview = (r) => ({
    id: r.id,
    role: r.role,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
    decidedAt: r.decided_at,
    decisionNote: r.decision_note,
    applicant: r.user
        ? {
              id: r.user.id,
              handle: r.user.profile ? r.user.profile.handle : null,
              displayName: r.user.profile ? r.user.profile.display_name : null,
              status: r.user.status,
              memberSince: r.user.created_at,
              roles: (r.user.roles || []).map((x) => x.role),
          }
        : null,
});

const withApplicant = () => [
    {
        model: db.User,
        as: 'user',
        required: false,
        include: [
            { model: db.Profile, as: 'profile', required: false },
            { model: db.UserRole, as: 'roles', required: false },
        ],
    },
];

async function create(ctx, { role, reason }) {
    if (!MODERATOR_GRANTABLE.includes(role)) {
        // Deliberately the same message whichever unaskable role was named, so this cannot be
        // used to enumerate what the role vocabulary contains.
        throw badRequest('You can ask to become a supporter or a volunteer.');
    }

    const body = cleanBody(reason) || '';
    if (body.trim().length < REASON_MIN) {
        throw badRequest(`Tell us a little about why — at least ${REASON_MIN} characters.`);
    }
    if (body.length > REASON_MAX) throw badRequest('That is longer than we can accept.');

    const held = await userService.rolesFor(ctx.actor.userId);
    if (held.includes(role)) throw conflict('You already hold that standing.');

    const open = await db.RoleRequest.findOne({
        where: { user_id: ctx.actor.userId, role, status: STATUS.PENDING },
    });
    if (open) throw conflict('You already have a request waiting. A moderator will read it.');

    const row = await db.RoleRequest.create({
        user_id: ctx.actor.userId,
        role,
        reason: body.trim(),
        status: STATUS.PENDING,
    });
    return serializeMine(row);
}

async function listMine(ctx) {
    const rows = await db.RoleRequest.findAll({
        where: { user_id: ctx.actor.userId },
        order: [['created_at', 'DESC']],
        limit: 20,
    });
    return rows.map(serializeMine);
}

async function withdraw(ctx, id) {
    const row = await db.RoleRequest.findByPk(id);
    // 404 rather than 403 for somebody else's request, so the response cannot confirm that a
    // given id exists — the same rule the case reads follow.
    if (!row || row.user_id !== ctx.actor.userId) throw notFound('Request');
    if (row.status !== STATUS.PENDING) throw conflict('That request has already been decided.');

    await row.update({ status: STATUS.WITHDRAWN, decided_at: new Date() });
    return serializeMine(row);
}

async function queue({ status = STATUS.PENDING, page = 1, pageSize = 20 }) {
    const { rows, count } = await db.RoleRequest.findAndCountAll({
        where: status === 'ALL' ? {} : { status },
        include: withApplicant(),
        // Oldest first: a review queue that shows the newest first leaves the person who has
        // waited longest at the bottom of the list forever.
        order: [['created_at', 'ASC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        distinct: true,
    });
    return { items: rows.map(serializeForReview), total: count };
}

async function get(id) {
    const row = await db.RoleRequest.findByPk(id, { include: withApplicant() });
    if (!row) throw notFound('Request');
    return serializeForReview(row);
}

/**
 * A moderator's answer.
 *
 * Approval grants through userService.grantRole, so the one place that decides who may confer
 * what stays the only place — a moderator cannot reach past it by approving a request for a
 * role they could not have granted directly.
 */
async function decide(ctx, id, { approve, note }) {
    const row = await db.RoleRequest.findByPk(id);
    if (!row) throw notFound('Request');
    if (row.status !== STATUS.PENDING) throw conflict('That request has already been decided.');
    if (row.user_id === ctx.actor.userId) {
        throw forbidden('You cannot decide your own request.');
    }

    const decisionNote = cleanBody(note) || null;
    if (!approve && !decisionNote) {
        // A silent refusal is not reviewable and tells the applicant nothing.
        throw badRequest('Say why, so the person can see what the answer was.');
    }

    if (approve) {
        await userService.grantRole({ actor: ctx.actor, userId: row.user_id, role: row.role });
    }

    await row.update({
        status: approve ? STATUS.APPROVED : STATUS.DECLINED,
        decided_by: ctx.actor.userId,
        decided_at: new Date(),
        decision_note: decisionNote,
    });

    await notificationService.notify(
        row.user_id,
        approve
            ? notificationService.EVENT.roleRequestApproved(row.role)
            : notificationService.EVENT.roleRequestDeclined(),
        ctx.actor.userId,
    );

    return serializeMine(row);
}

module.exports = { create, listMine, withdraw, queue, get, decide, STATUS, ROLES, REASON_MIN, REASON_MAX };

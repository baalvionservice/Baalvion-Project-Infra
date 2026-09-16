'use strict';
const db = require('../models');
const caseService = require('./caseService');
const notificationService = require('./notificationService');
const { cleanBody } = require('../utils/sanitize');
const { badRequest, notFound } = require('../utils/errors');

const ACTION = Object.freeze({
    HIDE: 'HIDE', UNHIDE: 'UNHIDE', LOCK: 'LOCK', UNLOCK: 'UNLOCK',
    WARN: 'WARN', SUSPEND: 'SUSPEND', UNSUSPEND: 'UNSUSPEND',
    REMOVE: 'REMOVE', RESTORE: 'RESTORE', DISMISS_REPORT: 'DISMISS_REPORT',
});

const CONTENT_MODELS = { CASE: 'Case', POST: 'Post', COMMENT: 'Comment' };

/**
 * Apply a moderation action and record it.
 *
 * Every action requires a written reason (NOT NULL in the schema) and every action lands in
 * moderation_actions. A moderation regime whose decisions cannot be reviewed afterwards is
 * indistinguishable from an arbitrary one, and this product's whole premise is that people
 * are safe here.
 */
async function apply(ctx, { targetType, targetId, action, reason, expiresAt }) {
    const cleanReason = cleanBody(reason);

    if (action === ACTION.SUSPEND || action === ACTION.UNSUSPEND) {
        await applyToUser(targetType, targetId, action, expiresAt);
    } else if (action === ACTION.WARN) {
        await warn(targetId, cleanReason);
    } else {
        await applyToContent(targetType, targetId, action);
    }

    // Phase 9's rule made concrete: a moderation action a person is not told about is
    // indistinguishable, from their side, from their writing quietly vanishing.
    await notifyContentOwner(targetType, targetId, action, ctx.actor.userId);

    const record = await db.ModerationAction.create({
        actor_id: ctx.actor.userId,
        target_type: targetType,
        target_id: targetId,
        action,
        reason: cleanReason,
        expires_at: expiresAt || null,
    });
    return serialize(record);
}

async function applyToContent(targetType, targetId, action) {
    const modelName = CONTENT_MODELS[targetType];
    if (!modelName) throw badRequest(`'${action}' cannot be applied to a ${targetType}.`);

    const state = {
        [ACTION.HIDE]: 'HIDDEN',
        [ACTION.UNHIDE]: 'VISIBLE',
        [ACTION.REMOVE]: 'REMOVED',
        [ACTION.RESTORE]: 'VISIBLE',
    }[action];

    if (state) {
        if (targetType === 'CASE') { await caseService.setModerationState(targetId, state); return; }
        const row = await db[modelName].findByPk(targetId);
        if (!row) throw notFound(targetType);
        await row.update({ moderation_state: state });
        return;
    }

    if (action === ACTION.LOCK || action === ACTION.UNLOCK) {
        const locked = action === ACTION.LOCK;
        if (targetType === 'CASE') { await caseService.setLocked(targetId, locked); return; }
        const row = await db[modelName].findByPk(targetId);
        if (!row) throw notFound(targetType);
        await row.update({ is_locked: locked });
        return;
    }

    throw badRequest(`Unsupported moderation action '${action}'.`);
}

async function applyToUser(targetType, targetId, action, expiresAt) {
    if (targetType !== 'USER') throw badRequest(`'${action}' applies to a user, not a ${targetType}.`);
    const user = await db.User.findByPk(targetId);
    if (!user) throw notFound('User');
    await user.update(
        action === ACTION.SUSPEND
            ? { status: 'SUSPENDED', suspended_until: expiresAt || null }
            : { status: 'ACTIVE', suspended_until: null },
    );
}

/** Tell whoever wrote the thing that a moderator acted on it. Best-effort by design. */
async function notifyContentOwner(targetType, targetId, action, actorId) {
    // WARN and SUSPEND already notify through their own paths; a second message would be noise.
    if ([ACTION.WARN, ACTION.SUSPEND, ACTION.UNSUSPEND].includes(action)) return;

    const OWNER_FIELD = { CASE: 'owner_id', POST: 'author_id', COMMENT: 'author_id' };
    const modelName = CONTENT_MODELS[targetType];
    const field = OWNER_FIELD[targetType];
    if (!modelName || !field) return;

    try {
        const row = await db[modelName].findByPk(targetId);
        if (!row) return;
        await notificationService.notify(row[field], notificationService.EVENT.contentModerated(action), actorId);
    } catch (err) {
        // Never let telling somebody fail the action itself; the moderation record is the
        // authoritative trail either way.
        console.error('[canwemarry] moderation notify failed', { targetType, targetId, message: err.message });
    }
}

/** A warning is a notification with a reason attached — the person is told, not silently flagged. */
async function warn(userId, reason) {
    const user = await db.User.findByPk(userId);
    if (!user) throw notFound('User');
    await notificationService.create({
        userId,
        type: 'moderation.warning',
        title: 'A moderator has sent you a note about the community guidelines',
        body: reason,
        link: '/settings',
    });
}

async function history({ page, pageSize, targetType, targetId, actorId }) {
    const where = {};
    if (targetType) where.target_type = targetType;
    if (targetId) where.target_id = targetId;
    if (actorId) where.actor_id = actorId;

    const { rows, count } = await db.ModerationAction.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    return { items: rows.map(serialize), total: count };
}

const serialize = (m) => ({
    id: m.id,
    actorId: m.actor_id,
    reportId: m.report_id,
    targetType: m.target_type,
    targetId: m.target_id,
    action: m.action,
    reason: m.reason,
    expiresAt: m.expires_at,
    createdAt: m.created_at,
});

module.exports = { apply, history, ACTION };

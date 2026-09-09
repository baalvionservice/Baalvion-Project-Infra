'use strict';
const db = require('../models');
const commentService = require('./commentService');
const visibility = require('../domain/visibility');
const { notFound } = require('../utils/errors');

/**
 * Reactions are supportive only — SUPPORT, THANKS, HELPFUL — and the CHECK constraint in
 * the schema is what enforces it. There is no negative reaction to give, which removes a
 * whole class of pile-on behaviour rather than moderating it after the fact.
 */
async function set(ctx, { targetType, targetId, kind }) {
    await assertVisible(ctx, targetType, targetId);
    const [row, created] = await db.Reaction.findOrCreate({
        where: { user_id: ctx.actor.userId, target_type: targetType, target_id: targetId },
        defaults: { user_id: ctx.actor.userId, target_type: targetType, target_id: targetId, kind },
    });
    if (!created && row.kind !== kind) await row.update({ kind });
    return { id: row.id, targetType, targetId, kind: row.kind };
}

async function clear(ctx, { targetType, targetId }) {
    const removed = await db.Reaction.destroy({
        where: { user_id: ctx.actor.userId, target_type: targetType, target_id: targetId },
    });
    return { removed: removed > 0 };
}

async function summary(ctx, { targetType, targetId }) {
    await assertVisible(ctx, targetType, targetId);
    const rows = await db.Reaction.findAll({
        where: { target_type: targetType, target_id: targetId },
        attributes: ['kind', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
        group: ['kind'],
        raw: true,
    });
    const counts = Object.fromEntries(rows.map((r) => [r.kind, Number(r.count)]));
    const mine = ctx.actor.userId
        ? await db.Reaction.findOne({ where: { user_id: ctx.actor.userId, target_type: targetType, target_id: targetId } })
        : null;
    return { counts, mine: mine ? mine.kind : null };
}

/** Reacting to something requires being able to see it, by the same rule that governs reading. */
async function assertVisible(ctx, targetType, targetId) {
    if (targetType === 'CASE') {
        const row = await db.Case.findByPk(targetId);
        if (!row || visibility.viewLevel(ctx, row) === visibility.VIEW_LEVEL.NONE) throw notFound('Case');
        return;
    }
    if (targetType === 'COMMENT') {
        const comment = await db.Comment.findByPk(targetId);
        if (!comment) throw notFound('Comment');
        await commentService.assertTargetAccess(ctx, comment.target_type, comment.target_id);
        return;
    }
    await commentService.assertTargetAccess(ctx, 'POST', targetId);
}

module.exports = { set, clear, summary };

'use strict';
const db = require('../models');
const visibility = require('../domain/visibility');
const postService = require('./postService');
const notificationService = require('./notificationService');
const db2 = require('../models');
const { cleanBody } = require('../utils/sanitize');
const { notFound, forbidden, badRequest } = require('../utils/errors');

const TARGET = Object.freeze({ POST: 'POST', CASE: 'CASE' });
const VISIBLE = 'VISIBLE';

/**
 * Comments are polymorphic over posts and cases, and each target has its own access rule.
 * Resolving the target first — rather than trusting the ids in the path — is what keeps a
 * case comment from being reachable by asking for it as a post comment.
 */
async function assertTargetAccess(ctx, targetType, targetId, { forWriting = false } = {}) {
    if (targetType === TARGET.POST) {
        const post = await db.Post.findByPk(targetId);
        if (!post) throw notFound('Post');
        await postService.assertReadable(ctx, post.community_id);
        if (forWriting) {
            if (post.is_locked) throw forbidden('This post is locked.');
            await postService.assertMember(ctx, post.community_id);
        }
        return post;
    }

    if (targetType === TARGET.CASE) {
        const row = await db.Case.findByPk(targetId);
        if (!row || visibility.viewLevel(ctx, row) === visibility.VIEW_LEVEL.NONE) throw notFound('Case');
        if (forWriting && !visibility.canComment(ctx, row)) {
            throw forbidden('Only people involved in this case, or its community, can comment on it.');
        }
        return row;
    }

    throw badRequest(`Unknown comment target '${targetType}'`);
}

async function list(ctx, { targetType, targetId, page, pageSize }) {
    await assertTargetAccess(ctx, targetType, targetId);
    const { rows, count } = await db.Comment.findAndCountAll({
        where: { target_type: targetType, target_id: targetId, moderation_state: VISIBLE },
        order: [['created_at', 'ASC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    return { items: rows.map(serialize), total: count };
}

async function create(ctx, { targetType, targetId, parentId, body }) {
    const target = await assertTargetAccess(ctx, targetType, targetId, { forWriting: true });

    if (parentId) {
        const parent = await db.Comment.findByPk(parentId);
        if (!parent || parent.target_type !== targetType || parent.target_id !== targetId) {
            throw badRequest('The comment being replied to does not belong to this discussion.');
        }
    }

    const row = await db.sequelize.transaction(async (tx) => {
        const created = await db.Comment.create({
            target_type: targetType,
            target_id: targetId,
            parent_id: parentId || null,
            author_id: ctx.actor.userId,
            body: cleanBody(body),
        }, { transaction: tx });
        await target.increment('comment_count', { by: 1, transaction: tx });
        return created;
    });

    // Told after the write commits: a notification that never arrives is a small failure,
    // whereas a comment lost because notifying threw is a large one.
    await notifyOnComment(ctx, targetType, targetId, target, parentId);

    return serialize(row);
}

async function update(ctx, id, body) {
    const row = await db.Comment.findByPk(id);
    if (!row) throw notFound('Comment');
    if (row.author_id !== ctx.actor.userId) throw forbidden('Only the author can edit a comment.');
    await assertTargetAccess(ctx, row.target_type, row.target_id);
    await row.update({ body: cleanBody(body) });
    return serialize(row);
}

async function remove(ctx, id) {
    const row = await db.Comment.findByPk(id);
    if (!row) throw notFound('Comment');
    if (row.author_id !== ctx.actor.userId) throw forbidden('Only the author can delete a comment.');

    const Model = row.target_type === TARGET.POST ? db.Post : db.Case;
    await db.sequelize.transaction(async (tx) => {
        await row.destroy({ transaction: tx });
        await Model.decrement('comment_count', { by: 1, where: { id: row.target_id }, transaction: tx });
    });
    return { id, deleted: true };
}

/**
 * Who hears about a new comment.
 *
 * The owner of the thing commented on, and the author of the comment being replied to —
 * nobody else. In particular, not everyone else in the thread: a case discussion is a small
 * room, and turning every reply into a broadcast is how a support conversation starts to
 * feel like an obligation.
 */
async function notifyOnComment(ctx, targetType, targetId, target, parentId) {
    const actorId = ctx.actor.userId;

    if (targetType === TARGET.CASE) {
        await notificationService.notify(target.owner_id, notificationService.EVENT.caseCommented(targetId), actorId);
    } else {
        const community = await db2.Community.findByPk(target.community_id);
        await notificationService.notify(
            target.author_id,
            notificationService.EVENT.postCommented(community ? community.slug : target.community_id, targetId),
            actorId,
        );
    }

    if (parentId) {
        const parent = await db2.Comment.findByPk(parentId);
        if (parent) {
            await notificationService.notify(parent.author_id, notificationService.EVENT.commentReplied(targetId), actorId);
        }
    }
}

const serialize = (c) => ({
    id: c.id,
    targetType: c.target_type,
    targetId: c.target_id,
    parentId: c.parent_id,
    authorId: c.author_id,
    body: c.body,
    moderationState: c.moderation_state,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
});

module.exports = { list, create, update, remove, serialize, assertTargetAccess, TARGET };

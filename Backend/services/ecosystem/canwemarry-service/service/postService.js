'use strict';
const db = require('../models');
const { cleanText, cleanBody } = require('../utils/sanitize');
const { notFound, forbidden } = require('../utils/errors');

const VISIBLE = 'VISIBLE';

/** Posts live inside a community, so community membership is the access rule. */
async function list(ctx, { communityId, page, pageSize }) {
    await assertReadable(ctx, communityId);
    const { rows, count } = await db.Post.findAndCountAll({
        where: { community_id: communityId, moderation_state: VISIBLE, deleted_at: null },
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    return { items: rows.map(serialize), total: count };
}

async function get(ctx, id) {
    const row = await db.Post.findByPk(id);
    if (!row) throw notFound('Post');
    // A deleted post is gone for everyone, its author included. The row remains only so a
    // report or moderation record about it still resolves to something.
    if (row.deleted_at) throw notFound('Post');
    await assertReadable(ctx, row.community_id);
    if (row.moderation_state !== VISIBLE && row.author_id !== ctx.actor.userId) throw notFound('Post');
    return serialize(row);
}

async function create(ctx, { communityId, title, body }) {
    await assertMember(ctx, communityId);
    const row = await db.Post.create({
        community_id: communityId,
        author_id: ctx.actor.userId,
        title: cleanText(title),
        body: cleanBody(body),
    });
    return serialize(row);
}

async function update(ctx, id, { title, body }) {
    const row = await db.Post.findByPk(id);
    if (!row || row.deleted_at) throw notFound('Post');
    if (row.author_id !== ctx.actor.userId) throw forbidden('Only the author can edit a post.');
    if (row.is_locked) throw forbidden('This post is locked.');
    await row.update({
        ...(title !== undefined ? { title: cleanText(title) } : {}),
        ...(body !== undefined ? { body: cleanBody(body) } : {}),
    });
    return serialize(row);
}

/**
 * Author deletion.
 *
 * The row is kept but emptied: the title and body are OVERWRITTEN, not flagged, so the
 * original text is not recoverable from the table afterwards. What survives is an
 * addressable tombstone, which is what lets a moderator still open a report filed about the
 * post instead of finding a dangling id.
 */
async function remove(ctx, id) {
    const row = await db.Post.findByPk(id);
    if (!row || row.deleted_at) throw notFound('Post');
    if (row.author_id !== ctx.actor.userId) throw forbidden('Only the author can delete a post.');

    await db.sequelize.transaction(async (tx) => {
        await db.Comment.destroy({ where: { target_type: 'POST', target_id: row.id }, transaction: tx });
        await row.update({
            deleted_at: new Date(),
            title: '[deleted]',
            body: '',
            comment_count: 0,
        }, { transaction: tx });
    });
    return { id, deleted: true };
}

/** A public community is readable without joining; a private one is not. */
async function assertReadable(ctx, communityId) {
    const community = await db.Community.findByPk(communityId);
    if (!community || !community.is_active) throw notFound('Community');
    if (community.visibility === 'PRIVATE' && !ctx.communityIds.includes(communityId)) throw notFound('Community');
    return community;
}

async function assertMember(ctx, communityId) {
    const community = await assertReadable(ctx, communityId);
    if (!ctx.communityIds.includes(communityId)) throw forbidden('Join this community before posting in it.');
    return community;
}

const serialize = (p) => ({
    id: p.id,
    deletedAt: p.deleted_at ?? null,
    communityId: p.community_id,
    authorId: p.author_id,
    title: p.title,
    body: p.body,
    isLocked: p.is_locked,
    commentCount: p.comment_count,
    moderationState: p.moderation_state,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
});

module.exports = { list, get, create, update, remove, serialize, assertReadable, assertMember };

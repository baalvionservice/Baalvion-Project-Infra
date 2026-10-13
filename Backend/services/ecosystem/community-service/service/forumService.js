'use strict';
// The forum itself: topics and replies are stored here, shaped the way the thread pages already read them.
const { Op, fn, col, literal } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');

const iso = (d) => (d ? new Date(d).getTime() : null);

// Members are shown by the name they chose for their public page, never by email.
async function authorName(userId) {
    const uid = String(userId);
    const p = await db.MemberProfile.findByPk(uid, { attributes: ['public_name', 'handle'] });
    if (p && p.public_name) return p.public_name.slice(0, 120);
    if (p && p.handle) return p.handle.slice(0, 120);
    let h = 0;
    for (const ch of uid) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return `Member ${h.toString(36).toUpperCase().padStart(6, '0').slice(-6)}`;
}

const topicJson = (t) => ({
    tid: String(t.id),
    title: t.title,
    timestamp: iso(t.created_at),
    postcount: t.post_count,
    viewcount: t.views,
    pinned: t.is_pinned,
    locked: t.is_locked,
    lastPostTimestamp: iso(t.last_post_at),
    lastPostBy: t.last_post_by || t.author_name,
    user: { username: t.author_name, picture: null },
    threadType: t.thread_type,
    isAnswered: t.is_answered,
    acceptedPid: t.accepted_pid != null ? String(t.accepted_pid) : null,
});

async function listTopics(community, { limit = 50, offset = 0 } = {}) {
    const rows = await db.ForumTopic.findAll({
        where: { community_id: community.id },
        order: [['is_pinned', 'DESC'], ['last_post_at', 'DESC']],
        limit: Math.min(Number(limit) || 50, 100), offset: Number(offset) || 0,
    });
    return { topics: rows.map(topicJson) };
}

async function getTopic(community, tid) {
    const id = Number(tid);
    if (!Number.isInteger(id)) throw new AppError('NOT_FOUND', 'Thread not found', 404);
    const t = await db.ForumTopic.findOne({ where: { id, community_id: community.id } });
    if (!t) throw new AppError('NOT_FOUND', 'Thread not found', 404);
    db.ForumTopic.increment('views', { where: { id } }).catch(() => {});
    const posts = await db.ForumPost.findAll({ where: { topic_id: id }, order: [['id', 'ASC']], limit: 500 });
    return {
        ...topicJson(t), viewcount: t.views + 1,
        posts: posts.map((p) => ({
            pid: String(p.id), uid: p.author_user_id,
            content: p.removed ? '[This post was removed by a moderator]' : p.content,
            timestamp: iso(p.created_at), edited: !!p.edited_at,
            user: { username: p.author_name, picture: null },
        })),
    };
}

// A member may start a handful of threads and replies per minute; more than that is almost always a script.
async function assertNotFlooding(userId) {
    const since = new Date(Date.now() - 60 * 1000);
    const n = await db.ForumPost.count({ where: { author_user_id: String(userId), created_at: { [Op.gte]: since } } });
    if (n >= 6) throw new AppError('RATE_LIMITED', 'You are posting too fast. Wait a minute and try again.', 429);
}

async function createTopic(community, userId, { title, content, type }) {
    await assertNotFlooding(userId);
    const name = await authorName(userId);
    return db.sequelize.transaction(async (transaction) => {
        const t = await db.ForumTopic.create({
            community_id: community.id, author_user_id: String(userId), author_name: name,
            title: title.trim(), thread_type: type === 'question' ? 'question' : 'discussion', last_post_by: name,
        }, { transaction });
        await db.ForumPost.create({ topic_id: t.id, author_user_id: String(userId), author_name: name, content }, { transaction });
        return { tid: String(t.id) };
    });
}

async function createReply(community, tid, userId, content) {
    await assertNotFlooding(userId);
    const t = await db.ForumTopic.findOne({ where: { id: Number(tid) || 0, community_id: community.id } });
    if (!t) throw new AppError('NOT_FOUND', 'Thread not found', 404);
    if (t.is_locked) throw new AppError('LOCKED', 'This thread is locked', 403);
    const name = await authorName(userId);
    return db.sequelize.transaction(async (transaction) => {
        const p = await db.ForumPost.create({ topic_id: t.id, author_user_id: String(userId), author_name: name, content }, { transaction });
        await t.update({ post_count: t.post_count + 1, last_post_at: new Date(), last_post_by: name }, { transaction });
        return { pid: String(p.id) };
    });
}

async function editPost(community, tid, pid, userId, content, isAdmin) {
    const p = await db.ForumPost.findOne({ where: { id: Number(pid) || 0, topic_id: Number(tid) || 0 }, include: [{ model: db.ForumTopic, as: 'topic', where: { community_id: community.id } }] });
    if (!p || p.removed) throw new AppError('NOT_FOUND', 'Post not found in this thread', 404);
    if (p.author_user_id !== String(userId) && !isAdmin) throw new AppError('FORBIDDEN', 'You can only edit your own posts', 403);
    await p.update({ content, edited_at: new Date() });
    return { pid: String(p.id) };
}

async function flagPost(community, tid, pid, userId, reason) {
    const p = await db.ForumPost.findOne({ where: { id: Number(pid) || 0, topic_id: Number(tid) || 0 }, include: [{ model: db.ForumTopic, as: 'topic', where: { community_id: community.id } }] });
    if (!p) throw new AppError('NOT_FOUND', 'Post not found in this thread', 404);
    await db.ForumFlag.findOrCreate({ where: { post_id: p.id, reporter_user_id: String(userId) }, defaults: { reason: reason.slice(0, 1000) } });
    return { flagged: true };
}

async function acceptAnswer(tid, pid) {
    const t = await db.ForumTopic.findByPk(Number(tid) || 0);
    if (!t) throw new AppError('NOT_FOUND', 'Thread not found', 404);
    const p = await db.ForumPost.findOne({ where: { id: Number(pid) || 0, topic_id: t.id } });
    if (!p) throw new AppError('NOT_FOUND', 'Reply not found in this thread', 404);
    await t.update({ is_answered: true, accepted_pid: p.id });
    return t;
}

// Counts and the newest thread for every board, for the forum home. One query each.
async function boardStats(communityIds) {
    if (!communityIds.length) return {};
    const counts = await db.ForumTopic.findAll({
        where: { community_id: { [Op.in]: communityIds } }, group: ['community_id'], raw: true,
        attributes: ['community_id', [fn('count', col('id')), 'topics'], [fn('sum', col('post_count')), 'posts']],
    });
    const out = {};
    for (const c of counts) out[c.community_id] = { topicCount: Number(c.topics), postCount: Number(c.posts), latest: null };
    const latest = await db.ForumTopic.findAll({
        where: { community_id: { [Op.in]: communityIds }, id: { [Op.in]: literal('(select distinct on (community_id) id from community.forum_topics order by community_id, last_post_at desc)') } },
    });
    for (const t of latest) if (out[t.community_id]) out[t.community_id].latest = { tid: String(t.id), title: t.title, by: t.last_post_by || t.author_name, at: iso(t.last_post_at) };
    return out;
}

module.exports = { listTopics, getTopic, createTopic, createReply, editPost, flagPost, acceptAnswer, boardStats, authorName };

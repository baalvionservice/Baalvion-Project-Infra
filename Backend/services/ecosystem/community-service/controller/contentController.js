'use strict';
// Posting relay: community-service is the ONLY thing that ever calls NodeBB's write surface
// (see nodebbClient.js header). The frontend never gets a NodeBB credential — it calls these
// routes (through its own same-origin community-proxy), which are real RS256-authenticated
// and gated on an actual 'member'-or-higher community role before anything reaches NodeBB.
const { z } = require('zod');
const db = require('../models');
const nodebb = require('../service/nodebbClient');
const { decodeEmailFromRequest } = require('../middleware/authMiddleware');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const createTopicSchema = z.object({ title: z.string().min(3).max(255), content: z.string().min(1).max(20000), type: z.enum(['discussion', 'question']).optional() });
const createReplySchema = z.object({ content: z.string().min(1).max(20000) });
const editPostSchema = z.object({ content: z.string().min(1).max(20000) });
const createFlagSchema = z.object({ reason: z.string().min(1).max(1000) });
const acceptAnswerSchema = z.object({ pid: z.union([z.string(), z.number()]) });

async function loadCommunity(slug) {
    const community = await db.Community.findOne({ where: { slug, is_active: true } });
    if (!community) throw new AppError('NOT_FOUND', 'Community not found', 404);
    if (!community.nodebb_cid) throw new AppError('NOT_CONFIGURED', 'Community is not yet linked to a NodeBB category', 503);
    return community;
}

// Non-free communities require actual membership to READ threads too, not just to post —
// otherwise an anonymous/non-member caller could browse a request_approval/invite_only
// community's content straight through this relay, bypassing the whole point of gating it.
function assertReadAccess(req, community) {
    if (community.access_model === 'free') return;
    if (req.isPlatformAdmin) return;
    const membership = req.communityRoles && req.communityRoles[community.slug];
    if (!membership || !['approved', 'paid'].includes(membership.status)) {
        throw new AppError('FORBIDDEN', 'You are not a member of this community', 403);
    }
}

async function resolveActingUid(req) {
    const email = decodeEmailFromRequest(req);
    const uid = await nodebb.resolveUidByEmail(email);
    if (!uid) throw new AppError('NODEBB_ACCOUNT_NOT_FOUND', 'No linked NodeBB account for this user yet — sign in via the forum once to link it', 409);
    return uid;
}

// Merge platform-owned thread metadata (Q&A type / accepted answer) onto NodeBB topic payloads.
// Any tid with no local row (pre-existing threads, or a lookup race) defaults to a plain
// discussion — never blocks a read on missing metadata.
async function attachThreadMeta(topics) {
    const list = Array.isArray(topics) ? topics : [topics];
    const tids = list.map((t) => t && (t.tid ?? t.topic?.tid)).filter((v) => v != null);
    if (!tids.length) return topics;
    const rows = await db.CommunityThread.findAll({ where: { tid: tids } });
    const byTid = new Map(rows.map((r) => [String(r.tid), r]));
    for (const t of list) {
        const tid = t && (t.tid ?? t.topic?.tid);
        const meta = tid != null ? byTid.get(String(tid)) : null;
        const target = t.topic || t;
        target.threadType = meta ? meta.thread_type : 'discussion';
        target.isAnswered = meta ? meta.is_answered : false;
        target.acceptedPid = meta ? meta.accepted_pid : null;
    }
    return topics;
}

const createTopic = async (req, res, next) => {
    try {
        const parsed = createTopicSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const community = await loadCommunity(req.params.slug);
        const uid = await resolveActingUid(req);
        const result = await nodebb.createTopic(community.nodebb_cid, uid, parsed.data.title, parsed.data.content);
        const tid = result && (result.tid ?? result.topicData?.tid ?? result.topic?.tid);
        if (tid != null) {
            await db.CommunityThread.create({
                tid,
                community_id: community.id,
                thread_type: parsed.data.type || 'discussion',
                author_user_id: req.auth.userId,
            });
        }
        return sendSuccess(req, res, result, 201);
    } catch (err) { return next(err); }
};

const createReply = async (req, res, next) => {
    try {
        const parsed = createReplySchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        await loadCommunity(req.params.slug);
        const uid = await resolveActingUid(req);
        const result = await nodebb.createReply(req.params.tid, uid, parsed.data.content);
        return sendSuccess(req, res, result, 201);
    } catch (err) { return next(err); }
};

// Edit an existing post — author-only. NodeBB's write-api token is admin-privileged and will not
// itself refuse an ownership mismatch, so we independently verify by fetching the topic and
// checking the target post's own uid against the caller's resolved uid BEFORE calling the edit
// endpoint (fail closed on any shape mismatch, never assume ownership).
const editPost = async (req, res, next) => {
    try {
        const parsed = editPostSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        await loadCommunity(req.params.slug);
        const uid = await resolveActingUid(req);
        const topic = await nodebb.getTopic(req.params.tid);
        const posts = (topic && (topic.posts || topic.topic?.posts)) || [];
        const target = posts.find((p) => String(p.pid) === String(req.params.pid));
        if (!target) throw new AppError('NOT_FOUND', 'Post not found in this thread', 404);
        if (String(target.uid) !== String(uid) && !req.isPlatformAdmin) {
            throw new AppError('FORBIDDEN', 'You can only edit your own posts', 403);
        }
        const result = await nodebb.editPost(req.params.pid, uid, parsed.data.content);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

// User-facing report/flag — feeds the SAME NodeBB flags queue the admin console already reviews
// (adminController.js getFlags/resolveFlag). Any community member may report a post.
const createFlag = async (req, res, next) => {
    try {
        const parsed = createFlagSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const community = await loadCommunity(req.params.slug);
        assertReadAccess(req, community);
        const uid = await resolveActingUid(req);
        const result = await nodebb.createFlag(req.params.pid, uid, parsed.data.reason);
        return sendSuccess(req, res, result, 201);
    } catch (err) { return next(err); }
};

// Mark a reply as the accepted answer to a 'question' thread — thread author or a
// moderator/platform-admin only.
const acceptAnswer = async (req, res, next) => {
    try {
        const parsed = acceptAnswerSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const thread = await db.CommunityThread.findByPk(req.params.tid);
        if (!thread) throw new AppError('NOT_FOUND', 'Thread has no recorded metadata', 404);
        const membership = req.communityRoles && req.communityRoles[req.params.slug];
        const isModerator = membership && ['moderator', 'admin'].includes(membership.role);
        if (String(thread.author_user_id) !== String(req.auth.userId) && !isModerator && !req.isPlatformAdmin) {
            throw new AppError('FORBIDDEN', 'Only the thread author or a moderator can accept an answer', 403);
        }
        await thread.update({ is_answered: true, accepted_pid: parsed.data.pid });
        return sendSuccess(req, res, thread.toJSON());
    } catch (err) { return next(err); }
};

// Reads relay through community-service too (rather than the frontend calling NodeBB
// directly) so a single place can later enforce "only show topics from categories this
// caller can actually read" as paid/private tiers come online — see plan MVP scope.
const listThreads = async (req, res, next) => {
    try {
        const community = await loadCommunity(req.params.slug);
        assertReadAccess(req, community);
        const result = await nodebb.getCategoryTopics(community.nodebb_cid);
        const topics = (result && (result.topics || result)) || [];
        await attachThreadMeta(topics);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const getThread = async (req, res, next) => {
    try {
        const community = await loadCommunity(req.params.slug);
        assertReadAccess(req, community);
        const result = await nodebb.getTopic(req.params.tid);
        await attachThreadMeta([result]);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

module.exports = { createTopic, createReply, listThreads, getThread, editPost, createFlag, acceptAnswer };

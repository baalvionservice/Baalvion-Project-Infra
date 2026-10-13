'use strict';
// Forum posts: topics and replies live in this service (see forumService.js).
// Every route is RS256-authenticated and gated on a real 'member'-or-higher community role.
const { z } = require('zod');
const db = require('../models');
const forum = require('../service/forumService');
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

const createTopic = async (req, res, next) => {
    try {
        const parsed = createTopicSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const community = await loadCommunity(req.params.slug);
        return sendSuccess(req, res, await forum.createTopic(community, req.auth.userId, parsed.data), 201);
    } catch (err) { return next(err); }
};

const createReply = async (req, res, next) => {
    try {
        const parsed = createReplySchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const community = await loadCommunity(req.params.slug);
        return sendSuccess(req, res, await forum.createReply(community, req.params.tid, req.auth.userId, parsed.data.content), 201);
    } catch (err) { return next(err); }
};

// Authors edit their own posts; platform admins may edit any.
const editPost = async (req, res, next) => {
    try {
        const parsed = editPostSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const community = await loadCommunity(req.params.slug);
        return sendSuccess(req, res, await forum.editPost(community, req.params.tid, req.params.pid, req.auth.userId, parsed.data.content, req.isPlatformAdmin));
    } catch (err) { return next(err); }
};

// Any member may report a post; reports go to the admin queue.
const createFlag = async (req, res, next) => {
    try {
        const parsed = createFlagSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const community = await loadCommunity(req.params.slug);
        assertReadAccess(req, community);
        return sendSuccess(req, res, await forum.flagPost(community, req.params.tid, req.params.pid, req.auth.userId, parsed.data.reason), 201);
    } catch (err) { return next(err); }
};

// The thread author or a moderator marks a reply as the accepted answer to a question.
const acceptAnswer = async (req, res, next) => {
    try {
        const parsed = acceptAnswerSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const community = await loadCommunity(req.params.slug);
        const thread = await db.ForumTopic.findOne({ where: { id: Number(req.params.tid) || 0, community_id: community.id } });
        if (!thread) throw new AppError('NOT_FOUND', 'Thread not found', 404);
        const membership = req.communityRoles && req.communityRoles[req.params.slug];
        const isModerator = membership && ['moderator', 'admin'].includes(membership.role);
        if (String(thread.author_user_id) !== String(req.auth.userId) && !isModerator && !req.isPlatformAdmin) {
            throw new AppError('FORBIDDEN', 'Only the thread author or a moderator can accept an answer', 403);
        }
        const t = await forum.acceptAnswer(req.params.tid, parsed.data.pid);
        return sendSuccess(req, res, { tid: String(t.id), isAnswered: true, acceptedPid: String(t.accepted_pid) });
    } catch (err) { return next(err); }
};

const listThreads = async (req, res, next) => {
    try {
        const community = await loadCommunity(req.params.slug);
        assertReadAccess(req, community);
        return sendSuccess(req, res, await forum.listTopics(community, req.query));
    } catch (err) { return next(err); }
};

const getThread = async (req, res, next) => {
    try {
        const community = await loadCommunity(req.params.slug);
        assertReadAccess(req, community);
        return sendSuccess(req, res, await forum.getTopic(community, req.params.tid));
    } catch (err) { return next(err); }
};

module.exports = { createTopic, createReply, listThreads, getThread, editPost, createFlag, acceptAnswer };

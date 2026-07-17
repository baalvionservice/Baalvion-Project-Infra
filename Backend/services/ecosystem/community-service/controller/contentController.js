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

const createTopicSchema = z.object({ title: z.string().min(3).max(255), content: z.string().min(1).max(20000) });
const createReplySchema = z.object({ content: z.string().min(1).max(20000) });

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

const createTopic = async (req, res, next) => {
    try {
        const parsed = createTopicSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const community = await loadCommunity(req.params.slug);
        const uid = await resolveActingUid(req);
        const result = await nodebb.createTopic(community.nodebb_cid, uid, parsed.data.title, parsed.data.content);
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

// Reads relay through community-service too (rather than the frontend calling NodeBB
// directly) so a single place can later enforce "only show topics from categories this
// caller can actually read" as paid/private tiers come online — see plan MVP scope.
const listThreads = async (req, res, next) => {
    try {
        const community = await loadCommunity(req.params.slug);
        assertReadAccess(req, community);
        const result = await nodebb.getCategoryTopics(community.nodebb_cid);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const getThread = async (req, res, next) => {
    try {
        const community = await loadCommunity(req.params.slug);
        assertReadAccess(req, community);
        const result = await nodebb.getTopic(req.params.tid);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

module.exports = { createTopic, createReply, listThreads, getThread };

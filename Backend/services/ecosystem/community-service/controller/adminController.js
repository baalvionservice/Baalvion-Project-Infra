'use strict';
const db = require('../models');
const membershipService = require('../service/membershipService');
const identityClient = require('../service/identityClient');
const { sendSuccess } = require('../utils/response');
const { adminSetMemberSchema, decideJoinRequestSchema } = require('../validators/schemas');
const { AppError } = require('../utils/errors');

async function loadCommunity(slug) {
    const community = await db.Community.findOne({ where: { slug, is_active: true } });
    if (!community) throw new AppError('NOT_FOUND', 'Community not found', 404);
    return community;
}

const setMember = async (req, res, next) => {
    try {
        const parsed = adminSetMemberSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const community = await loadCommunity(req.params.slug);
        const targetEmail = await identityClient.getEmailByUserId(req.params.userId);
        const membership = await membershipService.adminSetMember(community, req.params.userId, targetEmail, parsed.data, req.auth.userId);
        return sendSuccess(req, res, membership);
    } catch (err) { return next(err); }
};

const revokeMember = async (req, res, next) => {
    try {
        const community = await loadCommunity(req.params.slug);
        const targetEmail = await identityClient.getEmailByUserId(req.params.userId);
        const membership = await membershipService.adminSetMember(community, req.params.userId, targetEmail, { status: 'cancelled' }, req.auth.userId);
        return sendSuccess(req, res, membership);
    } catch (err) { return next(err); }
};

const moderationLogs = async (req, res, next) => {
    try {
        const community = await loadCommunity(req.params.slug);
        const logs = await membershipService.moderationLogs(community);
        return sendSuccess(req, res, logs);
    } catch (err) { return next(err); }
};

// Cross-community admin console views (see membershipService.listAllPendingJoinRequests /
// allModerationLogs) — gated by requirePlatformAdmin at the route level, not per-community
// moderator role, since this spans every community.
const listAllPendingJoinRequests = async (req, res, next) => {
    try {
        const requests = await membershipService.listAllPendingJoinRequests();
        return sendSuccess(req, res, requests);
    } catch (err) { return next(err); }
};

const decideAnyJoinRequest = async (req, res, next) => {
    try {
        const parsed = decideJoinRequestSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const request = await db.CommunityJoinRequest.findByPk(req.params.requestId);
        if (!request) throw new AppError('NOT_FOUND', 'Join request not found', 404);
        const community = await db.Community.findByPk(request.community_id);
        if (!community) throw new AppError('NOT_FOUND', 'Community not found', 404);
        const targetEmail = await identityClient.getEmailByUserId(request.user_id);
        const decided = await membershipService.decideJoinRequest(
            community, req.params.requestId, req.auth.userId, parsed.data.approve,
            () => Promise.resolve(targetEmail),
        );
        return sendSuccess(req, res, decided);
    } catch (err) { return next(err); }
};

const allModerationLogs = async (req, res, next) => {
    try {
        const logs = await membershipService.allModerationLogs();
        return sendSuccess(req, res, logs);
    } catch (err) { return next(err); }
};

module.exports = { setMember, revokeMember, moderationLogs, listAllPendingJoinRequests, decideAnyJoinRequest, allModerationLogs };

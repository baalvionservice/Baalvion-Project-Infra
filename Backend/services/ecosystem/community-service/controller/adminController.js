'use strict';
const db = require('../models');
const membershipService = require('../service/membershipService');
const identityClient = require('../service/identityClient');
const nodebb = require('../service/nodebbClient');
const moderation = require('../service/moderationService');
const { sendSuccess } = require('../utils/response');
const { adminSetMemberSchema, decideJoinRequestSchema, resolveFlagSchema } = require('../validators/schemas');
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

const listMembers = async (req, res, next) => {
    try {
        const community = await loadCommunity(req.params.slug);
        const members = await membershipService.listMembers(community);
        const withEmail = await Promise.all(members.map(async (m) => ({
            userId: m.user_id,
            email: await identityClient.getEmailByUserId(m.user_id),
            role: m.role,
            status: m.status,
            tier: m.tier,
            createdAt: m.created_at,
        })));
        return sendSuccess(req, res, withEmail);
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

// Reported-content queue (admin.baalvion.com's central "Reports Queue" — see
// forum-sidebar.tsx's note that this was pulled from nav until a real backend existed).
// Flags live in NodeBB, not community-service's own DB, so this reads through nodebbClient
// and enriches each row with the owning community via its nodebb_cid, purely for display —
// unmapped flags (community not found, or NodeBB omitted the category) still show up with
// community: null rather than being dropped.
const listFlags = async (req, res, next) => {
    try {
        const flags = await nodebb.getFlags();
        const communities = await db.Community.findAll({ where: { is_active: true }, attributes: ['slug', 'name', 'nodebb_cid'] });
        const byCid = new Map(communities.filter((c) => c.nodebb_cid != null).map((c) => [c.nodebb_cid, c]));
        const enriched = flags.map((flag) => {
            const cid = flag.target?.category?.cid ?? flag.target?.cid ?? null;
            const community = cid != null ? byCid.get(Number(cid)) : null;
            return {
                flagId: String(flag.flagId ?? flag.id),
                type: flag.type || 'post',
                state: flag.state || 'open',
                reasons: flag.reasons || (flag.description ? [flag.description] : []),
                reporter: flag.reporter ? { username: flag.reporter.username, uid: flag.reporter.uid } : null,
                target: {
                    id: String(flag.targetId ?? flag.target?.pid ?? flag.target?.tid ?? ''),
                    content: flag.target?.content ?? null,
                    title: flag.target?.title ?? flag.target?.topic?.title ?? null,
                    author: flag.target?.user?.username ?? null,
                },
                community: community ? { slug: community.slug, name: community.name } : null,
                createdAt: flag.datetime ? new Date(flag.datetime).toISOString() : null,
            };
        });
        return sendSuccess(req, res, enriched);
    } catch (err) { return next(err); }
};

// 'dismiss' resolves the flag without touching the reported content (false report / no action
// warranted). 'remove' purges the reported post from NodeBB first, then resolves the flag —
// content deletion always implies the flag is handled, never the other way around.
const resolveFlag = async (req, res, next) => {
    try {
        const parsed = resolveFlagSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const { flagId } = req.params;
        const { action } = parsed.data;
        const { pid, communitySlug } = req.body || {};

        if (action === 'remove') {
            if (!pid) throw new AppError('VALIDATION_ERROR', 'pid is required to remove flagged content', 422);
            await nodebb.deletePost(pid);
        }
        await nodebb.updateFlagState(flagId, 'resolved');

        let communityId = null;
        if (communitySlug) {
            const community = await db.Community.findOne({ where: { slug: communitySlug } });
            communityId = community ? community.id : null;
        }
        await moderation.log({
            communityId,
            actorUserId: req.auth.userId,
            action: action === 'remove' ? 'content.removed' : 'flag.dismissed',
            targetEntityType: 'post',
            targetEntityId: pid ? String(pid) : null,
            details: { flagId },
        });

        return sendSuccess(req, res, { flagId, action, state: 'resolved' });
    } catch (err) { return next(err); }
};

module.exports = {
    setMember,
    revokeMember,
    listMembers,
    moderationLogs,
    listAllPendingJoinRequests,
    decideAnyJoinRequest,
    allModerationLogs,
    listFlags,
    resolveFlag,
};

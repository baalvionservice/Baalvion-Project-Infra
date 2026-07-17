'use strict';
const membershipService = require('../service/membershipService');
const { sendSuccess } = require('../utils/response');
const { joinCommunitySchema } = require('../validators/schemas');
const { decodeEmailFromRequest } = require('../middleware/authMiddleware');
const { AppError } = require('../utils/errors');

const listPublicCommunities = async (req, res, next) => {
    try {
        const communities = await membershipService.listCommunities();
        return sendSuccess(req, res, communities.map((c) => ({
            slug: c.slug,
            name: c.name,
            description: c.description,
            accessModel: c.access_model,
            // Platform-wide access tiers (marketplace-access/global-elite/vip-access) are modeled
            // as communities for shared membership/billing plumbing but aren't discussion forums.
            // Frontend uses this to keep the forum hub from listing them as browsable communities.
            isForum: !c.is_platform_tier,
        })));
    } catch (err) { return next(err); }
};

const getCommunity = async (req, res, next) => {
    try {
        const userId = req.auth && req.auth.userId;
        const { community, membership } = await membershipService.getCommunityBySlug(req.params.slug, userId);
        return sendSuccess(req, res, {
            slug: community.slug,
            name: community.name,
            description: community.description,
            accessModel: community.access_model,
            membership: membership ? { role: membership.role, status: membership.status, tier: membership.tier } : null,
        });
    } catch (err) { return next(err); }
};

const joinCommunity = async (req, res, next) => {
    try {
        const parsed = joinCommunitySchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const email = decodeEmailFromRequest(req);
        const { community, membership } = await membershipService.join(req.params.slug, req.auth.userId, email, parsed.data.message);
        return sendSuccess(req, res, { slug: community.slug, membership: { role: membership.role, status: membership.status } }, 201);
    } catch (err) { return next(err); }
};

module.exports = { listPublicCommunities, getCommunity, joinCommunity };

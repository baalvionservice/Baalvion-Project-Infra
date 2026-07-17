'use strict';
const db = require('../models');
const membershipService = require('../service/membershipService');
const { sendSuccess } = require('../utils/response');
const { createInviteSchema } = require('../validators/schemas');
const { decodeEmailFromRequest } = require('../middleware/authMiddleware');
const { AppError } = require('../utils/errors');

async function loadCommunity(slug) {
    const community = await db.Community.findOne({ where: { slug, is_active: true } });
    if (!community) throw new AppError('NOT_FOUND', 'Community not found', 404);
    return community;
}

const createInvite = async (req, res, next) => {
    try {
        const parsed = createInviteSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const community = await loadCommunity(req.params.slug);
        const invite = await membershipService.createInvite(community, req.auth.userId, parsed.data.invitedEmail);
        return sendSuccess(req, res, { token: invite.token, expiresAt: invite.expires_at }, 201);
    } catch (err) { return next(err); }
};

const redeemInvite = async (req, res, next) => {
    try {
        const email = decodeEmailFromRequest(req);
        const { community, membership } = await membershipService.redeemInvite(req.params.token, req.auth.userId, email);
        return sendSuccess(req, res, { slug: community.slug, membership: { role: membership.role, status: membership.status } });
    } catch (err) { return next(err); }
};

module.exports = { createInvite, redeemInvite };

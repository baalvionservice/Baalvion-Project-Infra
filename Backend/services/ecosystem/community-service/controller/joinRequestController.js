'use strict';
const db = require('../models');
const membershipService = require('../service/membershipService');
const identityClient = require('../service/identityClient');
const { sendSuccess } = require('../utils/response');
const { decideJoinRequestSchema } = require('../validators/schemas');
const { AppError } = require('../utils/errors');

async function loadCommunity(slug) {
    const community = await db.Community.findOne({ where: { slug, is_active: true } });
    if (!community) throw new AppError('NOT_FOUND', 'Community not found', 404);
    return community;
}

const listJoinRequests = async (req, res, next) => {
    try {
        const community = await loadCommunity(req.params.slug);
        const requests = await membershipService.listJoinRequests(community, req.query.status || 'pending');
        return sendSuccess(req, res, requests);
    } catch (err) { return next(err); }
};

const decideJoinRequest = async (req, res, next) => {
    try {
        const parsed = decideJoinRequestSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const community = await loadCommunity(req.params.slug);
        const request = await membershipService.decideJoinRequest(
            community, req.params.requestId, req.auth.userId, parsed.data.approve,
            (userId) => identityClient.getEmailByUserId(userId),
        );
        return sendSuccess(req, res, request);
    } catch (err) { return next(err); }
};

module.exports = { listJoinRequests, decideJoinRequest };

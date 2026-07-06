'use strict';
/**
 * Reputation System — HTTP surface (Phase 2 Trust/Verification/Compliance
 * Foundation, Step 14). Ratings are about a counterparty org, not the caller's own
 * — so submission has no "ownership" gate, unlike every other verification module.
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { recordAudit } = require('../utils/audit');
const { actorOf } = require('../service/verification/access');
const reputationSvc = require('../service/verification/reputation');
const { ReputationRating } = db;

const submitRating = async (req, res, next) => {
    try {
        const { ratee_org_id, role, order_id = null, rating_value, response_time_seconds = null, dispute_outcome = null, comment = null, rater_org_id = null } = req.body || {};
        if (!ratee_org_id) return next(new AppError('VALIDATION_ERROR', '`ratee_org_id` is required', 422));
        if (!role || !ReputationRating.ROLES.includes(role)) {
            return next(new AppError('INVALID_ROLE', '`role` is required', 422, { allowed: ReputationRating.ROLES }));
        }
        if (!Number.isInteger(rating_value) || rating_value < 1 || rating_value > 5) {
            return next(new AppError('INVALID_RATING', '`rating_value` must be an integer 1-5', 422));
        }
        const ratee = await db.Organization.findByPk(Number(ratee_org_id));
        if (!ratee) return next(new AppError('ORG_NOT_FOUND', 'Rated organization not found', 404));

        // req.auth.userId isn't guaranteed to be an integer matching trade.users.id —
        // gateway identities can carry an arbitrary external string ID — so only
        // pass it through to the INTEGER FK when it actually parses as one.
        const rawUserId = req.auth && req.auth.userId;
        const raterUserId = /^\d+$/.test(String(rawUserId)) ? Number(rawUserId) : null;

        const rating = await reputationSvc.submitRating({
            ratedOrgId: Number(ratee_org_id), role, tenantId: ratee.tenant_id,
            raterOrgId: rater_org_id ? Number(rater_org_id) : null, raterUserId,
            orderId: order_id, ratingValue: rating_value, responseTimeSeconds: response_time_seconds,
            disputeOutcome: dispute_outcome, comment,
        });
        await recordAudit({
            actorId: actorOf(req), action: 'reputation_rating.submitted', resourceType: 'reputation_rating',
            resourceId: rating.id, tenantId: ratee.tenant_id, metadata: { rateeOrgId: ratee.id, role, ratingValue: rating_value },
        });
        return sendSuccess(req, res, rating, 201);
    } catch (err) {
        return next(err);
    }
};

const listRatings = async (req, res, next) => {
    try {
        const { ratee_org_id, role, page = 1, limit = 20 } = req.query;
        if (!ratee_org_id) return next(new AppError('VALIDATION_ERROR', '`ratee_org_id` query param is required', 422));
        const where = { ratee_org_id: Number(ratee_org_id) };
        if (role) where.role = role;
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await ReputationRating.findAndCountAll({
            where, limit: Number(limit), offset, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

const getSummaries = async (req, res, next) => {
    try {
        const { org_id } = req.query;
        if (!org_id) return next(new AppError('VALIDATION_ERROR', '`org_id` query param is required', 422));
        const rows = await db.ReputationSummary.findAll({ where: { org_id: Number(org_id) } });
        return sendSuccess(req, res, rows);
    } catch (err) {
        return next(err);
    }
};

module.exports = { submitRating, listRatings, getSummaries };

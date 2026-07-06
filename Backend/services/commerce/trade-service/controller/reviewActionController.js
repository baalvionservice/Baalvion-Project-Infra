'use strict';
/**
 * Manual Review Console — HTTP surface (Phase 2 Trust/Verification/Compliance
 * Foundation, Step 15). Admin/reviewer-only throughout (route-level requireRole).
 */
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { recordAudit } = require('../utils/audit');
const { actorOf } = require('../service/verification/access');
const reviewConsole = require('../service/verification/reviewConsole');
const { ReviewAction } = db;

const getQueue = async (req, res, next) => {
    try {
        const { org_id } = req.query;
        const queue = await reviewConsole.getQueue({ orgId: org_id ? Number(org_id) : null });
        return sendSuccess(req, res, queue);
    } catch (err) {
        return next(err);
    }
};

const submitDecision = async (req, res, next) => {
    try {
        const { reviewable_type, reviewable_id, action, notes = null, escalated_to = null, org_id = null, tenant_id = null } = req.body || {};
        if (!reviewable_type || !ReviewAction.REVIEWABLE_TYPES.includes(reviewable_type)) {
            return next(new AppError('INVALID_REVIEWABLE_TYPE', '`reviewable_type` is required', 422, { allowed: ReviewAction.REVIEWABLE_TYPES }));
        }
        if (!action || !ReviewAction.ACTIONS.includes(action)) {
            return next(new AppError('INVALID_ACTION', '`action` is required', 422, { allowed: ReviewAction.ACTIONS }));
        }
        if (!reviewable_id) return next(new AppError('VALIDATION_ERROR', '`reviewable_id` is required', 422));
        if (action === 'escalate' && !escalated_to) return next(new AppError('VALIDATION_ERROR', '`escalated_to` is required for escalate', 422));

        let entry;
        try {
            entry = await reviewConsole.recordDecision({
                reviewableType: reviewable_type, reviewableId: reviewable_id, action, reviewerUserId: actorOf(req),
                notes, escalatedTo: escalated_to, orgId: org_id, tenantId: tenant_id || 'T-DEMO',
            });
        } catch (err) {
            return next(new AppError('REVIEW_FAILED', err.message, 422));
        }

        await recordAudit({
            actorId: actorOf(req), action: `review_console.${action}`, resourceType: reviewable_type,
            resourceId: reviewable_id, tenantId: tenant_id || 'T-DEMO', metadata: { notes, escalatedTo: escalated_to },
        });

        return sendSuccess(req, res, entry, 201);
    } catch (err) {
        return next(err);
    }
};

const getHistory = async (req, res, next) => {
    try {
        const { reviewable_type, reviewable_id } = req.query;
        if (!reviewable_type || !reviewable_id) {
            return next(new AppError('VALIDATION_ERROR', '`reviewable_type` and `reviewable_id` query params are required', 422));
        }
        const rows = await reviewConsole.history(reviewable_type, reviewable_id);
        return sendSuccess(req, res, rows);
    } catch (err) {
        return next(err);
    }
};

module.exports = { getQueue, submitDecision, getHistory };

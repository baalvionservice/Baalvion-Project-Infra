'use strict';
const moderationService = require('../service/moderationService');
const audit = require('../service/auditService');
const { asyncHandler, q } = require('./asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/response');

const act = asyncHandler(async (req, res) => {
    const record = await moderationService.apply({ actor: req.actor }, req.body);
    // Recorded twice on purpose: moderation_actions is the public-facing decision log a
    // person can be shown, audit_logs is the operational trail with request correlation.
    await audit.record(req, {
        action: `moderation.${req.body.action.toLowerCase()}`,
        entityType: req.body.targetType,
        entityId: req.body.targetId,
        metadata: { reason: req.body.reason },
    });
    return sendSuccess(req, res, record, 201);
});

const history = asyncHandler(async (req, res) => {
    const { page, pageSize, targetType, targetId, actorId } = q(req);
    const { items, total } = await moderationService.history({ page, pageSize, targetType, targetId, actorId });
    return sendPaginated(req, res, { items, total, page, pageSize });
});

module.exports = { act, history };

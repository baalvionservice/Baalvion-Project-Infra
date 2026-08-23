'use strict';
const engagementService = require('../service/engagementService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const listPending = async (req, res, next) => {
    try {
        const result = await engagementService.listPendingComments(req.params.websiteId, req.query);
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const moderate = async (req, res, next) => {
    try {
        const comment = await engagementService.moderateComment(
            req.params.websiteId,
            req.params.commentId,
            req.validated.status,
            req.user && req.user.id,
        );
        return sendSuccess(req, res, comment);
    } catch (err) { return next(err); }
};

module.exports = { listPending, moderate };

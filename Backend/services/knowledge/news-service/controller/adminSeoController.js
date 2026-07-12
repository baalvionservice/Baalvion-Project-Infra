'use strict';
const seoAuditService = require('../service/seoAuditService');
const { sendSuccess } = require('../utils/response');

async function getOverview(req, res, next) {
    try {
        const data = await seoAuditService.getAuditOverview(200);
        return sendSuccess(req, res, data);
    } catch (err) {
        return next(err);
    }
}

module.exports = { getOverview };

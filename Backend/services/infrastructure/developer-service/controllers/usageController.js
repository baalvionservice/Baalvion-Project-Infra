'use strict';
const usageService = require('../services/usageService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { orgScope } = require('../middleware/guards');

exports.getUsage = async (req, res) => {
    const orgId = orgScope(req) ?? req.auth?.orgId;
    if (!orgId) throw new AppError('FORBIDDEN', 'Account has no organization to report usage for', 403);
    sendSuccess(req, res, await usageService.getUsageForOrg(orgId));
};

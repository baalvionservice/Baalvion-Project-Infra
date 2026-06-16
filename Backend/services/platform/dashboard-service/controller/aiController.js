'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { computeAi, buildBusinessSummary } = require('../service/aiInsights');

exports.get = async (req, res, next) => {
    try {
        const payload = await computeAi(db, req.user.orgId);
        return sendSuccess(req, res, payload);
    } catch (err) { return next(err); }
};

exports.summary = async (req, res, next) => {
    try {
        const businessId = req.query.businessId || req.params.businessId;
        if (!businessId) return next(new AppError('VALIDATION_ERROR', 'businessId is required', 400));
        const result = await buildBusinessSummary(db, req.user.orgId, businessId);
        if (result.error) return next(new AppError('NOT_FOUND', result.error, 404));
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

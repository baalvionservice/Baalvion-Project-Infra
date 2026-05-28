'use strict';
const metricService = require('../service/metricService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { pushMetricSchema, metricSnapshotQuerySchema } = require('../validators/schemas');

const getSnapshots = async (req, res, next) => {
    try {
        const parsed = metricSnapshotQuerySchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await metricService.getSnapshots(req.user.orgId, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const pushMetric = async (req, res, next) => {
    try {
        const parsed = pushMetricSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await metricService.pushMetric(req.user.orgId, parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

module.exports = { getSnapshots, pushMetric };

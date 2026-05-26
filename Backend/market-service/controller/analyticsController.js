'use strict';
const analyticsService = require('../service/analyticsService');
const { sendSuccess } = require('../utils/response');

const getPerformance = async (req, res, next) => {
    try {
        const data = await analyticsService.getPerformanceStats(req.user.id);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

module.exports = { getPerformance };

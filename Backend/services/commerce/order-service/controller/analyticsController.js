'use strict';
const { sendSuccess } = require('../utils/response');
const analyticsService = require('../service/analyticsService');

const summary = async (req, res, next) => {
    try { return sendSuccess(req, res, await analyticsService.summary(req.params.storeId, req.query)); }
    catch (err) { return next(err); }
};
const topProducts = async (req, res, next) => {
    try { return sendSuccess(req, res, await analyticsService.topProducts(req.params.storeId, req.query, req.query.limit)); }
    catch (err) { return next(err); }
};
const salesByCountry = async (req, res, next) => {
    try { return sendSuccess(req, res, await analyticsService.salesByCountry(req.params.storeId, req.query)); }
    catch (err) { return next(err); }
};
const revenueTimeSeries = async (req, res, next) => {
    try { return sendSuccess(req, res, await analyticsService.revenueTimeSeries(req.params.storeId, req.query, req.query.granularity)); }
    catch (err) { return next(err); }
};

module.exports = { summary, topProducts, salesByCountry, revenueTimeSeries };

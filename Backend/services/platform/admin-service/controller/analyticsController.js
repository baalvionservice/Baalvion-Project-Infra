'use strict';
// admin-service :: analytics controller (READ-ONLY)
//
// Thin HTTP layer over analyticsService. Every handler returns the standard envelope
// { success, data, requestId } via sendSuccess. No mutations → no audit logging (we
// mirror adminController, where only state-changing handlers write audit rows).
//
// Period is validated against the closed set the console sends ('7d'|'30d'|'90d');
// anything else falls back to the service default rather than erroring.

const analyticsService = require('../service/analyticsService');
const { sendSuccess }  = require('../utils/response');

const ALLOWED_PERIODS = ['7d', '30d', '90d'];
function normalizePeriod(raw) {
    return ALLOWED_PERIODS.includes(raw) ? raw : undefined;
}

exports.getKpis = async (req, res, next) => {
    try {
        const data = await analyticsService.getKpis(normalizePeriod(req.query.period));
        sendSuccess(req, res, data);
    } catch (err) { next(err); }
};

exports.getUserGrowth = async (req, res, next) => {
    try {
        const data = await analyticsService.getUserGrowth(normalizePeriod(req.query.period));
        sendSuccess(req, res, data);
    } catch (err) { next(err); }
};

exports.getOrgGrowth = async (req, res, next) => {
    try {
        const data = await analyticsService.getOrgGrowth(normalizePeriod(req.query.period));
        sendSuccess(req, res, data);
    } catch (err) { next(err); }
};

exports.getRevenue = async (req, res, next) => {
    try {
        const data = await analyticsService.getRevenue(normalizePeriod(req.query.period));
        sendSuccess(req, res, data);
    } catch (err) { next(err); }
};

exports.getServiceHealth = async (req, res, next) => {
    try {
        const data = await analyticsService.getServiceHealth();
        sendSuccess(req, res, data);
    } catch (err) { next(err); }
};

exports.getRecentActivity = async (req, res, next) => {
    try {
        const data = await analyticsService.getRecentActivity(req.query.limit);
        sendSuccess(req, res, data);
    } catch (err) { next(err); }
};

exports.getTrafficByPage = async (req, res, next) => {
    try {
        const data = await analyticsService.getTrafficByPage(normalizePeriod(req.query.period));
        sendSuccess(req, res, data);
    } catch (err) { next(err); }
};

'use strict';
/**
 * Compliance Dashboard — HTTP surface (Phase 2 Trust/Verification/Compliance
 * Foundation, Step 16). Admin/reviewer-only (route-level requireRole).
 */
const { sendSuccess } = require('../utils/response');
const dashboardSvc = require('../service/verification/dashboard');

const getDashboard = async (req, res, next) => {
    try {
        const data = await dashboardSvc.getDashboard();
        return sendSuccess(req, res, data);
    } catch (err) {
        return next(err);
    }
};

module.exports = { getDashboard };

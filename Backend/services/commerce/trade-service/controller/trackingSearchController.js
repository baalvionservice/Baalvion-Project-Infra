'use strict';
// Shipment Tracking & Global Visibility Platform — cross-entity tracking search.
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const trackingSearchService = require('../service/tracking-platform/trackingSearchService');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}
function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

const search = async (req, res, next) => {
    try {
        const q = req.query.q;
        if (!q) return next(new AppError('BAD_REQUEST', 'q is required', 400));
        const tenantId = isAdmin(req) ? null : callerTenantId(req);
        const results = await trackingSearchService.search(q, tenantId);
        return sendSuccess(req, res, results);
    } catch (err) { return next(err); }
};

module.exports = { search };

'use strict';
const { loadSubscriptionForUser } = require('../service/entitlementService');
const { sendSuccess } = require('../utils/response');

// INTERNAL — imperialpedia-service is the only owner of the subscriptions/plans tables, so
// every other service (cms-service's publicService.js premium gate) resolves a caller's
// subscription through here rather than querying this schema directly or reimplementing the
// lookup. Deliberately returns the RAW subscription snapshot, not a decideAccess verdict — the
// caller applies the shared @baalvion/entitlements decideAccess itself against its own
// "is this content premium" flag, so this endpoint stays generic and content-type-agnostic
// (any future service with its own premium flag can reuse it unchanged).
const getUserEntitlement = async (req, res, next) => {
    try {
        const subscription = await loadSubscriptionForUser(req.params.userId);
        return sendSuccess(req, res, { subscription });
    } catch (err) { return next(err); }
};

module.exports = { getUserEntitlement };

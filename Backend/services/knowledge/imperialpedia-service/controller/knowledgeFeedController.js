'use strict';
const { buildKnowledgeFeed } = require('../service/knowledgeFeedService');
const { loadSubscriptionForUser, hasDataPackageAccess } = require('../service/entitlementService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const PRIVILEGED_ROLES = ['admin', 'owner', 'super_admin'];
const isPrivilegedCaller = (req) => ((req.auth && req.auth.roles) || []).some((r) => PRIVILEGED_ROLES.includes(r));

// GET /knowledge-feed — the "Global Data Package" bulk API prototype: one unified feed merging
// imperialpedia-service's own articles with cms-service's cms_contents (see
// service/knowledgeFeedService.js for the normalization layer). Requires an active
// tier-enterprise subscription (staff bypass for internal testing/ops) — see
// entitlementService.hasDataPackageAccess for why this is a separate, coarser check from the
// per-article premium gate.
const getKnowledgeFeed = async (req, res, next) => {
    try {
        const isPrivileged = isPrivilegedCaller(req);
        if (!isPrivileged) {
            const userId = req.auth && req.auth.userId;
            const subscription = await loadSubscriptionForUser(userId);
            if (!hasDataPackageAccess(subscription)) {
                return next(new AppError('FORBIDDEN', 'The Global Data Package requires an active Enterprise subscription', 403));
            }
        }

        const feed = await buildKnowledgeFeed({ limit: req.query.limit, offset: req.query.offset });
        return sendSuccess(req, res, feed);
    } catch (err) { return next(err); }
};

module.exports = { getKnowledgeFeed };

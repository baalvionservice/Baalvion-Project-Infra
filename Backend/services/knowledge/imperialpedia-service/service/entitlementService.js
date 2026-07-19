'use strict';

// The decision rule itself (decideAccess) now lives in @baalvion/entitlements — the single
// source of truth shared with cms-service, so the two services can never drift on what "premium"
// means. This file keeps only the DB-backed subscription lookup, which is imperialpedia-service's
// exclusively (it owns the subscriptions/plans tables) — cms-service gets the same data over the
// internal HTTP resolver (routes/v1.js `GET /internal/entitlements/:userId`, controller/
// entitlementInternalController.js) rather than querying this schema directly.
//
// `db` (and everything it drags in — appConfig's requireEnv calls, the Sequelize connection) is
// required lazily inside loadSubscriptionForUser only, so requiring this module to use the pure
// decideAccess() function never needs a database or JWT env vars configured — see
// test/entitlementService.test.js.
const { decideAccess, MIN_PAID_TIER, FREE_TIER } = require('@baalvion/entitlements');

// DB-backed lookup of the caller's active subscription. Returns null for anonymous callers or
// callers with no active subscription (both mean "treat as free tier").
async function loadSubscriptionForUser(userId) {
    if (!userId) return null;
    const db = require('../models');
    const active = await db.Subscription.findOne({
        where: { user_id: userId, status: 'active' },
        include: [{ model: db.Plan, as: 'plan', attributes: ['tier_key'] }],
        order: [['current_period_end', 'DESC']],
    });
    if (!active) return null;
    return {
        status: active.status,
        tierKey: active.plan ? active.plan.tier_key : FREE_TIER,
        currentPeriodEnd: active.current_period_end,
    };
}

// Convenience wrapper combining the DB lookup with the decision for a single article.
async function resolveArticleAccess({ article, userId }) {
    const subscription = await loadSubscriptionForUser(userId);
    return decideAccess({ isPremiumContent: Boolean(article.is_premium), subscription });
}

// A DIFFERENT axis from decideAccess: decideAccess asks "is this one piece of content premium,
// and can this caller read it" (MIN_PAID_TIER='tier-pro'). This asks "is this caller licensed
// for the bulk Global Data Package feed at all" — a coarser, endpoint-level gate that
// deliberately requires the top tier, not just any paid plan. Kept separate rather than adding a
// mode flag to decideAccess, since conflating "per-content paywall" with "bulk API license" would
// make both harder to reason about as the tiers/products diverge further.
const DATA_PACKAGE_TIER = 'tier-enterprise';
function hasDataPackageAccess(subscription) {
    return Boolean(subscription) && subscription.status === 'active' && subscription.tierKey === DATA_PACKAGE_TIER;
}

module.exports = {
    decideAccess, loadSubscriptionForUser, resolveArticleAccess, hasDataPackageAccess,
    MIN_PAID_TIER, FREE_TIER, DATA_PACKAGE_TIER,
};

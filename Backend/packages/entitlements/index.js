'use strict';

// Canonical premium-content entitlement decision — the single source of truth for "does this
// user have paid access". Pure, no I/O: every service resolves its own subscription lookup
// (imperialpedia-service owns the `subscriptions`/`plans` tables) and passes the result in here,
// so the RULE itself lives in exactly one place regardless of how many services enforce it.
//
// Any per-article/per-content tier requirement beyond a plain premium/free split should extend
// this function (e.g. a `requiredTier` input) rather than being reimplemented per service.

const MIN_PAID_TIER = 'tier-pro';
const FREE_TIER = 'tier-free';

// `subscription` is either null (no active subscription — implicitly free) or
// { status, tierKey, currentPeriodEnd }.
function decideAccess({ isPremiumContent, subscription }) {
    const currentTier = subscription ? subscription.tierKey : FREE_TIER;

    if (!isPremiumContent) {
        return { isPremium: false, hasAccess: true, requiredTier: null, currentTier };
    }

    // Defense in depth: current_period_end can lag past 'now' if the cancel/expiry webhook
    // hasn't landed yet — don't trust status alone for a paid gate.
    const notExpired = !subscription || !subscription.currentPeriodEnd || new Date(subscription.currentPeriodEnd) > new Date();
    const hasAccess = Boolean(subscription) && subscription.status === 'active' && subscription.tierKey !== FREE_TIER && notExpired;

    return { isPremium: true, hasAccess, requiredTier: MIN_PAID_TIER, currentTier };
}

module.exports = { decideAccess, MIN_PAID_TIER, FREE_TIER };

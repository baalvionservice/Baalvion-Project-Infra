'use strict';
// Subscription plan catalog — the single source of truth for tiers. Prices are monthly
// (interval_days). Used by the subscription controller (stamp price/period at sign-up),
// the billing worker (renewals), and the public GET /subscriptions/plans endpoint (storefront
// display). Real charging via Razorpay is wired at production.
const PLANS = {
    BASIC: {
        id: 'BASIC', name: 'Basic', price: 0, currency: 'USD', interval_days: 30,
        features: ['Standard Discovery Listing', 'Standard Channel Access', 'Limited Dashboard Analytics'],
    },
    PROFESSIONAL: {
        id: 'PROFESSIONAL', name: 'Professional', price: 49, currency: 'USD', interval_days: 30, recommended: true,
        features: ['Priority Search Ranking', 'Advanced Chambers Analytics', 'Verified Professional Badge', 'Priority Lead Matching'],
    },
    ENTERPRISE: {
        id: 'ENTERPRISE', name: 'Elite', price: 199, currency: 'USD', interval_days: 30,
        features: ['Top-Tier Placement', 'Unlimited Discovery Boost', 'Elite Practitioner Badge', 'Dedicated Concierge'],
    },
};

const PLANS_LIST = Object.values(PLANS);

function planFor(tier) {
    return PLANS[String(tier || '').toUpperCase()] || PLANS.BASIC;
}

module.exports = { PLANS, PLANS_LIST, planFor };

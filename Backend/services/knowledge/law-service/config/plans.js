'use strict';
// Subscription plan catalog. Prices are monthly (interval_days). Used by the
// subscription controller (to stamp price/period at sign-up) and the billing
// worker (to charge renewals). Real charging via Razorpay is wired at production.
const PLANS = {
    BASIC:        { price: 0,   currency: 'USD', interval_days: 30 },
    PROFESSIONAL: { price: 49,  currency: 'USD', interval_days: 30 },
    ENTERPRISE:   { price: 199, currency: 'USD', interval_days: 30 },
};

function planFor(tier) {
    return PLANS[String(tier || '').toUpperCase()] || PLANS.BASIC;
}

module.exports = { PLANS, planFor };

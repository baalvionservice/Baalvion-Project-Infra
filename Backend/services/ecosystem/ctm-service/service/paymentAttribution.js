'use strict';
/**
 * Payment attribution for ControlTheMarket.
 *
 * ControlTheMarket is one property in the Baalvion estate, so every payment this service takes
 * carries the same site id. The rail is derived from the PSP that handled it, and validated
 * against what the registry actually grants this site — a provider we are not permitted to
 * charge on is a configuration error worth failing loudly rather than recording quietly.
 */
const { siteById, isRailAllowed } = require('@baalvion/sites');

const SITE_ID = 'ctm';

// The gateway names this service uses, mapped to the platform's rail vocabulary.
const PROVIDER_RAIL = {
    razorpay: 'razorpay',
    payu: 'payu',
    stripe: 'stripe',
    cashfree: 'cashfree',
    bank: 'bank_transfer',
    bank_transfer: 'bank_transfer',
    crypto: 'crypto',
};

/**
 * Resolve the rail for a provider.
 *
 * Returns the rail the payment ACTUALLY used, never a substitute. Falling back to a rail the
 * site happens to hold would file a Stripe charge under bank_transfer — a number that looks
 * right on the panel and is wrong. A provider we are not granted is logged as the
 * misconfiguration it is and still reported truthfully, so the downstream guard can reject it.
 * An unknown provider returns undefined rather than a guess.
 */
function railFor(provider) {
    const rail = PROVIDER_RAIL[String(provider || '').toLowerCase()];
    if (!rail) {
        console.warn(JSON.stringify({ evt: 'payment_attribution.unknown_provider', provider }));
        return undefined;
    }
    if (!isRailAllowed(SITE_ID, rail)) {
        console.warn(JSON.stringify({ evt: 'payment_attribution.rail_not_granted', provider, rail, siteId: SITE_ID }));
    }
    return rail;
}

function site() {
    return siteById(SITE_ID);
}

module.exports = { SITE_ID, railFor, site };

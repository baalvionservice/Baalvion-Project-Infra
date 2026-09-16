'use strict';
/**
 * Payment attribution for Amarisé Maison Avenue.
 *
 * order-service reports payments through `pclShadow`, but was reporting them with no site, no
 * tenant, no customer and no fee — so every payment from a live store arrived unattributable
 * and the relay refused it outright. This supplies the dimensions.
 *
 * The tenant here is the STORE, not the site: order-service is multi-store, and a payout or a
 * per-store margin question is impossible if the panel only knows the property.
 */
const { siteById, isRailAllowed } = require('@baalvion/sites');

const SITE_ID = 'amarise';

// The gateway names this service uses, mapped to the platform rail vocabulary.
const PROVIDER_RAIL = {
    razorpay: 'razorpay',
    stripe: 'stripe',
    payu: 'payu',
    cashfree: 'cashfree',
    bank: 'bank_transfer',
    bank_transfer: 'bank_transfer',
    crypto: 'crypto',
    mock: undefined, // the non-production provider never reports a real rail
};

/**
 * The rail a payment actually used — never a substitute.
 *
 * Filing a Stripe charge under bank_transfer because the site happens to hold that rail would
 * be a number that looks right and is wrong, so an ungranted rail is reported truthfully and
 * logged as the misconfiguration it is.
 */
function railFor(provider) {
    const key = String(provider || '').toLowerCase();
    const rail = PROVIDER_RAIL[key];
    if (!rail) {
        if (key && key !== 'mock') {
            console.warn(JSON.stringify({ evt: 'payment_attribution.unknown_provider', provider }));
        }
        return undefined;
    }
    if (!isRailAllowed(SITE_ID, rail)) {
        console.warn(JSON.stringify({ evt: 'payment_attribution.rail_not_granted', provider, rail, siteId: SITE_ID }));
    }
    return rail;
}

/**
 * Who paid, for the party graph.
 *
 * An Amarisé shopper's email comes from the order's own customer record. It is marked
 * UNVERIFIED because a checkout email is typed, not proven — so it can never merge two people
 * on its own. `userId`, when the shopper was signed in, is a real platform account and is the
 * strong signal.
 */
function customerSignalFor(customer) {
    if (!customer) return undefined;
    const authUserId = customer.userId != null ? String(customer.userId) : null;
    const email = customer.email || null;
    if (!authUserId && !email) return undefined;
    return {
        authUserId,
        email,
        emailVerified: false,
        name: [customer.firstName, customer.lastName].filter(Boolean).join(' ') || null,
        siteCustomerId: customer.id != null ? String(customer.id) : null,
    };
}

function site() {
    return siteById(SITE_ID);
}

module.exports = { SITE_ID, railFor, customerSignalFor, site };

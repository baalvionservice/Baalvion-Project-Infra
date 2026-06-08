'use strict';
/**
 * ============================================================================
 * REAL PSP adapter — SCAFFOLD ONLY (throws IntegrationRequiredError).
 * ============================================================================
 * A real integration must be implemented against a LICENSED PSP/BaaS and pass
 * `conformance.test.js` with { productionSafe: true }.
 *
 * Vendor options: Stripe Treasury, Nium, Currencycloud, Airwallex.
 *
 * Required configuration (env / secret manager — NEVER hardcode):
 *   PAYMENT_PROVIDER            e.g. 'nium' | 'airwallex' | 'stripe_treasury'
 *   PAYMENT_API_BASE_URL        provider API base
 *   PAYMENT_API_KEY / _SECRET   provider credentials
 *   PAYMENT_CLIENT_ID           (BaaS) onboarded client/program id
 *   PAYMENT_WEBHOOK_SECRET      to verify async settlement callbacks
 *   PAYMENT_RAIL_ROUTING_TABLE  corridor+currency -> rail (SWIFT/SEPA/ACH/UPI/Pix/M-Pesa)
 *
 * Licensing / certification prerequisite:
 *   The operating entity must hold (or rent via the BaaS) the money-transmission
 *   / EMI / PI license for each corridor, complete the PSP's onboarding + KYB,
 *   and pass the provider's production go-live certification. Originating a real
 *   transfer is a regulated act — this scaffold MUST stay throwing until then.
 */
const { IntegrationRequiredError } = require('../IntegrationRequiredError');

const META = {
    domain: 'payment',
    vendorOptions: ['Stripe Treasury', 'Nium', 'Currencycloud', 'Airwallex'],
};

function notConfigured(method) {
    throw new IntegrationRequiredError(`PSP integration not configured (${method})`, META);
}

/** @returns {import('./contract').PaymentProvider} */
function createRealPaymentProvider() {
    return {
        name: 'real-psp-scaffold',
        IS_PRODUCTION_SAFE: false, // flips to true only when a real impl ships + certifies
        async initiate() { return notConfigured('initiate'); },
        async getStatus() { return notConfigured('getStatus'); },
        async cancel() { return notConfigured('cancel'); },
    };
}

module.exports = { createRealPaymentProvider };

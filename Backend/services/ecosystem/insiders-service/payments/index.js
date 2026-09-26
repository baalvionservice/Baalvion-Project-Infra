'use strict';
/**
 * RETIRED — local PSP adapters.
 *
 * This module used to expose razorpay/payu/stripe/crypto adapters. None of them ever talked to
 * a provider: `createOrder` returned a locally generated id (`order_<random hex>`) and the real
 * SDK calls sat commented out behind `// LIVE:`. Verification was worse — PayU, Stripe and
 * crypto each returned true for a *client-supplied* status field, and the browser sent exactly
 * the literal each one looked for. Confirming a payment therefore required no payment.
 *
 * The trap was that it looked one env-var away from working. Dropping real keys in would flip
 * `configured()` to true and leave the client-asserted verification intact — turning a fail-closed
 * demo into free memberships against a live merchant account.
 *
 * The site now uses the same money plane as the other properties: this service holds no PSP
 * keys, checkout relays to the JVM payment-service, and a membership is granted only by
 * service/billingService.js#fulfill on a signed callback for a captured payment.
 *
 * Kept as a loud failure rather than deleted so that any forgotten import fails at the call,
 * with the reason, instead of resolving to undefined.
 */

const RETIRED = 'insiders-service holds no PSP keys. Use service/billingService.js '
    + '(checkout relays to payment-service; fulfilment is a signed server-to-server callback).';

function retired() {
    throw new Error(`[insiders-service] Local payment adapters were retired. ${RETIRED}`);
}

module.exports = {
    get PROVIDERS() { return retired(); },
    getProvider: retired,
    toMinor: retired,
};

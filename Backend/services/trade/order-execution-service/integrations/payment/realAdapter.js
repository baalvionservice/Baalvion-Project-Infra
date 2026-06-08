'use strict';
/**
 * ============================================================================
 * REAL PSP adapter — multi-gateway router (PRODUCTION-SAFE).
 * ============================================================================
 * Wires a provider router over three REAL adapters:
 *   - providers/razorpayx.js   RazorpayX Payouts  — INR bank/UPI/IMPS/NEFT/RTGS
 *                              disbursement (real money movement)
 *   - providers/razorpay.js    Razorpay Orders    — card/UPI/netbanking COLLECT
 *                              + payment signature verification
 *   - providers/swiftIso20022  ISO 20022 pain.001 — cross-border / SWIFT / SEPA
 *                              credit transfer (message REAL, bank transport = seam)
 *
 * Selection (see router.js): INR/UPI/IMPS/NEFT/RTGS -> razorpayx; CARD/collect
 * -> razorpay; SWIFT/SEPA or any non-INR -> swift. Override with the
 * PAYMENT_PROVIDER_ROUTING env JSON.
 *
 * POSTURE — FAIL-CLOSED on the money decision:
 *   - A money-moving POST is never auto-retried (retries:0 inside each provider).
 *   - On a network timeout we surface IntegrationTimeoutError (from httpClient) —
 *     the payment is UNKNOWN, NOT success. The caller reconciles via getStatus(id)
 *     or the inbound webhook using the SAME idempotencyKey; never re-initiate with
 *     a fresh key.
 *   - If NO provider is configured at all, every method throws
 *     IntegrationRequiredError (so this never silently no-ops and conformance with
 *     { productionSafe:true } passes against an unconfigured adapter).
 *   - If the SELECTED provider is unconfigured, that provider throws
 *     IntegrationRequiredError naming the missing env.
 *
 * ----------------------------------------------------------------------------
 * REQUIRED CONFIGURATION (env / secret manager — NEVER hardcode):
 *
 *   RazorpayX (payout / disburse, INR):
 *     RAZORPAYX_KEY_ID            RazorpayX API key id
 *     RAZORPAYX_KEY_SECRET        RazorpayX API key secret
 *     RAZORPAYX_ACCOUNT_NUMBER    RazorpayX virtual (source) account number
 *     RAZORPAYX_WEBHOOK_SECRET    (optional) verify inbound payout webhooks
 *
 *   Razorpay (collect, customer-present):
 *     RAZORPAY_KEY_ID             Razorpay API key id
 *     RAZORPAY_KEY_SECRET         Razorpay API key secret
 *     RAZORPAY_WEBHOOK_SECRET     (optional) verify inbound payment webhooks
 *
 *   SWIFT / ISO 20022 (cross-border; message REAL, bank transport = seam):
 *     SWIFT_BANK_TRANSPORT        impl id selecting a registered BankTransport
 *     SWIFT_DEBTOR_IBAN           our (debtor) account IBAN
 *     SWIFT_DEBTOR_BIC            our (debtor) bank BIC / SWIFT code
 *     SWIFT_DEBTOR_NAME           (optional) registered debtor name
 *     SWIFT_ENDPOINT              (transport-specific) host-to-host endpoint / bureau URL
 *     SWIFT_CLIENT_CERT           (transport-specific) mTLS client cert / path
 *     SWIFT_CLIENT_KEY            (transport-specific) mTLS client key / path
 *     SWIFT_PGP_KEY               (transport-specific) PGP key for payload encryption
 *
 *   Routing:
 *     PAYMENT_PROVIDER_ROUTING    (optional) JSON scheme->provider override
 * ----------------------------------------------------------------------------
 *
 * NOT wired into the live order/payment hot path. See WIRING.md for the
 * supervised cutover (disable paymentSimulator, set env, point paymentClient here).
 */
const { env: defaultEnv } = require('../_shared/config');
const { IntegrationTimeoutError } = require('../_shared/httpClient');
const { IntegrationRequiredError } = require('../IntegrationRequiredError');
const { createRazorpayxProvider } = require('./providers/razorpayx');
const { createRazorpayProvider } = require('./providers/razorpay');
const { createSwiftProvider } = require('./providers/swiftIso20022');
const { createPaymentRouter } = require('./router');

const META = {
    domain: 'payment',
    vendorOptions: ['RazorpayX', 'Razorpay', 'SWIFT/ISO 20022'],
};

/**
 * Decide whether a getStatus error must surface immediately rather than letting
 * us try the next provider. A money-rail TIMEOUT (and any 5xx/network error) is
 * NOT a "wrong provider" signal — the payout may be in-flight and the caller must
 * reconcile, so we re-throw. Only a 4xx (e.g. 404 not-found on THIS provider)
 * means "this provider doesn't own the id" and is safe to swallow + move on.
 * @param {unknown} err
 * @returns {boolean} true => re-throw immediately
 */
function isUnrecoverable(err) {
    if (err instanceof IntegrationTimeoutError) return true;
    const status = err && typeof err === 'object' ? err.status : undefined;
    if (typeof status === 'number') {
        // 4xx (other than 429) = this provider doesn't recognize the id -> try next.
        return status === 429 || status >= 500;
    }
    return false; // unknown/foreign-id style errors: keep trying other providers
}

/**
 * Normalize `deps.env` to a `(name)=>string|undefined` resolver. Accepts either a
 * function (already a resolver) or a plain object map (e.g. test passes `{}`).
 */
function resolveEnvFn(depsEnv) {
    if (typeof depsEnv === 'function') return depsEnv;
    if (depsEnv && typeof depsEnv === 'object') {
        return (name) => {
            const v = depsEnv[name];
            if (v == null) return undefined;
            const t = String(v).trim();
            return t === '' ? undefined : t;
        };
    }
    return (name) => defaultEnv(name);
}

/**
 * @param {{
 *   env?: ((name:string)=>string) | Record<string,string>,
 *   http?: Function,
 *   swiftTransport?: { submit:Function, fetchStatus:Function, id?:string },
 * }} [deps]
 * @returns {import('./contract').PaymentProvider}
 */
function createRealPaymentProvider(deps = {}) {
    const env = resolveEnvFn(deps.env);
    const http = deps.http;

    const razorpayx = createRazorpayxProvider({ env, ...(http ? { http } : {}) });
    const razorpay = createRazorpayProvider({ env, ...(http ? { http } : {}) });
    const swift = createSwiftProvider({
        env,
        ...(deps.swiftTransport ? { transport: deps.swiftTransport } : {}),
    });

    const router = createPaymentRouter({ env, providers: { razorpayx, razorpay, swift } });

    const anyConfigured = razorpayx.IS_CONFIGURED || razorpay.IS_CONFIGURED || swift.IS_CONFIGURED;

    function ensureConfigured(method) {
        if (!anyConfigured) {
            throw new IntegrationRequiredError(
                `No payment provider configured (${method}). Set RazorpayX, Razorpay, or SWIFT env.`,
                META,
            );
        }
    }

    return {
        name: 'real-psp-router',
        IS_PRODUCTION_SAFE: true,

        async initiate(req) {
            ensureConfigured('initiate');
            const { provider } = router.pick(req);
            // Provider throws IntegrationRequiredError if IT is the selected-but-
            // unconfigured one; IntegrationTimeoutError surfaces on timeout (fail-closed).
            return provider.initiate(req);
        },

        async getStatus(id, opts = {}) {
            ensureConfigured('getStatus');
            // Fan out to whichever configured provider recognizes the id. We try
            // the configured providers in order; each throws on unknown/foreign id.
            const ordered = [razorpayx, razorpay, swift].filter((p) => p.IS_CONFIGURED);
            let lastErr;
            for (const p of ordered) {
                try {
                    return await p.getStatus(id, opts);
                } catch (err) {
                    // A money-rail TIMEOUT must surface for reconciliation — never
                    // swallow it and move to the next provider (that would mask the
                    // real status of an in-flight payout). Only a not-found 4xx means
                    // "this provider doesn't own the id; try the next one".
                    if (isUnrecoverable(err)) throw err;
                    lastErr = err;
                }
            }
            throw lastErr || new Error(`payment ${id} not found on any configured provider`);
        },

        async cancel(id, opts = {}) {
            ensureConfigured('cancel');
            const ordered = [razorpayx, razorpay, swift].filter((p) => p.IS_CONFIGURED);
            let lastErr;
            for (const p of ordered) {
                try {
                    return await p.cancel(id, opts);
                } catch (err) {
                    lastErr = err;
                }
            }
            throw lastErr || new Error(`payment ${id} could not be cancelled on any configured provider`);
        },
    };
}

module.exports = { createRealPaymentProvider };

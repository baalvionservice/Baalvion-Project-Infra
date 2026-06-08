'use strict';
/**
 * ============================================================================
 * Multi-gateway payment router
 * ============================================================================
 * Selects the right real provider per payment by scheme + currency:
 *   - UPI / IMPS / NEFT / RTGS, or any INR payout  -> razorpayx (disburse)
 *   - card / netbanking collect (CARD / COLLECT)   -> razorpay   (collect)
 *   - SWIFT / SEPA, or any non-INR cross-border    -> swift      (ISO 20022)
 *
 * The mapping is overridable via PAYMENT_PROVIDER_ROUTING (JSON), e.g.:
 *   {"UPI":"razorpayx","CARD":"razorpay","SWIFT":"swift","SEPA":"swift"}
 * Currency still wins for cross-border: a non-INR amount never routes to the
 * INR-only RazorpayX payout rail.
 *
 * The router does NOT itself move money — it picks a provider instance. The
 * chosen rail/providerRef is surfaced on the returned PaymentResult by each
 * provider.
 */
const { env: defaultEnv } = require('../_shared/config');
const { PAYMENT_RAIL } = require('./contract');

const SCHEME_TO_PROVIDER = Object.freeze({
    UPI: 'razorpayx',
    IMPS: 'razorpayx',
    NEFT: 'razorpayx',
    RTGS: 'razorpayx',
    [PAYMENT_RAIL.UPI]: 'razorpayx',
    CARD: 'razorpay',
    COLLECT: 'razorpay',
    NETBANKING: 'razorpay',
    SWIFT: 'swift',
    SEPA: 'swift',
    [PAYMENT_RAIL.SWIFT]: 'swift',
    [PAYMENT_RAIL.SEPA]: 'swift',
});

/** The only provider keys an override may legitimately target. */
const VALID_PROVIDER_KEYS = Object.freeze(['razorpayx', 'razorpay', 'swift']);

/**
 * Parse PAYMENT_PROVIDER_ROUTING and CONSTRAIN it to the closed set of known
 * provider keys. An operator typo (e.g. {"CARD":"nonexistent"}) must never be
 * passed through to `providers[key]` — that would resolve to an undefined
 * provider. Any entry whose value isn't a known provider is dropped (warned to
 * stderr) so routing falls back to the default for that scheme.
 */
function parseRoutingOverride(env) {
    const raw = env('PAYMENT_PROVIDER_ROUTING');
    if (!raw) return undefined;
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return undefined; // malformed override is ignored — fall back to defaults
    }
    if (!parsed || typeof parsed !== 'object') return undefined;

    const sanitized = {};
    for (const [scheme, value] of Object.entries(parsed)) {
        if (VALID_PROVIDER_KEYS.includes(value)) {
            sanitized[scheme] = value;
        } else {
            // Worker-level warn to stderr — drop the bad mapping (no console.log).
            console.warn(
                `[payment.router] ignoring PAYMENT_PROVIDER_ROUTING override ${scheme}=${JSON.stringify(value)}: not one of ${VALID_PROVIDER_KEYS.join(', ')}`,
            );
        }
    }
    return Object.keys(sanitized).length ? sanitized : undefined;
}

/**
 * Decide which provider key handles a request. Pure function (no I/O).
 * @param {import('./contract').PaymentInitiateRequest} req
 * @param {(name:string)=>string} env
 * @returns {'razorpayx'|'razorpay'|'swift'}
 */
function selectProviderKey(req, env) {
    const currency = String(req.currency || '').toUpperCase();
    const scheme = String(req.paymentScheme || '').toUpperCase();
    const override = parseRoutingOverride(env) || {};

    // Currency rule first: non-INR is never an INR payout (RazorpayX) — route
    // cross-border to SWIFT unless an explicit override targets a non-INR rail.
    if (currency && currency !== 'INR') {
        if (override[scheme] && override[scheme] !== 'razorpayx') return override[scheme];
        return 'swift';
    }

    if (override[scheme]) return override[scheme];
    if (SCHEME_TO_PROVIDER[scheme]) return SCHEME_TO_PROVIDER[scheme];

    // INR (or unspecified currency) with no scheme -> default to payout rail.
    return 'razorpayx';
}

/**
 * Build a router over the three provider instances.
 * @param {{
 *   providers: { razorpayx:any, razorpay:any, swift:any },
 *   env?: (name:string)=>string,
 * }} cfg
 */
function createPaymentRouter(cfg) {
    const env = cfg.env ? (name) => cfg.env(name) : (name) => defaultEnv(name);
    const providers = cfg.providers;

    function pick(req) {
        const key = selectProviderKey(req, env);
        const provider = providers[key];
        if (!provider) {
            const err = new Error(`no payment provider registered for '${key}'`);
            err.code = 'NO_PROVIDER';
            throw err;
        }
        return { key, provider };
    }

    return { pick, selectProviderKey: (req) => selectProviderKey(req, env) };
}

module.exports = {
    createPaymentRouter,
    selectProviderKey,
    SCHEME_TO_PROVIDER,
    parseRoutingOverride,
    VALID_PROVIDER_KEYS,
};

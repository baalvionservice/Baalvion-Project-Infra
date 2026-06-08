'use strict';
/**
 * ============================================================================
 * RazorpayX Payouts adapter — REAL money movement (bank / UPI / IMPS / NEFT / RTGS)
 * ============================================================================
 * This is a FULLY-REAL adapter: with valid RazorpayX credentials it originates
 * real INR payouts onto Indian rails. It is the disbursement (payout) rail —
 * money leaves the RazorpayX virtual account to a fund_account_id.
 *
 * API: https://razorpay.com/docs/api/x/payouts/
 *   Base    https://api.razorpay.com/v1
 *   Auth    HTTP Basic  base64("<key_id>:<key_secret>")
 *
 * Required configuration (env / secret manager — NEVER hardcode):
 *   RAZORPAYX_KEY_ID            RazorpayX API key id
 *   RAZORPAYX_KEY_SECRET        RazorpayX API key secret
 *   RAZORPAYX_ACCOUNT_NUMBER    the RazorpayX virtual (source) account number
 *   RAZORPAYX_WEBHOOK_SECRET    (optional) verify inbound payout webhooks
 *
 * Posture: FAIL-CLOSED. A POST /payouts is a money-moving call, so it is NEVER
 * auto-retried (retries:0). On a timeout we surface IntegrationTimeoutError — the
 * caller reconciles via getStatus(id) / the webhook using the SAME idempotencyKey
 * (reference_id + X-Payout-Idempotency header), never a fresh key.
 *
 * Idempotency: RazorpayX supports a per-payout idempotency key via the
 * `X-Payout-Idempotency` request header; we also stamp reference_id with the
 * caller idempotencyKey for end-to-end reconciliation.
 */
const { request, IntegrationTimeoutError } = require('../../_shared/httpClient');
const { env: defaultEnv } = require('../../_shared/config');
const { IntegrationRequiredError } = require('../../IntegrationRequiredError');
const { PAYMENT_STATUS, PAYMENT_RAIL } = require('../contract');

const BASE_URL = 'https://api.razorpay.com/v1';
const REQUIRED = ['RAZORPAYX_KEY_ID', 'RAZORPAYX_KEY_SECRET', 'RAZORPAYX_ACCOUNT_NUMBER'];
const META = { domain: 'payment', vendorOptions: ['RazorpayX'] };

/** Map a PAYMENT_RAIL scheme to a RazorpayX payout `mode`. */
const SCHEME_TO_MODE = Object.freeze({
    UPI: 'UPI',
    IMPS: 'IMPS',
    NEFT: 'NEFT',
    RTGS: 'RTGS',
    [PAYMENT_RAIL.UPI]: 'UPI',
});

/**
 * RazorpayX payout status -> normalized PAYMENT_STATUS.
 * Ref: payout lifecycle queued -> pending -> processing -> processed (terminal),
 * with reversed / cancelled / rejected / failed terminal failure states and
 * on_hold (compliance) non-terminal.
 */
const STATUS_MAP = Object.freeze({
    queued: PAYMENT_STATUS.PENDING,
    pending: PAYMENT_STATUS.PENDING,
    processing: PAYMENT_STATUS.PROCESSING,
    processed: PAYMENT_STATUS.COMPLETED,
    reversed: PAYMENT_STATUS.FAILED, // money came back — treat as failed, reason 'reversed'
    cancelled: PAYMENT_STATUS.CANCELLED,
    rejected: PAYMENT_STATUS.FAILED,
    failed: PAYMENT_STATUS.FAILED,
    on_hold: PAYMENT_STATUS.HELD,
});

/** @param {string} vendorStatus @returns {keyof typeof PAYMENT_STATUS} */
function mapStatus(vendorStatus) {
    const mapped = STATUS_MAP[String(vendorStatus || '').toLowerCase()];
    if (!mapped) return PAYMENT_STATUS.PROCESSING; // unknown -> non-terminal, never assume success
    return mapped;
}

/** Convert a major-unit decimal amount to integer minor units (paise). */
function toPaise(amount) {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
        const err = new Error(`razorpayx: invalid amount ${amount}`);
        err.code = 'INVALID_AMOUNT';
        throw err;
    }
    // Round to avoid binary float drift (e.g. 19.99 * 100 = 1998.9999...).
    return Math.round(amount * 100);
}

function basicAuthHeader(keyId, keySecret) {
    const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    return `Basic ${token}`;
}

/**
 * @param {{ env?: (name:string)=>string, http?: typeof request }} [deps]
 * @returns {import('../contract').PaymentProvider & {
 *   IS_CONFIGURED: boolean,
 *   supportsCurrency: (c:string)=>boolean,
 * }}
 */
function createRazorpayxProvider(deps = {}) {
    // `env(name)` resolves a single var; injected for tests, else reads process.env.
    const env = deps.env ? (name) => deps.env(name) : (name) => defaultEnv(name);
    const http = deps.http || request;

    const configured = REQUIRED.every((n) => env(n) !== undefined);

    function creds() {
        const keyId = env('RAZORPAYX_KEY_ID');
        const keySecret = env('RAZORPAYX_KEY_SECRET');
        const accountNumber = env('RAZORPAYX_ACCOUNT_NUMBER');
        if (!keyId || !keySecret || !accountNumber) {
            throw new IntegrationRequiredError(
                `RazorpayX not configured (missing ${REQUIRED.filter((n) => !env(n)).join(', ')})`,
                META,
            );
        }
        return { keyId, keySecret, accountNumber };
    }

    function authHeaders(extra = {}) {
        const { keyId, keySecret } = creds();
        return {
            Authorization: basicAuthHeader(keyId, keySecret),
            'Content-Type': 'application/json',
            ...extra,
        };
    }

    /** Normalize a RazorpayX payout object to a PaymentResult. */
    function toResult(payout, req) {
        const status = mapStatus(payout.status);
        const result = {
            id: payout.id,
            idempotencyKey: payout.reference_id || (req && req.idempotencyKey),
            status,
            amount: typeof payout.amount === 'number' ? payout.amount / 100 : (req && req.amount),
            currency: payout.currency || (req && req.currency) || 'INR',
            rail: payout.mode || (req && req.paymentScheme) || PAYMENT_RAIL.UPI,
            providerRef: payout.utr || payout.id,
        };
        if (status === PAYMENT_STATUS.FAILED) {
            const lower = String(payout.status || '').toLowerCase();
            result.failureReason = lower === 'reversed'
                ? 'reversed'
                : (payout.failure_reason || payout.status_details?.reason || lower || 'failed');
        }
        return result;
    }

    return {
        name: 'razorpayx',
        IS_PRODUCTION_SAFE: true,
        IS_CONFIGURED: configured,

        supportsCurrency(currency) {
            return String(currency || '').toUpperCase() === 'INR';
        },

        async initiate(req) {
            if (!req || !req.idempotencyKey) throw new Error('idempotencyKey required');
            const { accountNumber } = creds();

            if (String(req.currency || '').toUpperCase() !== 'INR') {
                const err = new Error(`razorpayx only settles INR, got ${req.currency}`);
                err.code = 'UNSUPPORTED_CURRENCY';
                throw err;
            }

            const mode = SCHEME_TO_MODE[req.paymentScheme] || 'IMPS';
            const fundAccountId = req.destinationAccountId;
            if (!fundAccountId) {
                const err = new Error('razorpayx: destinationAccountId (fund_account_id) required');
                err.code = 'MISSING_FUND_ACCOUNT';
                throw err;
            }

            const body = JSON.stringify({
                account_number: req.sourceAccountId || accountNumber,
                fund_account_id: fundAccountId,
                amount: toPaise(req.amount),
                currency: 'INR',
                mode,
                purpose: 'payout',
                queue_if_low_balance: true,
                reference_id: req.idempotencyKey,
                narration: String(req.metadata?.narration || '').slice(0, 30) || 'GTI order payout',
            });

            try {
                const { json } = await http({
                    url: `${BASE_URL}/payouts`,
                    method: 'POST',
                    headers: authHeaders({ 'X-Payout-Idempotency': req.idempotencyKey }),
                    body,
                    retries: 0, // money-moving POST — never auto-retry
                });
                return toResult(json, req);
            } catch (err) {
                // Fail-closed: a timeout means UNKNOWN, NOT success. Surface so the
                // caller reconciles via getStatus/webhook with the same key.
                if (err instanceof IntegrationTimeoutError) throw err;
                throw err;
            }
        },

        async getStatus(id) {
            if (!id) throw new Error('payment id required');
            const { json } = await http({
                url: `${BASE_URL}/payouts/${encodeURIComponent(id)}`,
                method: 'GET',
                headers: authHeaders(),
                retries: 2, // read is safe to retry
            });
            return toResult(json);
        },

        async cancel(id) {
            if (!id) throw new Error('payment id required');
            // Only valid while the payout is queued; RazorpayX rejects otherwise.
            const { json } = await http({
                url: `${BASE_URL}/payouts/${encodeURIComponent(id)}/cancel`,
                method: 'POST',
                headers: authHeaders(),
                retries: 0,
            });
            return toResult(json);
        },
    };
}

module.exports = {
    createRazorpayxProvider,
    toPaise,
    mapStatus,
    STATUS_MAP,
    SCHEME_TO_MODE,
    BASE_URL,
    REQUIRED,
};

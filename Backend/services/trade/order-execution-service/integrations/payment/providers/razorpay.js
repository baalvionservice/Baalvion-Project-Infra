'use strict';
/**
 * ============================================================================
 * Razorpay Orders adapter — customer-present COLLECT rail (card / UPI / netbanking)
 * ============================================================================
 * This is the inbound (collect) rail: it creates a Razorpay Order the customer
 * pays against on the client, then the server verifies the payment signature
 * before treating the money as received. Use this when the order saga collects
 * from the buyer (as opposed to RazorpayX which disburses).
 *
 * API: https://razorpay.com/docs/api/orders/
 *   Base    https://api.razorpay.com/v1
 *   Auth    HTTP Basic  base64("<key_id>:<key_secret>")
 *
 * Required configuration (env / secret manager — NEVER hardcode):
 *   RAZORPAY_KEY_ID            Razorpay API key id
 *   RAZORPAY_KEY_SECRET        Razorpay API key secret
 *
 * Payment signature verification (the security-critical step):
 *   Razorpay returns razorpay_order_id, razorpay_payment_id, razorpay_signature
 *   to the client on success. The server MUST recompute
 *     HMAC_SHA256("<order_id>|<payment_id>", key_secret)  (hex)
 *   and constant-time compare it to razorpay_signature. Only then is the payment
 *   authentic. A payment is COMPLETED only when this verify passes AND the
 *   payment/order status is captured/paid — FAIL-CLOSED otherwise.
 */
const { request } = require('../../_shared/httpClient');
const { hmacSha256Hex, timingSafeEqualStr } = require('../../_shared/signature');
const { env: defaultEnv } = require('../../_shared/config');
const { IntegrationRequiredError } = require('../../IntegrationRequiredError');
const { PAYMENT_STATUS, PAYMENT_RAIL } = require('../contract');

const BASE_URL = 'https://api.razorpay.com/v1';
const REQUIRED = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
const META = { domain: 'payment', vendorOptions: ['Razorpay'] };

/**
 * Razorpay order/payment status -> normalized PAYMENT_STATUS.
 * Order:   created -> attempted -> paid
 * Payment: created -> authorized -> captured | refunded | failed
 */
const STATUS_MAP = Object.freeze({
    // order statuses
    created: PAYMENT_STATUS.PENDING,
    attempted: PAYMENT_STATUS.PROCESSING,
    paid: PAYMENT_STATUS.COMPLETED,
    // payment statuses
    authorized: PAYMENT_STATUS.PROCESSING, // authorized but not yet captured
    captured: PAYMENT_STATUS.COMPLETED,
    refunded: PAYMENT_STATUS.FAILED,
    failed: PAYMENT_STATUS.FAILED,
});

/** @param {string} vendorStatus @returns {keyof typeof PAYMENT_STATUS} */
function mapStatus(vendorStatus) {
    const mapped = STATUS_MAP[String(vendorStatus || '').toLowerCase()];
    return mapped || PAYMENT_STATUS.PROCESSING; // unknown -> non-terminal
}

const MAX_NOTE_KEYS = 15;       // Razorpay caps notes at 15 keys
const MAX_NOTE_VALUE_LEN = 256; // keep each value bounded

/**
 * Build a safe `notes` object from caller metadata. Razorpay notes must be flat
 * string/number maps. We coerce primitives to bounded strings, DROP non-primitive
 * values (objects/arrays/functions), cap the number of keys, and NEVER let a
 * caller-supplied `idempotencyKey` note survive (the real one is stamped by the
 * caller after this returns). Avoids JSON.stringify throwing on circular refs.
 * @param {unknown} metadata
 * @returns {Record<string,string>}
 */
function sanitizeNotes(metadata) {
    const out = {};
    if (!metadata || typeof metadata !== 'object') return out;
    let count = 0;
    for (const [key, value] of Object.entries(metadata)) {
        if (count >= MAX_NOTE_KEYS) break;
        if (key === 'idempotencyKey') continue; // never let metadata override the real key
        if (typeof value !== 'string' && typeof value !== 'number') continue;
        if (typeof value === 'number' && !Number.isFinite(value)) continue;
        out[key] = String(value).slice(0, MAX_NOTE_VALUE_LEN);
        count += 1;
    }
    return out;
}

function toPaise(amount) {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
        const err = new Error(`razorpay: invalid amount ${amount}`);
        err.code = 'INVALID_AMOUNT';
        throw err;
    }
    return Math.round(amount * 100);
}

function basicAuthHeader(keyId, keySecret) {
    return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
}

/**
 * @param {{ env?: (name:string)=>string, http?: typeof request }} [deps]
 * @returns {import('../contract').PaymentProvider & {
 *   IS_CONFIGURED: boolean,
 *   verifyPaymentSignature: (args:{orderId:string,paymentId:string,signature:string})=>boolean,
 * }}
 */
function createRazorpayProvider(deps = {}) {
    const env = deps.env ? (name) => deps.env(name) : (name) => defaultEnv(name);
    const http = deps.http || request;
    const configured = REQUIRED.every((n) => env(n) !== undefined);

    function creds() {
        const keyId = env('RAZORPAY_KEY_ID');
        const keySecret = env('RAZORPAY_KEY_SECRET');
        if (!keyId || !keySecret) {
            throw new IntegrationRequiredError(
                `Razorpay not configured (missing ${REQUIRED.filter((n) => !env(n)).join(', ')})`,
                META,
            );
        }
        return { keyId, keySecret };
    }

    function authHeaders() {
        const { keyId, keySecret } = creds();
        return {
            Authorization: basicAuthHeader(keyId, keySecret),
            'Content-Type': 'application/json',
        };
    }

    function toResult(order, req) {
        return {
            id: order.id,
            idempotencyKey: order.receipt || (req && req.idempotencyKey),
            status: mapStatus(order.status),
            amount: typeof order.amount === 'number' ? order.amount / 100 : (req && req.amount),
            currency: order.currency || (req && req.currency),
            rail: PAYMENT_RAIL.INTERNAL === req?.paymentScheme ? PAYMENT_RAIL.INTERNAL : 'razorpay-collect',
            providerRef: order.id,
        };
    }

    return {
        name: 'razorpay',
        IS_PRODUCTION_SAFE: true,
        IS_CONFIGURED: configured,

        async initiate(req) {
            if (!req || !req.idempotencyKey) throw new Error('idempotencyKey required');
            creds(); // throws IntegrationRequiredError if unconfigured
            const body = JSON.stringify({
                amount: toPaise(req.amount),
                currency: String(req.currency || 'INR').toUpperCase(),
                receipt: req.idempotencyKey,
                notes: {
                    ...sanitizeNotes(req.metadata),
                    // stamped LAST so a metadata.idempotencyKey can never override it
                    idempotencyKey: req.idempotencyKey,
                },
            });
            const { json } = await http({
                url: `${BASE_URL}/orders`,
                method: 'POST',
                headers: authHeaders(),
                body,
                retries: 0,
            });
            return toResult(json, req);
        },

        async getStatus(id) {
            if (!id) throw new Error('order id required');
            const { json } = await http({
                url: `${BASE_URL}/orders/${encodeURIComponent(id)}`,
                method: 'GET',
                headers: authHeaders(),
                retries: 2,
            });
            return toResult(json);
        },

        async cancel(id) {
            // Razorpay orders cannot be cancelled via API once created; the order
            // simply expires unpaid. Report current status (fail-closed, not paid).
            return this.getStatus(id);
        },

        /**
         * Verify a client-returned Razorpay payment signature.
         * signature = HMAC_SHA256(`${orderId}|${paymentId}`, key_secret) hex.
         * @returns {boolean} true iff authentic (constant-time compare).
         */
        verifyPaymentSignature({ orderId, paymentId, signature }) {
            if (!orderId || !paymentId || !signature) return false;
            const { keySecret } = creds();
            const expected = hmacSha256Hex(keySecret, `${orderId}|${paymentId}`);
            return timingSafeEqualStr(expected, signature);
        },
    };
}

module.exports = {
    createRazorpayProvider,
    toPaise,
    mapStatus,
    sanitizeNotes,
    STATUS_MAP,
    BASE_URL,
    REQUIRED,
};

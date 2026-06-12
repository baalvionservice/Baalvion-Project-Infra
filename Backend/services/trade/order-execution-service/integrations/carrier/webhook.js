'use strict';
/**
 * ============================================================================
 * AfterShip tracking-webhook verification + parsing.
 * ============================================================================
 * AfterShip signs webhooks with base64 HMAC-SHA256 over the RAW request body,
 * delivered in the `aftership-hmac-sha256` header. Verification MUST run over the
 * raw bytes (Express: express.raw / a verify hook) — re-serializing the JSON
 * changes whitespace/key-order and breaks the HMAC.
 *
 * Docs: https://www.aftership.com/docs/tracking/others/webhook-security
 */
const { verifyHmac } = require('../_shared/signature');
const { mapTag } = require('./providers/aftership');

const SIGNATURE_HEADER = 'aftership-hmac-sha256';
// AfterShip v4 emits `hmac-sha256`; v3 used `aftership-hmac-sha256`. Accept both.
const SIGNATURE_HEADERS = Object.freeze(['hmac-sha256', 'aftership-hmac-sha256']);

/**
 * Verify an AfterShip webhook signature (constant-time, fail-closed).
 * @param {Object} args
 * @param {string|Buffer} args.rawBody          raw request body bytes
 * @param {string} args.signatureHeader         value of `aftership-hmac-sha256`
 * @param {string} args.secret                  AFTERSHIP_WEBHOOK_SECRET
 * @returns {boolean}
 */
function verifyAftershipWebhook({ rawBody, signatureHeader, secret }) {
    return verifyHmac({ secret, rawBody, signatureHeader, encoding: 'base64' });
}

/**
 * Read the AfterShip signature from a request headers map (case-insensitive),
 * accepting either the v4 (`hmac-sha256`) or v3 (`aftership-hmac-sha256`) name.
 * @param {Record<string,string|string[]>} headers
 * @returns {string|undefined}
 */
function readSignatureHeader(headers) {
    if (!headers || typeof headers !== 'object') return undefined;
    const lower = {};
    for (const [k, v] of Object.entries(headers)) {
        lower[String(k).toLowerCase()] = Array.isArray(v) ? v[0] : v;
    }
    for (const name of SIGNATURE_HEADERS) {
        if (lower[name] != null) return lower[name];
    }
    return undefined;
}

/**
 * Verify an AfterShip webhook directly from a request `headers` object — reads
 * whichever signature header (v3 or v4) is present.
 * @param {Record<string,string|string[]>} headers
 * @param {string|Buffer} rawBody
 * @param {string} secret AFTERSHIP_WEBHOOK_SECRET
 * @returns {boolean}
 */
function verifyAftershipWebhookFromHeaders(headers, rawBody, secret) {
    const signatureHeader = readSignatureHeader(headers);
    return verifyAftershipWebhook({ rawBody, signatureHeader, secret });
}

/**
 * Parse an AfterShip webhook body into the minimal milestone shape the order
 * path consumes. The payload nests the tracking under `msg` (legacy) or
 * `data.tracking` depending on the AfterShip API version.
 * @param {object|string} body parsed object or JSON string
 * @returns {{ trackingNumber: string|undefined, status: keyof import('./contract').TRACKING_STATUS, ts: string|undefined }}
 */
function parseAftershipEvent(body) {
    let parsed = body;
    if (typeof body === 'string') {
        try { parsed = JSON.parse(body); } catch { parsed = {}; }
    }
    const tracking = parsed?.msg || parsed?.data?.tracking || parsed?.tracking || {};
    return {
        trackingNumber: tracking.tracking_number,
        status: mapTag(tracking.tag),
        ts: tracking.updated_at || tracking.last_updated_at || tracking.checkpoint_time || undefined,
    };
}

module.exports = {
    verifyAftershipWebhook,
    verifyAftershipWebhookFromHeaders,
    readSignatureHeader,
    parseAftershipEvent,
    SIGNATURE_HEADER,
    SIGNATURE_HEADERS,
};

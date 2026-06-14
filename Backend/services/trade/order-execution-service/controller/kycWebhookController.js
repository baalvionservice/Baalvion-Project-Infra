'use strict';
/**
 * Onfido KYC webhook -> tenant-bound registry update.
 *
 * Onfido signs every delivery with HMAC-SHA256 of the RAW body (hex) in X-SHA2-Signature.
 * We verify over the raw bytes (captured in index.js), parse + normalize the event to a
 * KYC_STATUS, then resolve the registry row by the SERVER-STORED provider verification id
 * (objectId) under tenant bypass. The provider id is never caller-supplied, so this is the
 * one place an out-of-band status update is safe without a tenant in context.
 *
 * NOT a user route — no authMiddleware/tenant (the handler verifies the signature itself).
 */
const config = require('../config/appConfig');
const kycRegistry = require('../services/kycRegistry');
const { verifyOnfidoWebhook, parseOnfidoEvent } = require('../integrations/kyc/webhook');
const { KYC_STATUS } = require('../integrations/kyc/contract');

// Only an explicit, mapped KYC_STATUS updates the registry. Anything else is acked + ignored.
function mappedStatus(status) {
    return status && KYC_STATUS[status] ? status : null;
}

// Strip CR/LF/tab from any dynamic value before logging (no log-injection / forging).
function sanitizeLog(v) {
    return String(v == null ? '' : v).replace(/[\r\n\t]/g, ' ');
}

/**
 * Pure-ish core: decides the HTTP response from injected verify/parse/apply deps.
 * No Express/DB coupling, so it is unit-testable (mirrors paymentWebhookController).
 * @returns {Promise<{status:number, json:object}>}
 */
async function handleOnfidoWebhook(input, deps) {
    const { verify, parse, apply } = deps;
    if (!verify()) {
        return { status: 401, json: { error: { code: 'BAD_SIGNATURE', message: 'invalid webhook signature' } } };
    }
    let parsed;
    try { parsed = parse(); } catch (e) {
        return { status: 400, json: { error: { code: 'BAD_WEBHOOK_BODY', message: 'unparseable KYC webhook' } } };
    }
    const status = mappedStatus(parsed.status);
    if (!status || !parsed.objectId) {
        return { status: 200, json: { ok: true, ignored: true, status: parsed.status || null } };
    }
    try {
        const result = await apply({
            providerVerificationId: parsed.objectId,
            status,
            reasons: parsed.reasons,
        });
        return { status: 200, json: { ok: true, status, updated: !!(result && result.updated) } };
    } catch (err) {
        console.error(`[${config.service}] onfido webhook update failed:`, sanitizeLog(status), sanitizeLog(err.message));
        return { status: 500, json: { error: { code: 'UPDATE_FAILED', message: 'event processing failed; retry' } } };
    }
}

// Express handler — wires the real verify/parse/apply over the request.
async function onfidoWebhook(req, res) {
    // FAIL CLOSED: HMAC must be verified over the EXACT raw bytes Onfido signed (captured globally
    // in index.js). A re-serialized JSON body would never match the provider's signature, so if the
    // raw body is absent we treat the delivery as unverifiable (401) rather than forging a body.
    const raw = req.rawBody;
    const out = await handleOnfidoWebhook(
        {},
        {
            // No raw body -> verification cannot succeed; verifyHmac also fails closed on an empty token.
            verify: () => Buffer.isBuffer(raw) && verifyOnfidoWebhook({
                rawBody: raw,
                signatureHeader: req.headers['x-sha2-signature'],
                token: config.kyc.webhookToken,
            }),
            parse: () => parseOnfidoEvent(req.body || {}),
            apply: (u) => kycRegistry.applyWebhookUpdate(u),
        },
    );
    return res.status(out.status).json(out.json);
}

module.exports = { onfidoWebhook, handleOnfidoWebhook, mappedStatus };

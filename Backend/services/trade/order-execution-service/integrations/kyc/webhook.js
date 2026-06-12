'use strict';
/**
 * ============================================================================
 * Onfido webhook verification + event parsing.
 * ============================================================================
 * Onfido signs webhook deliveries with HMAC-SHA256 of the RAW request body,
 * keyed by the webhook token, hex-encoded, sent in the `X-SHA2-Signature`
 * header. Verification MUST run over the raw bytes (not a re-serialized object)
 * and MUST be constant-time — both handled by the shared signature util.
 *
 * The decision delivered by a webhook is treated exactly like a getResult():
 * fail-closed, only an explicit approved status is APPROVED.
 */
const { verifyHmac } = require('../_shared/signature');
const { mapWorkflowStatus, mapCheckResult } = require('./providers/onfido');

const SIGNATURE_HEADER = 'X-SHA2-Signature';

/**
 * Verify an Onfido webhook delivery.
 * @param {Object} args
 * @param {string|Buffer} args.rawBody          raw request body bytes
 * @param {string} args.signatureHeader         value of the X-SHA2-Signature header
 * @param {string} args.token                   ONFIDO_WEBHOOK_TOKEN
 * @returns {boolean} true iff the signature matches (constant-time)
 */
function verifyOnfidoWebhook({ rawBody, signatureHeader, token }) {
    return verifyHmac({
        secret: token,
        rawBody,
        signatureHeader,
        encoding: 'hex',
    });
}

/**
 * Parse an Onfido webhook event body (after verification) into a normalized shape.
 * Onfido payload: { payload: { resource_type, action, object: { id, status, completed_at_iso8601, ... } } }
 *
 * @param {Object|string} body  parsed JSON object, or the raw JSON string
 * @returns {{ resourceType: string|null, action: string|null, objectId: string|null, status: string|null }}
 */
function parseOnfidoEvent(body) {
    const obj = typeof body === 'string' ? safeParse(body) : body;
    const payload = (obj && obj.payload) || {};
    const resource = payload.object || payload.resource || {};
    const resourceType = payload.resource_type || null;
    const action = payload.action || null;
    const objectId = resource.id || null;
    const rawStatus = resource.status != null ? String(resource.status) : null;

    // Map to our KYC_STATUS using the same provider mappers, choosing the
    // workflow vs legacy mapper based on the resource type.
    let status = rawStatus;
    if (rawStatus != null) {
        status = resourceType === 'workflow_run'
            ? mapWorkflowStatus(rawStatus)
            : resourceType === 'check'
                ? mapCheckResult(resource.result, rawStatus)
                : rawStatus;
    }

    return { resourceType, action, objectId, status };
}

/**
 * Parse a webhook JSON string, throwing on malformed input. A verified-but-corrupt
 * body must NOT be silently presented as an event with null fields — the caller
 * treats this throw as a 400 (bad request) rather than acting on a fake-empty event.
 */
function safeParse(text) {
    try {
        return JSON.parse(text);
    } catch (err) {
        const e = new Error('malformed Onfido webhook body (invalid JSON)');
        e.code = 'WEBHOOK_MALFORMED_BODY';
        e.cause = err;
        throw e;
    }
}

module.exports = { verifyOnfidoWebhook, parseOnfidoEvent, SIGNATURE_HEADER };

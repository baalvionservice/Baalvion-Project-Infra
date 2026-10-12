'use strict';
/**
 * BrokerConnector — file a declaration through a licensed customs broker.
 *
 * Direct filing with ICEGATE, ACE, the EU systems, Mirsal or the China Single
 * Window needs accredited access that Baalvion does not hold. A licensed broker
 * does, and files under its own rights: the broker is the declarant of record, we
 * hand it a complete declaration and track what it reports back.
 *
 * Because no particular broker is fixed yet, this connector speaks one small,
 * documented contract that a broker (or an adapter in front of its own system)
 * implements. It is JSON over verified HTTPS, signed with HMAC-SHA256.
 *
 * REQUEST   POST {endpoint}
 *   Authorization:         Bearer {apiKey}
 *   Idempotency-Key:       our submission key (a retry never files twice)
 *   X-Baalvion-Timestamp:  unix seconds
 *   X-Baalvion-Signature:  sha256=hex(HMAC(signingSecret, `${timestamp}.${body}`))
 *   body: { version, account_id, reference, declaration }
 *
 * RESPONSE  { reference, status, messages: [{ code, level, text }] }
 *   `reference` is the broker's handle for the filing. `status` is one of
 *   BROKER_STATUS below. GET {statusEndpoint}?reference=… returns the same shape.
 *
 * WEBHOOK   the broker calls us when a status changes, signed with
 *   webhookSecret the same way. See verifyWebhook(). The webhook is only a nudge:
 *   we re-read the authoritative status from the broker rather than trust the
 *   body of an inbound request.
 *
 * Statuses that mean "the broker has it" are NOT reported as "cleared". Only the
 * broker saying cleared/released is treated as accepted.
 */

const crypto = require('crypto');

const { CustomsConnector } = require('./baseConnector');
const transport = require('./transport');
const { CHANNEL, STATUS } = require('../schema');

const CONTRACT_VERSION = '1';

// Replay window for signed requests, in seconds, both directions.
const SIGNATURE_TOLERANCE_SECONDS = 300;

const BROKER_STATUS = Object.freeze({
    RECEIVED: STATUS.SUBMITTED,
    QUEUED: STATUS.SUBMITTED,
    PENDING_DOCUMENTS: STATUS.SUBMITTED,
    UNDER_REVIEW: STATUS.SUBMITTED,
    FILED: STATUS.SUBMITTED,
    AWAITING_CUSTOMS: STATUS.SUBMITTED,
    INSPECTION: STATUS.SUBMITTED,
    CLEARED: STATUS.ACCEPTED,
    RELEASED: STATUS.ACCEPTED,
    REJECTED: STATUS.REJECTED,
    CANCELLED: STATUS.CANCELLED,
});

function sign(secret, timestamp, body) {
    const digest = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
    return `sha256=${digest}`;
}

function safeEqual(a, b) {
    const x = Buffer.from(String(a));
    const y = Buffer.from(String(b));
    return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/**
 * Verify an inbound broker webhook.
 *
 * @param {Buffer|string} rawBody  the body exactly as received (not re-serialised)
 * @param {object} headers         request headers (any case)
 * @param {string} secret          BROKER_WEBHOOK_SECRET
 * @param {number} [nowSeconds]    injectable clock
 * @returns {{ ok: boolean, reason?: string }}
 */
function verifyWebhook(rawBody, headers = {}, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
    if (!secret) return { ok: false, reason: 'webhook secret not configured' };
    const h = {};
    for (const [k, v] of Object.entries(headers || {})) h[k.toLowerCase()] = v;
    const timestamp = h['x-baalvion-timestamp'];
    const signature = h['x-baalvion-signature'];
    if (!timestamp || !signature) return { ok: false, reason: 'missing signature headers' };
    if (!/^\d+$/.test(String(timestamp))) return { ok: false, reason: 'bad timestamp' };
    if (Math.abs(nowSeconds - Number(timestamp)) > SIGNATURE_TOLERANCE_SECONDS) {
        return { ok: false, reason: 'timestamp outside the allowed window' };
    }
    const body = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody || '');
    if (!safeEqual(sign(secret, timestamp, body), signature)) return { ok: false, reason: 'signature mismatch' };
    return { ok: true };
}

class BrokerConnector extends CustomsConnector {
    constructor(opts = {}) {
        super({ channel: CHANNEL.BROKER, gatewayName: 'licensed customs broker', ...opts });
    }

    // The broker validates against its own country's rules. We only refuse what
    // could never be filed anywhere.
    validateDeclaration(declaration) {
        const errors = [];
        for (const line of declaration.line_items || []) {
            const hs = String(line.hs_code || '').replace(/\D/g, '');
            if (hs.length < 6) {
                errors.push({
                    code: 'BROKER_HS_TOO_SHORT',
                    level: 'error',
                    text: `Line ${line.line_no}: a broker needs at least the 6-digit HS code; "${line.hs_code}" has ${hs.length} digits`,
                });
            }
        }
        if (!(declaration.importer || {}).name) {
            errors.push({ code: 'BROKER_MISSING_IMPORTER', level: 'error', text: 'Importer name is required' });
        }
        if (!(declaration.exporter || {}).name) {
            errors.push({ code: 'BROKER_MISSING_EXPORTER', level: 'error', text: 'Exporter name is required' });
        }
        return errors;
    }

    buildPayload(declaration, ctx = {}) {
        const cfg = ctx.cfg || {};
        const body = JSON.stringify({
            version: CONTRACT_VERSION,
            account_id: cfg.brokerAccountId,
            reference: ctx.idempotencyKey || declaration.reference || null,
            declaration,
        });
        return {
            contentType: transport.CONTENT_TYPE.JSON,
            body,
            meta: { contract_version: CONTRACT_VERSION, destination_country: declaration.destination_country },
        };
    }

    _headers(cfg, body, idempotencyKey) {
        const timestamp = String(Math.floor(Date.now() / 1000));
        const headers = {
            Authorization: `Bearer ${cfg.apiKey}`,
            'X-Baalvion-Timestamp': timestamp,
            'X-Baalvion-Signature': sign(cfg.signingSecret, timestamp, body || ''),
        };
        if (idempotencyKey) headers['Idempotency-Key'] = String(idempotencyKey);
        return headers;
    }

    async transmit(payload, ctx = {}) {
        const cfg = { ...(ctx.cfg || this.assertConfigured()), allowPlainTls: true };
        const res = await transport.transmit(this, {
            url: cfg.endpoint,
            headers: this._headers(cfg, payload.body, ctx.idempotencyKey),
            body: payload.body,
            contentType: payload.contentType,
            cfg,
        });
        return { ...res, payloadMeta: payload.meta };
    }

    async poll(gatewayReference, ctx = {}) {
        const cfg = { ...(ctx.cfg || this.assertConfigured()), allowPlainTls: true };
        const url = new URL(cfg.statusEndpoint || cfg.endpoint);
        url.searchParams.set('reference', String(gatewayReference));
        const res = await transport.transmit(this, {
            url: url.toString(),
            method: 'GET',
            headers: this._headers(cfg, '', null),
            contentType: transport.CONTENT_TYPE.JSON,
            cfg,
        });
        return this.parseResponse(res, { ...ctx, cfg, polled: true });
    }

    parseResponse(raw) {
        let doc;
        try {
            doc = JSON.parse(raw.body);
        } catch (err) {
            throw this.failTransient(`the broker returned an unparseable response: ${err.message}`, {
                code: 'BAD_RESPONSE', raw: { body: String(raw.body || '').slice(0, 500) },
            });
        }
        if (!doc || typeof doc !== 'object') {
            throw this.failTransient('the broker returned an empty response', { code: 'BAD_RESPONSE' });
        }

        const native = String(doc.status || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
        // A status we do not recognise is "submitted": the broker has the filing, and
        // we must not invent a clearance (or a rejection) from a word we cannot read.
        const status = BROKER_STATUS[native] || STATUS.SUBMITTED;

        const messages = (Array.isArray(doc.messages) ? doc.messages : []).map((m) => ({
            code: (m && m.code) || 'BROKER_MESSAGE',
            level: (m && m.level) || 'info',
            text: (m && (m.text || m.message)) || '',
        }));
        if (native && !BROKER_STATUS[native]) {
            messages.push({ code: 'BROKER_UNKNOWN_STATUS', level: 'warning', text: `Broker reported status "${doc.status}", which is not in the contract; treated as submitted` });
        }

        return this.normalize({
            status,
            accepted: status === STATUS.ACCEPTED,
            gateway_reference: doc.reference || doc.id || null,
            gateway_status: native || null,
            messages,
            retryable: false,
            raw: { http_status: raw.status, audit: raw.audit, payload_meta: raw.payloadMeta || null, document: doc },
        });
    }
}

module.exports = {
    BrokerConnector, BROKER_STATUS, CONTRACT_VERSION, SIGNATURE_TOLERANCE_SECONDS,
    sign, verifyWebhook,
};

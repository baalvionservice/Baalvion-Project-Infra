'use strict';
/**
 * Wire transport for government gateways (Customs Connectors).
 *
 * There is no simulated path. A connector either transmits over a verified
 * mutual-TLS channel to the real authority, or it refuses and says which
 * credential is missing. The refusal is classified PERMANENT so a durable queue
 * does not spin retrying something no retry can fix.
 *
 * This module is the one place the wire call, the status classification and the
 * audit envelope live, so the five connectors stay focused on their own message
 * shape and response vocabulary.
 *
 * WHAT GETS RECORDED. Every transmission returns an `audit` block: endpoint,
 * status, duration, response size, the negotiated TLS version and the client
 * certificate's expiry. That is what an authority asks for when a filing is
 * disputed, and what tells an operator that a channel is about to break because
 * a certificate lapses next week. Bodies are NOT logged here — a declaration is
 * commercially sensitive and belongs in the submission record, not in transport
 * logs.
 */

const crypto = require('crypto');

const mtls = require('./mtls');
const config = require('./config');
const { FAILURE_KIND, GatewayError } = require('../schema');

const CONTENT_TYPE = Object.freeze({
    XML: 'application/xml; charset=utf-8',
    SOAP: 'application/soap+xml; charset=utf-8',
    JSON: 'application/json; charset=utf-8',
    TEXT: 'text/plain; charset=utf-8',
    FORM: 'application/x-www-form-urlencoded',
});

/**
 * Resolve a connector's TLS material from its configuration.
 * Throws GatewayNotConfiguredError when anything required is absent.
 */
function tlsFor(cfg) {
    return {
        clientCertPath: cfg.clientCertPath,
        clientKeyPath: cfg.clientKeyPath,
        caBundlePath: cfg.caBundlePath,
        clientKeyPassphrase: cfg.clientKeyPassphrase || null,
    };
}

/**
 * Classify an HTTP status into the retry taxonomy.
 *
 * 429 and 503 are transient by definition; 5xx is transient because a gateway
 * fault is not the declaration's fault. 401/403 is treated as PERMANENT even
 * though it looks transient: it means the credential is wrong or the enrolment
 * has lapsed, and retrying an unauthorised filing achieves nothing except
 * tripping the authority's abuse controls.
 */
function classifyStatus(connector, status, body) {
    if (status >= 200 && status < 300) return null;

    const snippet = String(body || '').slice(0, 500);

    if (status === 401 || status === 403) {
        return connector.failPermanent(
            `gateway rejected our credentials (HTTP ${status}). The client certificate or filer identity is not accepted — check the enrolment rather than retrying.`,
            { code: `http_${status}`, raw: { status, body: snippet } },
        );
    }
    if (status === 408 || status === 429 || status === 502 || status === 503 || status === 504) {
        return connector.failTransient(`gateway unavailable (HTTP ${status})`, { code: `http_${status}`, raw: { status, body: snippet } });
    }
    if (status >= 500) {
        return connector.failTransient(`gateway error (HTTP ${status})`, { code: `http_${status}`, raw: { status, body: snippet } });
    }
    if (status === 400 || status === 422) {
        return connector.failPermanent(
            `gateway rejected the message (HTTP ${status}). The declaration must be corrected before resubmission.`,
            { code: `http_${status}`, raw: { status, body: snippet } },
        );
    }
    return connector.failPermanent(`gateway returned HTTP ${status}`, { code: `http_${status}`, raw: { status, body: snippet } });
}

/**
 * Transmit one message.
 *
 * @param {object} connector  the calling CustomsConnector (for error factories)
 * @param {object} opts       { url, method, headers, body, contentType, cfg, timeoutMs, expectStatus }
 * @returns {Promise<{ status, headers, body, audit }>}
 */
async function transmit(connector, {
    url,
    method = 'POST',
    headers = {},
    body = null,
    contentType = CONTENT_TYPE.XML,
    cfg,
    timeoutMs = mtls.DEFAULT_TIMEOUT_MS,
} = {}) {
    if (!url) {
        throw new GatewayError({
            kind: FAILURE_KIND.PERMANENT,
            channel: connector.channel,
            code: 'NO_ENDPOINT',
            message: `${connector.gatewayName} has no endpoint configured — nothing was transmitted.`,
        });
    }

    // A correlation id the authority can be quoted in a dispute.
    const correlationId = crypto.randomUUID();
    const startedAt = new Date();

    let res;
    try {
        res = await mtls.request({
            url,
            method,
            headers: {
                'Content-Type': contentType,
                Accept: contentType,
                'X-Correlation-Id': correlationId,
                ...headers,
            },
            body,
            timeoutMs,
            tls: tlsFor(cfg),
        });
    } catch (err) {
        if (err instanceof mtls.TlsMaterialError) {
            // Bad or expired credential material. No retry will fix it.
            throw new GatewayError({
                kind: FAILURE_KIND.PERMANENT,
                channel: connector.channel,
                code: 'TLS_MATERIAL',
                message: `${connector.gatewayName}: ${err.message}`,
                raw: err.details,
            });
        }
        const ge = connector.classifyTransport(err);
        if (err && err.tlsHint) ge.message = `${ge.message} — ${err.tlsHint}`;
        throw ge;
    }

    const audit = {
        correlation_id: correlationId,
        endpoint: url,
        method,
        status: res.status,
        started_at: startedAt.toISOString(),
        duration_ms: res.meta.duration_ms,
        response_bytes: Buffer.byteLength(res.body || ''),
        tls_protocol: res.meta.tls_protocol,
        peer_authorized: res.meta.peer_authorized,
        client_certificate_expires: res.meta.client_certificate ? res.meta.client_certificate.valid_to : null,
        client_certificate_days_left: res.meta.client_certificate ? res.meta.client_certificate.days_to_expiry : null,
    };

    const statusError = classifyStatus(connector, res.status, res.body);
    if (statusError) {
        statusError.audit = audit;
        throw statusError;
    }

    return { status: res.status, headers: res.headers, body: res.body, audit };
}

/**
 * Guard every connector entry point. Resolves configuration or throws a
 * GatewayNotConfiguredError listing exactly what is missing and where it comes
 * from — which is the only useful thing to say before an integration exists.
 */
function requireConfig(channel, overrides = {}) {
    return config.assertConfigured(channel, { overrides });
}

module.exports = { CONTENT_TYPE, transmit, requireConfig, classifyStatus, tlsFor };

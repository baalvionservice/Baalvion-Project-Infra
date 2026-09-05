'use strict';
/**
 * Mutual-TLS transport for government gateways (Customs Connectors).
 *
 * Every customs authority here authenticates the CLIENT with a certificate, not
 * an API key. `fetch` cannot present one, so this module owns a real
 * https.Agent built from the enrolment material and performs the request itself.
 *
 * Decisions that are not negotiable, and why:
 *
 *   rejectUnauthorized is ALWAYS true. Disabling server verification to "get it
 *   working" against a sandbox turns the channel into an unauthenticated one and
 *   would let anything terminate a connection carrying a signed declaration and
 *   a client credential. If the authority's chain does not verify, the fix is
 *   the correct CA bundle, never this flag.
 *
 *   minVersion TLSv1.2. Below that there is no forward secrecy worth the name,
 *   and no authority still requires it.
 *
 *   Agents are CACHED per credential set. Building one per request re-parses the
 *   PEMs and throws away connection reuse, and these gateways are slow enough
 *   that a fresh handshake per filing is a measurable share of the wall clock.
 *
 *   Nothing here logs a key, a passphrase or a body. The returned `meta` carries
 *   the certificate SUBJECT and expiry — useful operationally, and not secret.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const DEFAULT_TIMEOUT_MS = 30000;   // government gateways are not fast
const DEFAULT_MAX_BODY_BYTES = 8 * 1024 * 1024;

const agentCache = new Map();

/** Cache key over the credential paths + their mtimes, so a rotated cert rebuilds. */
function agentKey(opts) {
    const parts = ['clientCertPath', 'clientKeyPath', 'caBundlePath'].map((k) => {
        const p = opts[k];
        if (!p) return `${k}:none`;
        try {
            const st = fs.statSync(path.resolve(p));
            return `${k}:${path.resolve(p)}:${st.mtimeMs}:${st.size}`;
        } catch {
            return `${k}:${p}:missing`;
        }
    });
    // The passphrase participates in identity but must not appear in the key.
    parts.push(`pass:${opts.clientKeyPassphrase ? crypto.createHash('sha256').update(opts.clientKeyPassphrase).digest('hex').slice(0, 16) : 'none'}`);
    return parts.join('|');
}

class TlsMaterialError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'TlsMaterialError';
        this.details = details;
    }
}

function readPem(p, label) {
    const resolved = path.resolve(p);
    let buf;
    try {
        buf = fs.readFileSync(resolved);
    } catch (err) {
        throw new TlsMaterialError(`${label} could not be read at ${resolved}: ${err.code || err.message}`, { path: resolved });
    }
    if (!buf.length) throw new TlsMaterialError(`${label} at ${resolved} is empty`, { path: resolved });
    return buf;
}

/**
 * Certificate metadata worth surfacing operationally. An expired client
 * certificate presents as an opaque TLS handshake failure, so knowing the expiry
 * up front converts a mystifying outage into a calendar entry.
 */
function certificateMeta(pem) {
    try {
        const x = new crypto.X509Certificate(pem);
        const validTo = new Date(x.validTo);
        const daysToExpiry = Math.floor((validTo.getTime() - Date.now()) / 86400000);
        return {
            subject: x.subject,
            issuer: x.issuer,
            valid_from: new Date(x.validFrom).toISOString(),
            valid_to: validTo.toISOString(),
            days_to_expiry: daysToExpiry,
            expired: daysToExpiry < 0,
            fingerprint_sha256: x.fingerprint256,
        };
    } catch {
        return null;
    }
}

/**
 * Build (or reuse) the mutual-TLS agent for a credential set.
 * @throws {TlsMaterialError} when the material is unreadable or already expired
 */
function getAgent(opts = {}) {
    const key = agentKey(opts);
    const cached = agentCache.get(key);
    if (cached) return cached;

    const cert = readPem(opts.clientCertPath, 'client certificate');
    const clientKey = readPem(opts.clientKeyPath, 'client private key');
    const ca = readPem(opts.caBundlePath, 'CA bundle');

    const meta = certificateMeta(cert);
    if (meta && meta.expired) {
        // Fail here with a readable message rather than at the handshake, where
        // it surfaces as an unexplained connection reset.
        throw new TlsMaterialError(
            `client certificate expired on ${meta.valid_to} (subject ${meta.subject}). Renew it with the authority before filing.`,
            { valid_to: meta.valid_to, subject: meta.subject },
        );
    }

    const agent = new https.Agent({
        cert,
        key: clientKey,
        ca,
        passphrase: opts.clientKeyPassphrase || undefined,
        // Never disabled. See the module header.
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
        keepAlive: true,
        keepAliveMsecs: 30000,
        maxSockets: Number(opts.maxSockets) || 16,
        timeout: Number(opts.timeoutMs) || DEFAULT_TIMEOUT_MS,
    });

    const entry = { agent, meta };
    agentCache.set(key, entry);
    return entry;
}

/**
 * Perform one mutual-TLS request.
 *
 * Returns { status, headers, body, meta } — never throws on an HTTP status, so
 * the caller's connector decides what a 4xx means for its own protocol. Throws
 * only on transport failure (DNS, handshake, timeout, body overrun).
 */
function request({
    url,
    method = 'POST',
    headers = {},
    body = null,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxBodyBytes = DEFAULT_MAX_BODY_BYTES,
    tls = {},
} = {}) {
    const { agent, meta } = getAgent({ ...tls, timeoutMs });
    const target = new URL(url);

    if (target.protocol !== 'https:') {
        throw new TlsMaterialError(`refusing to transmit a customs declaration over ${target.protocol} — https is required`, { url });
    }

    const payload = body === null || body === undefined
        ? null
        : (Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8'));

    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
        const req = https.request({
            protocol: target.protocol,
            hostname: target.hostname,
            port: target.port || 443,
            path: `${target.pathname}${target.search}`,
            method,
            agent,
            servername: target.hostname,   // SNI — some gateways virtual-host
            headers: {
                'Content-Length': payload ? Buffer.byteLength(payload) : 0,
                Connection: 'keep-alive',
                ...headers,
            },
        }, (res) => {
            const chunks = [];
            let received = 0;
            res.on('data', (chunk) => {
                received += chunk.length;
                if (received > maxBodyBytes) {
                    // A runaway response must not become a memory incident.
                    req.destroy(new Error(`response exceeded ${maxBodyBytes} bytes`));
                    return;
                }
                chunks.push(chunk);
            });
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: Buffer.concat(chunks).toString('utf8'),
                    meta: {
                        duration_ms: Date.now() - startedAt,
                        client_certificate: meta,
                        tls_protocol: res.socket && res.socket.getProtocol ? res.socket.getProtocol() : null,
                        peer_authorized: res.socket ? res.socket.authorized !== false : null,
                    },
                });
            });
        });

        req.setTimeout(timeoutMs, () => {
            req.destroy(Object.assign(new Error(`gateway did not respond within ${timeoutMs}ms`), { code: 'ETIMEDOUT' }));
        });

        req.on('error', (err) => {
            // Surface the TLS reason where there is one — "unable to verify the
            // first certificate" is a CA-bundle problem, and saying so saves hours.
            if (err && err.code && /^(UNABLE_TO_VERIFY|CERT_|DEPTH_ZERO|SELF_SIGNED|ERR_TLS)/.test(err.code)) {
                err.tlsHint = 'Server certificate did not verify against the configured CA bundle. Check the bundle from the authority rather than disabling verification.';
            }
            reject(err);
        });

        if (payload) req.write(payload);
        req.end();
    });
}

/** Certificate expiry across every configured channel — an ops-visible clock. */
function certificateStatus(tlsOptsByChannel = {}) {
    return Object.entries(tlsOptsByChannel).map(([channel, tls]) => {
        if (!tls || !tls.clientCertPath) return { channel, configured: false };
        try {
            const pem = readPem(tls.clientCertPath, 'client certificate');
            return { channel, configured: true, certificate: certificateMeta(pem) };
        } catch (err) {
            return { channel, configured: true, error: err.message };
        }
    });
}

/** Drop cached agents — used after a credential rotation. */
function resetAgents() {
    for (const { agent } of agentCache.values()) {
        try { agent.destroy(); } catch { /* best effort */ }
    }
    agentCache.clear();
}

module.exports = {
    DEFAULT_TIMEOUT_MS,
    TlsMaterialError,
    getAgent,
    certificateMeta,
    certificateStatus,
    request,
    resetAgents,
};

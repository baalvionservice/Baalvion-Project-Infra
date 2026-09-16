'use strict';
/**
 * Escrow provider seam.
 *
 * This used to be simulated: `createEscrow` minted `escrow-${Date.now()}` as the reference and
 * `fundEscrow` moved the row to `funded` because someone called the endpoint. No money was
 * involved at any point — and compliance releasing that escrow ISSUES EQUITY onto the cap table.
 * The end state was real ownership recorded against funds that never arrived.
 *
 * So it FAILS CLOSED, and more strictly than e-signature: funding is not an API call this service
 * can make on its own. A deal is funded when the escrow provider says money landed, which arrives
 * as a signed webhook (see confirmFunding). There is no path in this service that marks an escrow
 * funded without provider evidence.
 *
 * Configure with ESCROW_API_URL, ESCROW_API_KEY and ESCROW_WEBHOOK_SECRET.
 */
const crypto = require('crypto');

const API_URL = process.env.ESCROW_API_URL || '';
const API_KEY = process.env.ESCROW_API_KEY || '';
const WEBHOOK_SECRET = process.env.ESCROW_WEBHOOK_SECRET || '';
const TIMEOUT_MS = Number(process.env.ESCROW_TIMEOUT_MS || 10000);

const isConfigured = () => Boolean(API_URL && API_KEY);

function unconfigured() {
    const err = new Error('Escrow is not configured on this environment. Funds cannot be placed until an escrow provider is connected.');
    err.code = 'ESCROW_UNCONFIGURED';
    err.statusCode = 503;
    return err;
}

/**
 * Open an escrow account with the provider and get back ITS reference — the identifier the money
 * actually moves against, not one this service invented.
 */
async function openEscrow({ dealId, amount, currency, payerOrgId, payeeOrgId }) {
    if (!isConfigured()) throw unconfigured();
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(`${API_URL}/escrows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
            body: JSON.stringify({ reference: dealId, amount, currency, payer: payerOrgId, payee: payeeOrgId }),
            signal: ctl.signal,
        });
        if (!res.ok) {
            const err = new Error(`Escrow provider rejected the request (${res.status})`);
            err.code = 'ESCROW_REJECTED';
            err.statusCode = 502;
            throw err;
        }
        const json = await res.json();
        if (!json?.escrow_ref) {
            const err = new Error('Escrow provider returned no reference');
            err.code = 'ESCROW_INVALID_RESPONSE';
            err.statusCode = 502;
            throw err;
        }
        return { escrowRef: String(json.escrow_ref), fundingInstructions: json.funding_instructions || null };
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Verify a provider webhook. Timing-safe, and refuses outright when no secret is configured —
 * an unverifiable funding notification is exactly the thing that must never be trusted.
 */
function verifyWebhook(rawBody, signature) {
    if (!WEBHOOK_SECRET || !signature) return false;
    const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
    const a = Buffer.from(String(signature));
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Instruct the provider to release. Called only after the staff approval in dealService. */
async function releaseEscrow({ escrowRef }) {
    if (!isConfigured()) throw unconfigured();
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(`${API_URL}/escrows/${encodeURIComponent(escrowRef)}/release`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${API_KEY}` },
            signal: ctl.signal,
        });
        if (!res.ok) {
            const err = new Error(`Escrow provider refused the release (${res.status})`);
            err.code = 'ESCROW_RELEASE_REJECTED';
            err.statusCode = 502;
            throw err;
        }
        return await res.json().catch(() => ({}));
    } finally {
        clearTimeout(timer);
    }
}

module.exports = { isConfigured, openEscrow, verifyWebhook, releaseEscrow };

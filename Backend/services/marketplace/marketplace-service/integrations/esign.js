'use strict';
/**
 * E-signature provider seam.
 *
 * This used to be simulated: creating a signature minted `env-${Date.now()}` as an envelope id,
 * and "completing" one stamped an s3:// audit URL that pointed at nothing. The record then said
 * `status: signed` — a legally meaningless mark, stored and displayed exactly like a real one, on
 * the document that transfers equity. Someone would eventually rely on it.
 *
 * So it FAILS CLOSED. With no provider configured, starting a signature is refused with a clear
 * reason. Nothing in this file can produce a `signed` row on its own: only a provider callback
 * carrying the provider's own envelope id and audit trail can (see completeFromProvider).
 *
 * Configure with ESIGN_PROVIDER (aadhaar_esign | docusign | adobe_sign) and ESIGN_API_URL +
 * ESIGN_API_KEY. The request shape below is the common envelope-create contract; the concrete
 * per-provider mapping is the remaining integration work and is deliberately not guessed at here.
 */
const PROVIDER = process.env.ESIGN_PROVIDER || '';
const API_URL = process.env.ESIGN_API_URL || '';
const API_KEY = process.env.ESIGN_API_KEY || '';
const TIMEOUT_MS = Number(process.env.ESIGN_TIMEOUT_MS || 10000);

const isConfigured = () => Boolean(PROVIDER && API_URL && API_KEY);

/**
 * Ask the provider to create a signing envelope.
 * @returns {Promise<{envelopeId: string, provider: string, signingUrl: string|null}>}
 * @throws when no provider is configured, or the provider rejects the request.
 */
async function createEnvelope({ documentType, dealId, signerId, signerEmail }) {
    if (!isConfigured()) {
        const err = new Error('E-signature is not configured on this environment. A signature cannot be started until a provider is connected.');
        err.code = 'ESIGN_UNCONFIGURED';
        err.statusCode = 503;
        throw err;
    }
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(`${API_URL}/envelopes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
            body: JSON.stringify({ document_type: documentType, reference: dealId, signer_id: signerId, signer_email: signerEmail }),
            signal: ctl.signal,
        });
        if (!res.ok) {
            const err = new Error(`E-signature provider rejected the request (${res.status})`);
            err.code = 'ESIGN_REJECTED';
            err.statusCode = 502;
            throw err;
        }
        const json = await res.json();
        if (!json?.envelope_id) {
            const err = new Error('E-signature provider returned no envelope id');
            err.code = 'ESIGN_INVALID_RESPONSE';
            err.statusCode = 502;
            throw err;
        }
        return { envelopeId: String(json.envelope_id), provider: PROVIDER, signingUrl: json.signing_url || null };
    } finally {
        clearTimeout(timer);
    }
}

module.exports = { isConfigured, createEnvelope, PROVIDER };

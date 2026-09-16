'use strict';
/**
 * Sumsub adapter — a concrete implementation of the KycProvider interface, and the
 * worked example for adding any other vendor (Onfido, Persona, Veriff, Jumio):
 * implement these three methods, register the class, set KYC_PROVIDER. Nothing
 * outside this file needs to know which vendor is in use.
 *
 * Enable with:
 *   KYC_PROVIDER=sumsub
 *   SUMSUB_APP_TOKEN=...        app token from the Sumsub dashboard
 *   SUMSUB_SECRET_KEY=...       signs outbound requests
 *   SUMSUB_WEBHOOK_SECRET=...   verifies inbound callbacks (separate secret)
 *   SUMSUB_LEVEL_IDENTITY=basic-kyc-level     (optional, per-account level names)
 *   SUMSUB_LEVEL_COMPANY=basic-kyb-level
 *
 * NOT EXERCISED AGAINST THE LIVE VENDOR — this repository has no Sumsub account, so
 * the request signing and payload shapes below are written to their published API
 * and must be confirmed against a sandbox tenant before production use. What IS
 * verified here is the seam: registry resolution, submission dispatch, signature
 * rejection and verdict application (tests/kyc-provider.test.js).
 */
const crypto = require('crypto');
const { KycProvider } = require('./baseKycProvider');

const BASE = process.env.SUMSUB_BASE_URL || 'https://api.sumsub.com';
const TIMEOUT_MS = Number(process.env.SUMSUB_TIMEOUT_MS || 10000);

class SumsubProvider extends KycProvider {
    constructor(opts = {}) {
        super({ name: 'sumsub' });
        this.appToken = opts.appToken || process.env.SUMSUB_APP_TOKEN;
        this.secretKey = opts.secretKey || process.env.SUMSUB_SECRET_KEY;
        this.webhookSecret = opts.webhookSecret || process.env.SUMSUB_WEBHOOK_SECRET;
        this.identityLevel = opts.identityLevel || process.env.SUMSUB_LEVEL_IDENTITY || 'basic-kyc-level';
        this.companyLevel = opts.companyLevel || process.env.SUMSUB_LEVEL_COMPANY || 'basic-kyb-level';
        if (!this.appToken || !this.secretKey) {
            throw new Error('SumsubProvider needs SUMSUB_APP_TOKEN and SUMSUB_SECRET_KEY');
        }
    }

    /** Sumsub signs ts + METHOD + path + body with the secret key, sent as X-App-Access-Sig. */
    #headers(method, path, body) {
        const ts = Math.floor(Date.now() / 1000);
        const sig = crypto
            .createHmac('sha256', this.secretKey)
            .update(`${ts}${method.toUpperCase()}${path}${body || ''}`)
            .digest('hex');
        return {
            'Content-Type': 'application/json',
            'X-App-Token': this.appToken,
            'X-App-Access-Ts': String(ts),
            'X-App-Access-Sig': sig,
        };
    }

    async #post(path, payload) {
        const body = JSON.stringify(payload);
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
        try {
            const res = await fetch(`${BASE}${path}`, {
                method: 'POST', headers: this.#headers('POST', path, body), body, signal: ctrl.signal,
            });
            const text = await res.text();
            let data; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
            if (!res.ok) throw new Error((data && (data.description || data.message)) || `sumsub ${res.status}`);
            return data;
        } finally {
            clearTimeout(timer);
        }
    }

    /**
     * `externalUserId` is OUR record id, which is what makes the callback resolvable
     * back to the right verification without trusting anything else in the payload.
     */
    async submitIdentity(applicant) {
        const path = `/resources/applicants?levelName=${encodeURIComponent(this.identityLevel)}`;
        const data = await this.#post(path, {
            externalUserId: String(applicant.recordId),
            info: {
                firstName: (applicant.fullName || '').split(' ')[0] || undefined,
                lastName: (applicant.fullName || '').split(' ').slice(1).join(' ') || undefined,
                dob: applicant.dateOfBirth || undefined,
                country: applicant.nationality || undefined,
            },
        });
        return { externalRef: data && data.id };
    }

    async submitCompany(company) {
        const path = `/resources/applicants?levelName=${encodeURIComponent(this.companyLevel)}`;
        const data = await this.#post(path, {
            externalUserId: String(company.recordId),
            type: 'company',
            info: {
                companyInfo: {
                    companyName: company.legalCompanyName || undefined,
                    registrationNumber: company.registrationNumber || undefined,
                    incorporatedOn: company.incorporationDate || undefined,
                    website: company.companyWebsite || undefined,
                },
            },
        });
        return { externalRef: data && data.id };
    }

    /**
     * Sumsub signs the RAW body and sends the digest in X-Payload-Digest, with the
     * algorithm in X-Payload-Digest-Alg. Throwing here is how a forged callback is
     * rejected — the route turns it into a 401 and nothing is written.
     */
    parseWebhookVerdict(payload, headers = {}, rawBody = null) {
        if (!this.webhookSecret) throw new Error('SUMSUB_WEBHOOK_SECRET is not set — callbacks cannot be verified');

        const digest = headers['x-payload-digest'] || headers['X-Payload-Digest'];
        if (!digest) throw new Error('missing X-Payload-Digest');

        const algHeader = String(headers['x-payload-digest-alg'] || 'HMAC_SHA256_HEX').toUpperCase();
        const alg = { HMAC_SHA1_HEX: 'sha1', HMAC_SHA256_HEX: 'sha256', HMAC_SHA512_HEX: 'sha512' }[algHeader];
        if (!alg) throw new Error(`unsupported digest algorithm ${algHeader}`);

        // The signature covers the bytes as sent; re-serializing the parsed object
        // would reorder keys and never match, so the raw buffer is what is hashed.
        const raw = rawBody || JSON.stringify(payload);
        const expected = crypto.createHmac(alg, this.webhookSecret).update(raw).digest('hex');

        const a = Buffer.from(String(digest), 'utf8');
        const b = Buffer.from(expected, 'utf8');
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('signature mismatch');

        // Only a completed review is a verdict; every other event is progress.
        const answer = payload && payload.reviewResult && payload.reviewResult.reviewAnswer;
        const terminal = payload && payload.type === 'applicantReviewed';
        const decision = !terminal ? 'pending' : answer === 'GREEN' ? 'approved' : answer === 'RED' ? 'rejected' : 'pending';

        return {
            externalRef: payload && payload.applicantId,
            // levelName tells us which of our two tracks this case belongs to.
            kind: String((payload && payload.levelName) || '').toLowerCase().includes('kyb') ? 'company' : 'identity',
            decision,
            reason: (payload && payload.reviewResult && payload.reviewResult.moderationComment) || null,
        };
    }
}

module.exports = { SumsubProvider };

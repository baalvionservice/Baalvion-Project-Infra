'use strict';

/**
 * Reloadly Gift Cards API client — the one real, working supplier integration.
 *
 * Auth: OAuth2 client_credentials against https://auth.reloadly.com/oauth/token, with an
 * `audience` naming which Reloadly product API the token is scoped to (a token issued for
 * one Reloadly product does not authenticate calls to another). Sandbox tokens are valid
 * 24h, production tokens 60 days — cached in memory here and refreshed a minute before expiry.
 *
 * Base API URL == the audience value: https://giftcards-sandbox.reloadly.com (sandbox) or
 * https://giftcards.reloadly.com (production).
 *
 * ⚠ VERIFY AT EXECUTION TIME: the exact path/shape of the redeem-code retrieval endpoint
 * below (fetchRedeemCode) was not fully confirmed against Reloadly's live reference docs
 * (their docs site is a client-rendered SPA this environment could not render) — confirmed
 * from Reloadly's own blog/support articles: POST /orders returns a transactionId, and a
 * separate authenticated GET call using that transactionId returns the redeem code/PIN
 * (deliberately not inlined in the order response, for security). Re-verify the exact path
 * against a live sandbox call before going to production — a 404 here should fail loudly,
 * never silently return a fake code.
 */

const { AppError } = require('../../utils/errors');

const AUTH_TOKEN_URL = 'https://auth.reloadly.com/oauth/token';

function baseUrl(env) {
    return env === 'production'
        ? 'https://giftcards.reloadly.com'
        : 'https://giftcards-sandbox.reloadly.com';
}

class ReloadlyClient {
    constructor({ clientId, clientSecret, env }) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.env = env === 'production' ? 'production' : 'sandbox';
        this.baseUrl = baseUrl(this.env);
        this._token = null;
        this._tokenExpiresAt = 0;
    }

    isConfigured() {
        return Boolean(this.clientId && this.clientSecret);
    }

    async _getToken() {
        if (this._token && Date.now() < this._tokenExpiresAt - 60_000) return this._token;
        if (!this.isConfigured()) {
            throw new AppError('SUPPLIER_NOT_CONFIGURED', 'Reloadly credentials are not configured', 503);
        }
        const res = await fetch(AUTH_TOKEN_URL, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'client_credentials',
                audience: this.baseUrl,
            }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.access_token) {
            throw new AppError('SUPPLIER_AUTH_FAILED', `Reloadly token request failed: ${body.message || res.status}`, 502);
        }
        this._token = body.access_token;
        this._tokenExpiresAt = Date.now() + (Number(body.expires_in || 3600) * 1000);
        return this._token;
    }

    async _request(method, path, body) {
        const token = await this._getToken();
        const res = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: {
                authorization: `Bearer ${token}`,
                accept: 'application/json',
                ...(body ? { 'content-type': 'application/com.reloadly.giftcards-v1+json' } : {}),
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new AppError('SUPPLIER_UPSTREAM', `Reloadly ${method} ${path} failed: ${data.message || res.status}`, 502, { supplierStatus: res.status });
        }
        return data;
    }

    /** GET /products — full catalog. Callers should filter/cache; this can be a large payload. */
    async listProducts() {
        return this._request('GET', '/products');
    }

    /** GET /countries/{isoCode}/products — catalog scoped to one ISO-3166 alpha-2 country. */
    async listProductsByCountry(countryCode) {
        return this._request('GET', `/countries/${encodeURIComponent(countryCode)}/products`);
    }

    async getProduct(productId) {
        return this._request('GET', `/products/${encodeURIComponent(productId)}`);
    }

    /**
     * POST /orders — purchases a gift card. customIdentifier round-trips our own order id for
     * reconciliation. Returns (per Reloadly's documented shape) a transactionId used to fetch
     * the redeem code afterward.
     */
    async createOrder({ productId, quantity, unitPrice, customIdentifier, recipientEmail }) {
        return this._request('POST', '/orders', {
            productId,
            quantity: quantity || 1,
            unitPrice,
            customIdentifier,
            senderName: 'Market Underworld',
            recipientEmail,
        });
    }

    /**
     * Fetches the redeem code/PIN for a completed order transaction.
     * ⚠ VERIFY AT EXECUTION TIME (see file header) — path confirmed only via secondary sources.
     */
    async fetchRedeemCode(transactionId) {
        return this._request('GET', `/orders/transactions/${encodeURIComponent(transactionId)}/cards`);
    }
}

module.exports = { ReloadlyClient };

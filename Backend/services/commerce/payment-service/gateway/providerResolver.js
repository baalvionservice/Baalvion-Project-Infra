'use strict';
/**
 * Resolve a tenant's payment provider + DECRYPTED keys from the CMS vault via
 * sdk.config — the ONLY secret source. payment-service stores NO provider keys.
 * Tenant == CMS website slug.
 */
const { getSdk } = require('../platform/sdk');
const { getAdapter } = require('./adapters');

class GatewayError extends Error {
    constructor(code, message, statusCode = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }
}

function modeOf(config) {
    return config && config.mode === 'live' ? 'live' : 'mock';
}

/** The single enabled+configured payment provider for a tenant. */
async function resolveProvider(websiteSlug) {
    const integ = await getSdk().config.getPaymentProvider(websiteSlug);
    if (!integ) {
        throw new GatewayError('NO_PAYMENT_PROVIDER', `No enabled+configured payment provider for tenant "${websiteSlug}"`, 422);
    }
    return {
        provider: integ.provider,
        adapter: getAdapter(integ.provider),
        secrets: integ.secrets || {},
        config: integ.config || {},
        mode: modeOf(integ.config),
    };
}

/** A SPECIFIC provider's integration for a tenant (webhook secret lookup). */
async function resolveProviderByName(websiteSlug, provider) {
    const integ = await getSdk().config.getIntegration(websiteSlug, provider);
    if (!integ) {
        throw new GatewayError('PROVIDER_NOT_CONFIGURED', `Provider "${provider}" not configured for tenant "${websiteSlug}"`, 404);
    }
    return {
        provider,
        adapter: getAdapter(provider),
        secrets: integ.secrets || {},
        config: integ.config || {},
        mode: modeOf(integ.config),
    };
}

module.exports = { resolveProvider, resolveProviderByName, GatewayError };

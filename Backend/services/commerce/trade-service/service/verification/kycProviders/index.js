'use strict';
/**
 * KYC provider REGISTRY — the single place a third-party identity-verification
 * vendor is resolved to a live adapter instance, mirroring
 * service/freight/connectors/index.js's registry seam exactly.
 *
 * Empty by design until a real vendor is wired in (see baseKycProvider.js for why
 * there is no simulator fallback). `getActiveProvider()` returning null means
 * "no automated check configured" — callers must keep using the existing manual
 * review path, not silently skip verification.
 *
 * Adding a real vendor later is additive: implement a KycProvider subclass (e.g.
 * sumsubProvider.js) and call `registerProvider('sumsub', () => new SumsubProvider())`
 * — nothing else in the codebase needs to change.
 */
const { KycProvider } = require('./baseKycProvider');

const FACTORIES = {};
const instances = {};

/** Register (or override) the adapter for a vendor name. Accepts an instance or a zero-arg factory. */
function registerProvider(name, providerOrFactory) {
    if (typeof providerOrFactory === 'function') {
        FACTORIES[name] = providerOrFactory;
        delete instances[name];
        return;
    }
    if (providerOrFactory instanceof KycProvider) {
        FACTORIES[name] = () => providerOrFactory;
        instances[name] = providerOrFactory;
        return;
    }
    throw new Error('registerProvider(): expected a KycProvider instance or a factory function');
}

/**
 * The provider to use for new submissions, selected via KYC_PROVIDER=<name> — or
 * null when unset/unregistered, meaning "manual review only" (today's real behavior).
 */
function getActiveProvider() {
    const name = process.env.KYC_PROVIDER;
    if (!name || !FACTORIES[name]) return null;
    if (!instances[name]) instances[name] = FACTORIES[name]();
    return instances[name];
}

function supportedProviders() {
    return Object.keys(FACTORIES);
}

/**
 * Built-in adapters register themselves when their credentials are present, so a
 * deployment enables a vendor purely through configuration — no code change. Adding
 * another vendor is one more entry here plus its adapter file.
 */
function registerBuiltIns() {
    if (process.env.SUMSUB_APP_TOKEN && process.env.SUMSUB_SECRET_KEY) {
        try {
            const { SumsubProvider } = require('./sumsubProvider');
            registerProvider('sumsub', () => new SumsubProvider());
        } catch (err) {
            // A misconfigured vendor must not take the service down, and must not
            // quietly look configured either.
            // eslint-disable-next-line no-console
            console.error('[kyc] sumsub adapter failed to register:', err.message);
        }
    }
}

registerBuiltIns();

module.exports = { registerProvider, getActiveProvider, supportedProviders, registerBuiltIns, KycProvider };

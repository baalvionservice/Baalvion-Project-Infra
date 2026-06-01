'use strict';
/**
 * The single @baalvion/sdk instance for payment-service (CommonJS runtime).
 *
 * payment-service is a pure CONSUMER of the platform: it holds NO secrets of its
 * own. Provider selection and decrypted keys are resolved per-tenant through
 * `sdk.config` (→ the CMS Integrations & Keys vault — the ONLY secret source).
 * It uses the SDK for every cross-cutting concern: config/keys, logging, tracing,
 * events, service-to-service auth, and resilient HTTP. No service bypasses the SDK.
 *
 * Lifecycle: `initSdk()` is awaited once in bootstrap before the listener starts,
 * so `getSdk()` is always ready inside request handlers. The `require('@baalvion/sdk')`
 * is lazy so importing this module never forces the package on CLI scripts.
 */
const config = require('../config/appConfig');

let instance = null;
let initPromise = null;

async function initSdk() {
    if (instance) return instance;
    if (initPromise) return initPromise;
    const { createSdk } = require('@baalvion/sdk');
    initPromise = createSdk({
        service: config.service,
        version: config.version,
        cms: { baseUrl: config.cmsBaseUrl, internalSecret: config.internalSecret },
        internalAuth: { secret: config.internalSecret, scheme: 'shared-secret' },
        eventBus: { transport: config.eventTransport },
        logLevel: config.logLevel,
    }).then((sdk) => {
        instance = sdk;
        initPromise = null;
        return sdk;
    }).catch((err) => {
        // Reset so a later initSdk() can RETRY (e.g. CMS hub briefly unreachable).
        // Intentional — do NOT convert into a persistent error latch.
        initPromise = null;
        throw err;
    });
    return initPromise;
}

function getSdk() {
    if (!instance) {
        throw new Error('[payment-service] SDK not initialised — call initSdk() in bootstrap before use');
    }
    return instance;
}

function tryGetSdk() {
    return instance;
}

module.exports = { initSdk, getSdk, tryGetSdk };

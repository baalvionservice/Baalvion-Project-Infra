'use strict';
/**
 * The single @baalvion/sdk instance for cms-service (CommonJS runtime).
 *
 * cms-service is the platform's SECRET VAULT and admin control plane. It is the
 * one service that owns AES encryption (the integrations store) and resolves its
 * OWN tenant secrets directly from that store — it does NOT call sdk.config for
 * its own secrets (that would be calling itself). cms-service uses the SDK for the
 * cross-cutting standards every service shares: logging, tracing, events,
 * service-to-service auth, and resilient HTTP.
 *
 * Lifecycle: `initSdk()` is awaited once in the server bootstrap (index.js
 * start()) BEFORE the HTTP listener accepts traffic, so by the time any request
 * runs, getSdk() is ready. Module-load of services that merely `require` this file
 * does NOT load the SDK (the require is lazy, inside initSdk) — so CLI scripts and
 * migrations that import services keep working without an SDK instance.
 *
 * NOTE: the typed contract for this layer lives in `src/platform/sdk.ts` (the
 * deferred Phase-F full-TypeScript build target). This .js file is the current
 * runtime; the two are kept in sync intentionally during the strangler migration.
 */
const config = require('../config/appConfig');

let instance = null;
let initPromise = null;

/** Initialise the one SDK instance (call once, from bootstrap). Idempotent. */
async function initSdk() {
    if (instance) return instance;
    if (initPromise) return initPromise;
    // Lazy require: importing this module must not pull in the SDK (keeps seed
    // scripts / migrations that require services from needing the package linked).
    const { createSdk } = require('@baalvion/sdk');
    initPromise = createSdk({
        service: 'cms-service',
        version: config.version,
        cms: {
            baseUrl: config.selfCmsApiBaseUrl,
            internalSecret: config.internalSecret,
        },
        internalAuth: { secret: config.internalSecret, scheme: 'shared-secret' },
        eventBus: { transport: config.eventTransport },
        logLevel: config.logLevel,
    }).then((sdk) => {
        instance = sdk;
        initPromise = null;
        return sdk;
    }).catch((err) => {
        // Reset so a subsequent initSdk() can RETRY (e.g. the CMS hub was briefly
        // unreachable at boot). This re-entry-after-failure is intentional — do
        // NOT turn it into a persistent error latch that blocks all later retries.
        initPromise = null;
        throw err;
    });
    return initPromise;
}

/** Access the initialised SDK. Throws if used before initSdk() completes. */
function getSdk() {
    if (!instance) {
        throw new Error('[cms-service] SDK not initialised — call initSdk() in bootstrap before use');
    }
    return instance;
}

/** Non-throwing accessor: returns the SDK or null (for fail-open script contexts). */
function tryGetSdk() {
    return instance;
}

module.exports = { initSdk, getSdk, tryGetSdk };

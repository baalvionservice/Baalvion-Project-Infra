'use strict';
/**
 * Single @baalvion/sdk instance (CommonJS). Lazy require so CLI scripts (migrate)
 * never force the package. initSdk() is awaited once in index.js before the event
 * consumer / outbox publisher start; getSdk() is then always ready.
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
        eventBus: { transport: config.eventBus.transport },
        logLevel: config.logLevel,
    }).then((sdk) => { instance = sdk; initPromise = null; return sdk; })
      .catch((err) => { initPromise = null; throw err; });
    return initPromise;
}

const getSdk = () => { if (!instance) throw new Error(`[${config.service}] SDK not initialised`); return instance; };
const tryGetSdk = () => instance;

module.exports = { initSdk, getSdk, tryGetSdk };

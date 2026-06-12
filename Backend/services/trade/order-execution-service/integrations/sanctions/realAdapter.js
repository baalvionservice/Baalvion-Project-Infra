'use strict';
/**
 * ============================================================================
 * REAL sanctions-screening adapter — OpenSanctions / yente (PRODUCTION-SAFE).
 * ============================================================================
 * Backend: yente, the open-source OpenSanctions matching API. Screens against
 * the REAL consolidated dataset: OFAC SDN + EU + UN + UK HMT + many more. yente
 * is self-hostable with NO commercial license, so this adapter is fully runnable
 * against real, continuously-refreshed lists for free.
 *
 * To run for real:
 *   docker run -p 8000:8000 ghcr.io/opensanctions/yente:latest
 *     (plus the Elasticsearch/OpenSearch backing store from the yente compose;
 *      see https://www.opensanctions.org/docs/yente/ )
 *   then set YENTE_BASE_URL=http://localhost:8000
 *   — OR use the hosted API: YENTE_BASE_URL=https://api.opensanctions.org
 *     OPENSANCTIONS_API_KEY=<key>   (hosted/licensed datasets require a key)
 *
 * Environment configuration (env / secret manager — NEVER hardcode):
 *   YENTE_BASE_URL                 (required) base URL of the yente instance
 *   OPENSANCTIONS_API_KEY          (optional) only for hosted api.opensanctions.org
 *   SANCTIONS_DATASET              (default 'default') dataset/collection to match
 *   SANCTIONS_CONFIRM_THRESHOLD    (default 0.85) score >= => CONFIRMED_MATCH (block)
 *   SANCTIONS_POTENTIAL_THRESHOLD  (default 0.60) score >= => POTENTIAL_MATCH (block)
 *   SANCTIONS_TIMEOUT_MS           (default 5000) per-attempt hard timeout
 *   SANCTIONS_MAX_MATCHES          (default 10)  cap on returned match detail
 *   SANCTIONS_RETRIES              (default 1)   transient 5xx/timeout retries (read-safe)
 *
 * POSTURE: FAIL-CLOSED.
 *   - Unconfigured (no YENTE_BASE_URL): screen() THROWS IntegrationRequiredError.
 *     The conformance suite tolerates this; the caller treats it as
 *     SCREENING_UNAVAILABLE and BLOCKS the order. We never return CLEAR.
 *   - Configured but the upstream times out / errors: the shared httpClient's
 *     IntegrationTimeoutError / IntegrationHttpError bubbles up (THROWS). Again,
 *     never CLEAR on error.
 *   - Only an explicit empty/low-score response from a reachable dataset is CLEAR.
 *
 * WIRING (supervised step — NOT done here):
 *   Today the live path is `services/sanctionsClient.js` -> risk-service
 *   (in-repo Jaro-Winkler watchlist). To adopt this adapter, EITHER
 *     (a) have `services/sanctionsClient.js` call createRealSanctionsProvider().screen()
 *         instead of POSTing to risk-service, keeping screeningPolicy.decide as-is; OR
 *     (b) keep risk-service as the seam but swap ITS data source to a yente /match
 *         call (same mapping as providers/openSanctions.js).
 *   Either way `services/counterpartyScreening.js` catches a thrown error per party
 *   and `screeningPolicy.decide(..., { failOpen:false })` blocks (SCREENING_UNAVAILABLE).
 */
const openSanctions = require('./providers/openSanctions');
const { IntegrationRequiredError } = require('../IntegrationRequiredError');

const META = Object.freeze({
    domain: 'sanctions',
    vendorOptions: ['OpenSanctions/yente (self-host, no license)', 'OpenSanctions hosted API'],
});

/**
 * @param {{ http?: object, env?: NodeJS.ProcessEnv }} [deps]
 *   Inject `http` (the shared httpClient shape: `{ request(opts) }`) and/or
 *   `env` (an env source) for tests. Both default to the real shared client and
 *   process.env in production.
 * @returns {import('./contract').SanctionsProvider}
 */
function createRealSanctionsProvider(deps = {}) {
    const source = deps.env || process.env;

    return {
        name: 'opensanctions-yente',
        IS_PRODUCTION_SAFE: true,

        /**
         * @param {import('./contract').ScreenRequest} req
         * @returns {Promise<import('./contract').ScreenResult>}
         */
        async screen(req) {
            // FAIL-CLOSED even when unconfigured: throw (not CLEAR). The
            // conformance suite + counterpartyScreening both tolerate this.
            if (!openSanctions.isConfigured(source)) {
                throw new IntegrationRequiredError(
                    'sanctions screening not configured (YENTE_BASE_URL missing)',
                    META,
                );
            }
            return openSanctions.screen(req, { http: deps.http, env: source });
        },
    };
}

module.exports = { createRealSanctionsProvider };

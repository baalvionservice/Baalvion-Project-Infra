'use strict';
/**
 * The REAL OpenSanctions/yente adapter must pass the shared sanctions
 * conformance suite with { productionSafe: true }.
 *
 * The factory is constructed WITHOUT YENTE_BASE_URL (env:{}), so screen() throws
 * IntegrationRequiredError. The suite explicitly tolerates that throw as a valid
 * fail-closed signal (see ./conformance.test.js: it catches and asserts the error
 * is an IntegrationRequiredError, then returns). This keeps the adapter
 * production-safe (IS_PRODUCTION_SAFE: true) while NEVER returning CLEAR on an
 * unconfigured/unavailable backend.
 */
const { runConformanceSuite } = require('./conformance.test');
const { createRealSanctionsProvider } = require('./realAdapter');

runConformanceSuite(() => createRealSanctionsProvider({ env: {} }), { productionSafe: true });

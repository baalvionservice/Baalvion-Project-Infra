'use strict';
/**
 * Runs the shared carrier conformance suite against the REAL AfterShip adapter
 * with { productionSafe: true }. No live network: with an empty env the adapter
 * is unconfigured but — honoring the FAIL-OPEN posture — still resolves track()
 * to a valid degraded result (it never throws), which is exactly what the suite
 * permits for a production-safe carrier provider.
 */
const { runConformanceSuite } = require('./conformance.test');
const { createRealCarrierProvider } = require('./realAdapter');

runConformanceSuite(() => createRealCarrierProvider({ env: {} }), { productionSafe: true });

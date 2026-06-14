'use strict';
/**
 * Runs the shared PSP conformance suite against the REAL multi-gateway adapter
 * with { productionSafe: true }. Unconfigured (env: {}) means every method throws
 * IntegrationRequiredError, which the suite explicitly tolerates — proving the
 * adapter is production-safe AND never silently no-ops without credentials.
 */
const { runConformanceSuite } = require('./conformance.test');
const { createRealPaymentProvider } = require('./realAdapter');

runConformanceSuite(() => createRealPaymentProvider({ env: {} }), { productionSafe: true });

'use strict';
/**
 * The real Onfido adapter must satisfy the SAME KYC contract conformance suite
 * with { productionSafe: true }. Built with env:{} so ONFIDO_API_TOKEN is absent
 * — the suite tolerates an unconfigured production-safe adapter throwing
 * IntegrationRequiredError (mirrors the payment domain), while still asserting
 * IS_PRODUCTION_SAFE === true and the full method surface.
 */
const { runConformanceSuite } = require('./conformance.test');
const { createRealKycProvider } = require('./realAdapter');

runConformanceSuite(() => createRealKycProvider({ env: {} }), { productionSafe: true });

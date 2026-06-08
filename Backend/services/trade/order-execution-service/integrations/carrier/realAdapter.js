'use strict';
/**
 * ============================================================================
 * REAL carrier-tracking adapter — SCAFFOLD ONLY (throws IntegrationRequiredError).
 * ============================================================================
 * Vendor options: Project44, FourKites, Freightos, carrier EDI, AIS feeds.
 *
 * Required configuration (env / secret manager — NEVER hardcode):
 *   CARRIER_PROVIDER       'project44' | 'fourkites' | 'freightos' | 'edi' | 'ais'
 *   CARRIER_API_BASE_URL
 *   CARRIER_API_KEY / _SECRET
 *   CARRIER_ACCOUNT_ID     visibility network account / shipper id
 *
 * Prerequisite:
 *   A visibility-network subscription (or direct carrier EDI/AIS feed agreements).
 *   NOTE: although this scaffold throws, a real implementation MUST honor the
 *   fail-OPEN posture — on provider error it returns degraded:true, it does not
 *   propagate the failure into the order path.
 */
const { IntegrationRequiredError } = require('../IntegrationRequiredError');

const META = {
    domain: 'carrier',
    vendorOptions: ['Project44', 'FourKites', 'Freightos', 'carrier EDI', 'AIS'],
};

/** @returns {import('./contract').CarrierProvider} */
function createRealCarrierProvider() {
    return {
        name: 'real-carrier-scaffold',
        IS_PRODUCTION_SAFE: false,
        async track() {
            throw new IntegrationRequiredError('carrier-tracking integration not configured (track)', META);
        },
    };
}

module.exports = { createRealCarrierProvider };

'use strict';
/**
 * ============================================================================
 * REAL customs broker / single-window adapter — SCAFFOLD ONLY.
 * ============================================================================
 * Vendor options: Descartes, e2open, or direct national single-windows
 *   (US ACE/ABI, EU ICS2, UK CDS, India ICEGATE).
 *
 * Required configuration (env / secret manager — NEVER hardcode):
 *   CUSTOMS_PROVIDER        'descartes' | 'e2open' | 'us_ace' | 'eu_ics2' | 'uk_cds' | 'in_icegate'
 *   CUSTOMS_API_BASE_URL
 *   CUSTOMS_CLIENT_CERT / CUSTOMS_CLIENT_KEY   mTLS material for the gateway
 *   CUSTOMS_DECLARANT_ID    the licensed declarant on whose behalf filing occurs
 *   CUSTOMS_EORI / CUSTOMS_BROKER_LICENSE      jurisdiction identifiers
 *
 * Licensing / certification prerequisite:
 *   A licensed customs broker (or in-house customs authorization) and the
 *   provider's production accreditation per jurisdiction are MANDATORY. Filing
 *   carries statutory declarant liability. submitDeclaration throws until a
 *   certified integration is in place AND IS_PRODUCTION_SAFE is set true after
 *   passing conformance with { productionSafe: true }.
 */
const { IntegrationRequiredError } = require('../IntegrationRequiredError');

const META = {
    domain: 'customs',
    vendorOptions: ['Descartes', 'e2open', 'US ACE/ABI', 'EU ICS2', 'UK CDS', 'India ICEGATE'],
};

/** @returns {import('./contract').CustomsProvider} */
function createRealCustomsProvider() {
    return {
        name: 'real-customs-scaffold',
        IS_PRODUCTION_SAFE: false,
        async validateDeclaration() {
            throw new IntegrationRequiredError('customs integration not configured (validateDeclaration)', META);
        },
        async submitDeclaration() {
            throw new IntegrationRequiredError('customs integration not configured (submitDeclaration — LEGAL filing act)', META);
        },
        async getStatus() {
            throw new IntegrationRequiredError('customs integration not configured (getStatus)', META);
        },
    };
}

module.exports = { createRealCustomsProvider };

'use strict';
/**
 * ============================================================================
 * REAL e-Bill of Lading registry adapter — SCAFFOLD ONLY.
 * ============================================================================
 * Vendor options: WaveBL, essDOCS/Bolero (MLETR-compliant eB/L platforms).
 *
 * Required configuration (env / secret manager — NEVER hardcode):
 *   EBL_PROVIDER          'wavebl' | 'bolero' | 'essdocs'
 *   EBL_API_BASE_URL
 *   EBL_API_KEY / _SECRET
 *   EBL_PARTICIPANT_ID    onboarded registry participant id
 *   EBL_SIGNING_KEY_REF   key reference for endorsement signatures
 *
 * Legal / certification prerequisite:
 *   Onboarding to an MLETR-compliant registry that guarantees singularity,
 *   control and integrity of the document of title, plus a legal framework
 *   (e.g. UK ETDA 2023 / MLETR-enacting jurisdiction). issue/transfer are legal
 *   acts and throw until a certified registry integration is live AND
 *   IS_PRODUCTION_SAFE is set true after passing conformance { productionSafe:true }.
 */
const { IntegrationRequiredError } = require('../IntegrationRequiredError');

const META = { domain: 'ebl', vendorOptions: ['WaveBL', 'essDOCS/Bolero'] };

/** @returns {import('./contract').EblProvider} */
function createRealEblProvider() {
    return {
        name: 'real-ebl-scaffold',
        IS_PRODUCTION_SAFE: false,
        async issue() {
            throw new IntegrationRequiredError('eB/L registry integration not configured (issue — LEGAL title act)', META);
        },
        async transfer() {
            throw new IntegrationRequiredError('eB/L registry integration not configured (transfer — LEGAL endorsement act)', META);
        },
        async getStatus() {
            throw new IntegrationRequiredError('eB/L registry integration not configured (getStatus)', META);
        },
    };
}

module.exports = { createRealEblProvider };

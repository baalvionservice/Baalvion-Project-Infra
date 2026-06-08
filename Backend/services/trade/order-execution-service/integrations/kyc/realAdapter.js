'use strict';
/**
 * ============================================================================
 * REAL KYC/IDV adapter — SCAFFOLD ONLY (throws IntegrationRequiredError).
 * ============================================================================
 * Vendor options: Onfido, Persona, Sumsub, Jumio.
 *
 * Required configuration (env / secret manager — NEVER hardcode):
 *   KYC_PROVIDER          'onfido' | 'persona' | 'sumsub' | 'jumio'
 *   KYC_API_BASE_URL
 *   KYC_API_KEY / _SECRET
 *   KYC_WORKFLOW_ID       provider verification flow / template id
 *   KYC_WEBHOOK_SECRET    to verify async decision callbacks
 *
 * Compliance prerequisite:
 *   A signed DPA + the correct verification workflow approved by compliance,
 *   data-residency configuration per jurisdiction, and retention of the
 *   verification audit trail. PII must never be logged. Throws until configured.
 */
const { IntegrationRequiredError } = require('../IntegrationRequiredError');

const META = { domain: 'kyc', vendorOptions: ['Onfido', 'Persona', 'Sumsub', 'Jumio'] };

/** @returns {import('./contract').KycProvider} */
function createRealKycProvider() {
    return {
        name: 'real-kyc-scaffold',
        IS_PRODUCTION_SAFE: false,
        async startVerification() {
            throw new IntegrationRequiredError('KYC/IDV integration not configured (startVerification)', META);
        },
        async getResult() {
            throw new IntegrationRequiredError('KYC/IDV integration not configured (getResult)', META);
        },
    };
}

module.exports = { createRealKycProvider };

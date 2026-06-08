'use strict';
/**
 * ============================================================================
 * REAL sanctions-list adapter — SCAFFOLD ONLY (throws IntegrationRequiredError).
 * ============================================================================
 * Vendor options: ComplyAdvantage, Refinitiv World-Check, Dow Jones.
 * Dataset: consolidated OFAC SDN + EU + UN + UK HMT (plus PEP / adverse media).
 *
 * Required configuration (env / secret manager — NEVER hardcode):
 *   SANCTIONS_PROVIDER         'complyadvantage' | 'worldcheck' | 'dowjones'
 *   SANCTIONS_API_BASE_URL
 *   SANCTIONS_API_KEY
 *   SANCTIONS_LIST_PROFILE     subscribed list bundle (OFAC/EU/UN/UK + fuzziness)
 *   SANCTIONS_MIN_SCORE        match threshold for POTENTIAL vs CONFIRMED
 *
 * Licensing prerequisite:
 *   A paid data license with the provider is required — the sanctions lists are
 *   proprietary, continuously refreshed datasets. The screening config must be
 *   reviewed/signed-off by compliance, and an audit trail of every screen must
 *   be retained. FAIL-CLOSED: this scaffold throws (which the caller treats as
 *   SCREENING_UNAVAILABLE → BLOCK) until a real provider is wired.
 */
const { IntegrationRequiredError } = require('../IntegrationRequiredError');

const META = {
    domain: 'sanctions',
    vendorOptions: ['ComplyAdvantage', 'Refinitiv World-Check', 'Dow Jones'],
};

/** @returns {import('./contract').SanctionsProvider} */
function createRealSanctionsProvider() {
    return {
        name: 'real-sanctions-scaffold',
        IS_PRODUCTION_SAFE: false,
        async screen() {
            throw new IntegrationRequiredError('sanctions-list integration not configured (screen)', META);
        },
    };
}

module.exports = { createRealSanctionsProvider };

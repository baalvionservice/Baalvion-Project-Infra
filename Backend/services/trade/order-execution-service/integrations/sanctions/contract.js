'use strict';
/**
 * ============================================================================
 * SANCTIONS LIST PROVIDER — integration contract
 * ============================================================================
 * Seam point today: `services/sanctionsClient.js` (POST /api/v1/sanctions/screen
 * to risk-service) + `services/screeningPolicy.js` (decides ALLOW/BLOCK). The
 * risk-service runs an in-repo Jaro-Winkler watchlist — NOT an authoritative,
 * continuously-refreshed sanctions dataset.
 *
 * Real vendor = ComplyAdvantage / Refinitiv World-Check / Dow Jones, screening
 * against the consolidated OFAC SDN + EU + UN + UK HMT lists (plus PEP/adverse
 * media). The list data is licensed and updated continuously; it CANNOT be
 * reproduced in-repo.
 *
 * POSTURE: FAIL-CLOSED. If the provider is unavailable or times out, the order
 * is BLOCKED (SCREENING_UNAVAILABLE), never allowed through. Matches the
 * existing screeningPolicy.decide(..., { failOpen:false }) default.
 */

/**
 * Normalized screening status. Mirrors the values screeningPolicy.js already
 * reasons over (CONFIRMED_MATCH / POTENTIAL_MATCH block; CLEAR allows).
 * @readonly
 * @enum {string}
 */
const SCREENING_STATUS = Object.freeze({
    CLEAR: 'CLEAR',
    POTENTIAL_MATCH: 'POTENTIAL_MATCH',
    CONFIRMED_MATCH: 'CONFIRMED_MATCH',
});

/** Statuses that MUST block the order (fail-closed). */
const BLOCKING_STATUSES = Object.freeze(['CONFIRMED_MATCH', 'POTENTIAL_MATCH']);

/**
 * @typedef {Object} ScreenRequest
 * @property {string} name      party legal/display name to screen
 * @property {string} [country] ISO-3166 alpha-2 of the party
 * @property {string} [tenantId] UUID; forwarded as X-Tenant-ID for the audit row
 */

/**
 * @typedef {Object} SanctionsMatch
 * @property {string} listName   e.g. 'OFAC-SDN' | 'EU' | 'UN' | 'UK-HMT'
 * @property {string} matchedName
 * @property {number} score      0..1 match confidence
 * @property {string} [entityId] provider reference for the listed entity
 */

/**
 * @typedef {Object} ScreenResult
 * @property {keyof typeof SCREENING_STATUS} status
 * @property {number} confidence  0..1 aggregate confidence
 * @property {SanctionsMatch[]} matches
 */

/**
 * @typedef {Object} SanctionsProvider
 * @property {string} name
 * @property {boolean} IS_PRODUCTION_SAFE
 * @property {(req: ScreenRequest) => Promise<ScreenResult>} screen
 *   Returns the verdict. Mirrors sanctionsClient.screen().
 */

/**
 * @readonly
 */
const FAILURE_MODES = Object.freeze({
    TIMEOUT: 'On timeout/unavailability the result is treated as SCREENING_UNAVAILABLE and the order is BLOCKED (fail-closed). The caller must NOT proceed on a missing verdict.',
    IDEMPOTENCY: 'screen() is read-only and safe to retry; retries do not change list state. The provider, not the caller, owns the audit trail.',
    PARTIAL: 'If only some configured lists answer, the verdict reflects the highest-severity available match; a fully missing dataset is treated as unavailable (blocked), not CLEAR.',
    POSTURE: 'FAIL-CLOSED. CONFIRMED_MATCH and POTENTIAL_MATCH block. Unknown/error blocks. Only an explicit CLEAR from a real, licensed dataset allows the order.',
});

module.exports = {
    SCREENING_STATUS,
    BLOCKING_STATUSES,
    FAILURE_MODES,
};

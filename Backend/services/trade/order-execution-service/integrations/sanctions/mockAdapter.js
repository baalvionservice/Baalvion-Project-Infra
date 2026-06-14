'use strict';
/**
 * ⚠️ DEV-ONLY in-memory sanctions mock. NOT PRODUCTION SAFE. The watchlist here
 * is a tiny fixture — it is NOT the OFAC/EU/UN/UK consolidated lists and must
 * never be used to make a real compliance decision.
 *
 * Satisfies the sanctions contract for local testing. Defaults to CLEAR; any
 * name containing a seeded token returns a match so the fail-closed/blocking
 * paths can be exercised.
 */
const { SCREENING_STATUS } = require('./contract');

const SEED_WATCHLIST = Object.freeze([
    { token: 'sdn-test', listName: 'OFAC-SDN', status: SCREENING_STATUS.CONFIRMED_MATCH },
    { token: 'maybe-test', listName: 'EU', status: SCREENING_STATUS.POTENTIAL_MATCH },
]);

/** @returns {import('./contract').SanctionsProvider} */
function createMockSanctionsProvider() {
    return {
        name: 'mock-sanctions',
        IS_PRODUCTION_SAFE: false,

        async screen(req) {
            const name = String(req && req.name || '').toLowerCase();
            const hit = SEED_WATCHLIST.find((w) => name.includes(w.token));
            if (!hit) {
                return { status: SCREENING_STATUS.CLEAR, confidence: 0, matches: [] };
            }
            const score = hit.status === SCREENING_STATUS.CONFIRMED_MATCH ? 0.98 : 0.71;
            return {
                status: hit.status,
                confidence: score,
                matches: [{ listName: hit.listName, matchedName: req.name, score, entityId: `MOCK-${hit.token}` }],
            };
        },
    };
}

module.exports = { createMockSanctionsProvider, IS_PRODUCTION_SAFE: false };

'use strict';
/**
 * ⚠️ DEV-ONLY in-memory customs mock. NOT PRODUCTION SAFE.
 *
 * It MAY validate a draft declaration locally (pure shape/HS checks) for testing.
 * It MUST NEVER file: `submitDeclaration` THROWS a loud
 * "NOT LEGALLY VALID — INTEGRATION REQUIRED" error, because lodging a customs
 * declaration is a legal act that only a certified broker/single-window may do.
 */
const { DECLARATION_STATUS } = require('./contract');

/** @returns {import('./contract').CustomsProvider} */
function createMockCustomsProvider() {
    const drafts = new Map();
    let seq = 0;

    return {
        name: 'mock-customs',
        IS_PRODUCTION_SAFE: false,

        async validateDeclaration(req) {
            if (!req || !req.idempotencyKey) throw new Error('idempotencyKey required');
            if (!Array.isArray(req.lines) || req.lines.length === 0) {
                throw new Error('declaration requires at least one line');
            }
            const missingHs = req.lines.find((l) => !l.hsCode);
            const id = `mock_dec_${++seq}`;
            const result = {
                id,
                idempotencyKey: req.idempotencyKey,
                status: missingHs ? DECLARATION_STATUS.DRAFT : DECLARATION_STATUS.VALIDATED,
                notices: missingHs ? ['MISSING_HS_CODE'] : ['MOCK_VALIDATED_LOCAL_ONLY'],
            };
            drafts.set(req.idempotencyKey, result);
            return result;
        },

        async submitDeclaration() {
            // HARD STOP — filing is a legal act. A mock must never pretend success.
            throw new Error(
                'NOT LEGALLY VALID — INTEGRATION REQUIRED: the mock customs adapter cannot ' +
                'file a declaration. Lodging with a customs authority is a legal act that ' +
                'requires a certified broker / single-window integration (Descartes/e2open, ' +
                'US ACE/ABI, EU ICS2, UK CDS, India ICEGATE).'
            );
        },

        async getStatus(id) {
            for (const v of drafts.values()) if (v.id === id) return v;
            throw new Error(`unknown declaration ${id}`);
        },
    };
}

module.exports = { createMockCustomsProvider, IS_PRODUCTION_SAFE: false };

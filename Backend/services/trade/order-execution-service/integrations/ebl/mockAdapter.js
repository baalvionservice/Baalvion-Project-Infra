'use strict';
/**
 * ⚠️ DEV-ONLY in-memory eB/L mock. NOT PRODUCTION SAFE.
 *
 * It MAY hold a DRAFT for local testing. It MUST NEVER issue or transfer title:
 * `issue` and `transfer` THROW a loud "NOT LEGALLY VALID — INTEGRATION REQUIRED"
 * error. A generated record here is NOT a negotiable instrument and confers no
 * document of title.
 */

/** @returns {import('./contract').EblProvider} */
function createMockEblProvider() {
    const drafts = new Map();
    let seq = 0;

    function refuse(act) {
        throw new Error(
            `NOT LEGALLY VALID — INTEGRATION REQUIRED: the mock eB/L adapter cannot ${act} ` +
            'a Bill of Lading. An eB/L is a negotiable instrument (document of title); ' +
            'issuing/transferring it requires a certified MLETR-compliant registry ' +
            '(WaveBL, essDOCS/Bolero). A generated PDF is not a negotiable instrument.'
        );
    }

    return {
        name: 'mock-ebl',
        IS_PRODUCTION_SAFE: false,

        async issue() { refuse('issue'); },
        async transfer() { refuse('transfer'); },

        async getStatus(id) {
            for (const v of drafts.values()) if (v.id === id) return v;
            throw new Error(`unknown eB/L ${id}`);
        },

        // Test/dev convenience: stage a non-title DRAFT only (clearly not issued).
        async _stageDraft(req) {
            const id = `mock_ebl_${++seq}`;
            const draft = { id, idempotencyKey: req.idempotencyKey, status: 'DRAFT', registry: 'MOCK' };
            drafts.set(req.idempotencyKey, draft);
            return draft;
        },
    };
}

module.exports = { createMockEblProvider, IS_PRODUCTION_SAFE: false };

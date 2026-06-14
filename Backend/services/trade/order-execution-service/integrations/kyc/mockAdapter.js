'use strict';
/**
 * ⚠️ DEV-ONLY in-memory KYC/IDV mock. NOT PRODUCTION SAFE. Performs NO real
 * identity verification — it never inspects a document or a face. Defaults to
 * APPROVED so happy-path flows run locally; names containing 'reject-test' /
 * 'review-test' exercise the negative branches.
 */
const { KYC_STATUS } = require('./contract');

/** @returns {import('./contract').KycProvider} */
function createMockKycProvider() {
    const store = new Map(); // idempotencyKey -> KycResult
    const byId = new Map();
    let seq = 0;

    function resolveStatus(subject) {
        const n = String(subject.fullName || subject.legalName || '').toLowerCase();
        if (n.includes('reject-test')) return KYC_STATUS.REJECTED;
        if (n.includes('review-test')) return KYC_STATUS.REVIEW;
        return KYC_STATUS.APPROVED;
    }

    return {
        name: 'mock-kyc',
        IS_PRODUCTION_SAFE: false,

        async startVerification(subject) {
            if (!subject || !subject.idempotencyKey) throw new Error('idempotencyKey required');
            const existing = store.get(subject.idempotencyKey);
            if (existing) return existing;
            const id = `mock_kyc_${++seq}`;
            const status = resolveStatus(subject);
            const result = {
                id,
                idempotencyKey: subject.idempotencyKey,
                status,
                providerRef: `MOCK-IDV-${id}`,
                ...(status === KYC_STATUS.REJECTED ? { reasons: ['MOCK_REJECT'] } : {}),
                ...(status === KYC_STATUS.REVIEW ? { reasons: ['MOCK_REVIEW'] } : {}),
            };
            store.set(subject.idempotencyKey, result);
            byId.set(id, subject.idempotencyKey);
            return result;
        },

        async getResult(id) {
            const key = byId.get(id);
            if (!key) throw new Error(`unknown verification ${id}`);
            return store.get(key);
        },
    };
}

module.exports = { createMockKycProvider, IS_PRODUCTION_SAFE: false };

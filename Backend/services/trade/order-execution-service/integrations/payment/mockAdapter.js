'use strict';
/**
 * ⚠️ DEV-ONLY in-memory PSP mock. NOT PRODUCTION SAFE. Moves no real money.
 * Satisfies the payment contract for local testing + the conformance suite.
 * Mirrors the simulated behavior of workers/paymentSimulator.js: an initiate
 * immediately reaches a terminal COMPLETED (configurable) and is idempotent.
 */
const { PAYMENT_STATUS, PAYMENT_RAIL } = require('./contract');

/**
 * @param {{ defaultStatus?: keyof typeof PAYMENT_STATUS }} [cfg]
 * @returns {import('./contract').PaymentProvider}
 */
function createMockPaymentProvider(cfg = {}) {
    const store = new Map(); // idempotencyKey -> PaymentResult
    const byId = new Map();  // id -> idempotencyKey
    const defaultStatus = cfg.defaultStatus || PAYMENT_STATUS.COMPLETED;
    let seq = 0;

    return {
        name: 'mock-psp',
        IS_PRODUCTION_SAFE: false,

        async initiate(req) {
            if (!req || !req.idempotencyKey) throw new Error('idempotencyKey required');
            // Idempotent replay: same key returns the original result.
            const existing = store.get(req.idempotencyKey);
            if (existing) return existing;
            const id = `mock_pay_${++seq}`;
            const result = {
                id,
                idempotencyKey: req.idempotencyKey,
                status: defaultStatus,
                amount: req.amount,
                currency: req.currency,
                rail: req.paymentScheme || PAYMENT_RAIL.INTERNAL,
                providerRef: `MOCK-UETR-${id}`,
                ...(defaultStatus === PAYMENT_STATUS.FAILED ? { failureReason: 'MOCK_FORCED_FAILURE' } : {}),
            };
            store.set(req.idempotencyKey, result);
            byId.set(id, req.idempotencyKey);
            return result;
        },

        async getStatus(id) {
            const key = byId.get(id);
            if (!key) throw new Error(`unknown payment ${id}`);
            return store.get(key);
        },

        async cancel(id, opts = {}) {
            const key = byId.get(id);
            if (!key) throw new Error(`unknown payment ${id}`);
            const cur = store.get(key);
            const cancelled = { ...cur, status: PAYMENT_STATUS.CANCELLED };
            store.set(key, cancelled);
            return cancelled;
        },
    };
}

module.exports = { createMockPaymentProvider, IS_PRODUCTION_SAFE: false };

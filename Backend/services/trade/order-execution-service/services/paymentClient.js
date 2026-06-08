'use strict';
/**
 * Client for the payment-service initiation API (E2E money loop).
 * oes triggers a real payment when an order's payment is confirmed; payment-service
 * then drives the Kafka choreography (ledger double-entry posting → completion),
 * and the completion returns to oes via the signed finance-events webhook.
 *
 * POST {url}/api/v1/payments/initiate
 *   in  { idempotencyKey, sourceAccountId, destinationAccountId, amount, currency, paymentScheme }
 *   out { id, status, ... }
 */
const config = require('../config/appConfig');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function initiate(payment, opts = {}) {
    const url = opts.url || config.payment.url;
    const timeoutMs = opts.timeoutMs || config.payment.timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (payment.tenantId && UUID_RE.test(String(payment.tenantId))) headers['X-Tenant-ID'] = String(payment.tenantId);
        const res = await fetch(`${url}/api/v1/payments/initiate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                idempotencyKey: payment.idempotencyKey,
                sourceAccountId: payment.sourceAccountId,
                destinationAccountId: payment.destinationAccountId,
                amount: payment.amount,
                currency: payment.currency,
                paymentScheme: payment.paymentScheme || 'INTERNAL',
            }),
            signal: controller.signal,
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = (body && body.message) || `payment initiate HTTP ${res.status}`;
            const err = new Error(msg);
            err.status = res.status;
            throw err;
        }
        return body;
    } finally {
        clearTimeout(timer);
    }
}

module.exports = { initiate };

'use strict';
/**
 * Payment initiation client (E2E money loop). Rail is selectable via
 * config.payment.provider:
 *   'internal'  — POST payment-service /api/v1/payments/initiate (Java drives the
 *                 Kafka choreography -> ledger double-entry; settled back via the
 *                 signed /finance-events webhook).
 *   'razorpayx' — the REAL RazorpayX payout adapter; settled back via the
 *                 /webhooks/razorpay HMAC webhook -> the same saga cascade.
 * Both are FAIL-CLOSED on the money decision: a timeout is UNKNOWN, never success;
 * reconcile via the webhook/getStatus using the SAME idempotencyKey, never re-initiate.
 *
 * Internal: POST {url}/api/v1/payments/initiate
 *   in  { idempotencyKey, sourceAccountId, destinationAccountId, amount, currency, paymentScheme }
 *   out { id, status, ... }
 */
const config = require('../config/appConfig');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Lazily construct the real PSP router once (reads its own RAZORPAYX_*/etc env).
let _psp = null;
function pspProvider() {
    if (!_psp) {
        _psp = require('../integrations/payment/realAdapter').createRealPaymentProvider();
    }
    return _psp;
}

async function initiate(payment, opts = {}) {
    // Rail routing — opts.provider/opts.psp let tests inject without env.
    const provider = opts.provider || config.payment.provider;
    if (provider === 'razorpayx') {
        const psp = opts.psp || pspProvider();
        // RazorpayX pays out in INR; destinationAccountId must be a RazorpayX fund_account_id.
        // The adapter is idempotent on idempotencyKey and surfaces IntegrationTimeoutError
        // (UNKNOWN, not success) on timeout — the order stays 'pending' for webhook reconcile.
        return psp.initiate({
            idempotencyKey: payment.idempotencyKey,
            sourceAccountId: payment.sourceAccountId,
            destinationAccountId: payment.destinationAccountId,
            amount: payment.amount,
            currency: payment.currency,
            paymentScheme: payment.paymentScheme || 'IMPS',
            tenantId: payment.tenantId,
            metadata: payment.metadata,
        });
    }

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

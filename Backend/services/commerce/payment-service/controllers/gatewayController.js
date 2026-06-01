'use strict';
/**
 * Gateway-checkout HTTP layer.
 *   POST /v1/gateway/payments            (auth)         — create a payment intent
 *   GET  /v1/gateway/payments/:id        (auth)         — fetch a payment
 *   POST /v1/gateway/webhooks/:provider?site=slug (no JWT, signature-verified)
 *
 * Webhooks ALWAYS return 200 once accepted/duplicate so the provider stops
 * retrying; signature failures return 401; processing faults return 5xx (retry).
 */
const svc = require('../services/gatewayPaymentService');
const db = require('../models');
const { logger } = require('../platform/logger');

function send(res, status, body) {
    return res.status(status).json(body);
}

function fail(res, err, mod) {
    const status = err.statusCode || 500;
    if (status >= 500) logger(mod).error({ err: err && err.message, code: err && err.code }, 'gateway error');
    return send(res, status, { success: false, error: { code: err.code || 'INTERNAL', message: err.message || 'Unexpected error' } });
}

async function createPayment(req, res) {
    try {
        // Trusted internal caller (internalAuthGuard) supplies its own tenant in
        // the body — not from an untrusted header.
        const out = await svc.createIntent({
            websiteSlug: req.body.websiteSlug,
            amount: req.body.amount,
            currency: (req.body.currency || 'INR').toUpperCase(),
            idempotencyKey: req.body.idempotencyKey || req.headers['x-idempotency-key'],
            receipt: req.body.receipt,
            notes: req.body.notes,
            metadata: req.body.metadata,
        });
        return send(res, out.idempotentReplay ? 200 : 201, { success: true, data: out });
    } catch (err) {
        return fail(res, err, 'gateway');
    }
}

async function getPayment(req, res) {
    try {
        // Tenant-scoped read: the caller must name its tenant; an id from another
        // tenant is indistinguishable from a true 404 (no cross-tenant IDOR).
        const websiteSlug = req.query.site || req.query.websiteSlug;
        if (!websiteSlug) return send(res, 400, { success: false, error: { code: 'VALIDATION', message: 'site (websiteSlug) query param is required' } });
        const gp = await db.GatewayPayment.findOne({
            where: { id: req.params.id, websiteSlug },
            include: [{ model: db.PaymentLedgerEntry, as: 'ledgerEntries' }],
        });
        if (!gp) return send(res, 404, { success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
        return send(res, 200, { success: true, data: gp.toJSON() });
    } catch (err) {
        return fail(res, err, 'gateway');
    }
}

async function handleWebhook(req, res) {
    try {
        // The tenant slug MUST come from the URL (?site=), fixed at webhook
        // registration time — NEVER from an attacker-settable request header.
        const websiteSlug = req.query.site || req.query.websiteSlug;
        if (!websiteSlug) return send(res, 400, { success: false, error: { code: 'VALIDATION', message: 'site (websiteSlug) query param is required on the webhook URL' } });
        const out = await svc.handleWebhook({
            provider: req.params.provider,
            websiteSlug,
            rawBody: req.rawBody,
            body: req.body,
            headers: req.headers,
        });
        return send(res, 200, { success: true, processed: out.processed, duplicate: out.duplicate });
    } catch (err) {
        return fail(res, err, 'webhook');
    }
}

module.exports = { createPayment, getPayment, handleWebhook };

'use strict';
/**
 * Java → Node finance-events bridge (HMAC-SHA256). Persistent idempotency via
 * oms.processed_webhooks (P0-5), then cascades payment terminal state onto the
 * linked order. Runs under tenant bypass (trusted writer).
 *
 * F7: the idempotency marker AND the order cascade commit in ONE transaction.
 * If the cascade fails the marker rolls back too, so the sender can safely retry
 * (no "marked processed but order never updated" lost-update window).
 */
const crypto = require('crypto');
const db = require('../models');
const config = require('../config/appConfig');
const { runWithTenant } = require('@baalvion/tenancy');
const { orderTransitionFor } = require('../services/orderSaga');
const { orderRefFromPayload } = require('../services/financeRef');

function verifySignature(req) {
    const header = req.headers['x-webhook-signature'] || '';
    const secret = config.finance.webhookSecret;
    if (!secret || !header.startsWith('sha256=')) return false;
    const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');
    const a = Buffer.from(header); const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function refOf(p) { return orderRefFromPayload(p); }

// Cascade within an EXISTING transaction (the caller owns the tenant context).
async function cascadeInTx(t, eventType, payload) {
    const tr = orderTransitionFor(eventType);
    const orderId = refOf(payload);
    if (!tr || !orderId) return { matched: false };
    const order = await db.Order.findByPk(String(orderId), { transaction: t });
    if (!order) return { matched: false, orderId };
    order.payment_status = tr.payment_status;
    if (tr.order_status) order.status = tr.order_status;
    await order.save({ transaction: t });
    await db.OrderSagaState.upsert({
        order_id: String(order.id), tenant_id: order.tenant_id,
        state: tr.state, last_event: eventType, updated_at: new Date(),
    }, { transaction: t });
    return { matched: true, orderId: order.id, state: tr.state };
}

exports.financeEvents = async (req, res) => {
    if (!verifySignature(req)) return res.status(401).json({ error: { code: 'BAD_SIGNATURE', message: 'invalid webhook signature' } });
    const eventType = req.headers['x-webhook-event'] || (req.body && req.body.eventType) || 'unknown';
    const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    // Content-hash fallback gives idempotency even when no explicit webhook id is sent.
    const webhookId = req.headers['x-webhook-id'] || `${eventType}:${hash}`;

    try {
        const result = await runWithTenant({ tenantId: null, bypass: true }, () =>
            db.sequelize.transaction(async (t) => {
                // Unique PK on webhook_id makes this the atomic dedup gate. A duplicate
                // throws SequelizeUniqueConstraintError → caught below → 200 deduped.
                await db.ProcessedWebhook.create({ webhook_id: webhookId, event_type: eventType, payload_hash: hash }, { transaction: t });
                if (eventType.startsWith('payments.')) return cascadeInTx(t, eventType, req.body || {});
                return { matched: false };
            }));
        return res.status(200).json({ ok: true, event: eventType, result });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(200).json({ ok: true, deduped: true, event: eventType });
        }
        // Cascade failed → marker rolled back. Signal retry (at-least-once delivery).
        console.error(`[${config.service}] finance-event processing failed:`, eventType, err.message);
        return res.status(500).json({ error: { code: 'CASCADE_FAILED', message: 'event processing failed; retry' } });
    }
};

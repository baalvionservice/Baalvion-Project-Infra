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
const { orderTransitionFor, canTransition } = require('../services/orderSaga');
const { orderRefFromPayload } = require('../services/financeRef');
const { OrderEvents } = require('../platform/events');

const ACCT_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Strip CR/LF/tab from dynamic values before logging (no log-injection / forging).
const sanitize = (v) => String(v == null ? '' : v).replace(/[\r\n\t]/g, ' ');

// Pure decision: may we write the settlement GL outbox row? Skips when (a) a prior
// SETTLEMENT_LEDGER_POST row already exists (app-layer dedup — no second GL post intent),
// (b) either chart-of-accounts id is not a UUID, or (c) the order's tenant id is not a UUID
// (never post a GL entry under an ambiguous tenant). Unit-tested in isolation.
function shouldWriteLedgerOutbox({ existing, debitAccountId, creditAccountId, tenantId }) {
    if (existing) return { write: false, reason: 'dedup' };
    if (!ACCT_UUID_RE.test(String(debitAccountId)) || !ACCT_UUID_RE.test(String(creditAccountId))) {
        return { write: false, reason: 'non_uuid_accounts' };
    }
    if (!ACCT_UUID_RE.test(String(tenantId))) return { write: false, reason: 'non_uuid_tenant' };
    return { write: true };
}

// Money is DECIMAL(20,2); compare at 2-dp with a 0.01 epsilon so float echoes
// (e.g. 1917.5 vs 1917.50) and minor-unit conversion never spuriously mismatch.
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const amountsEqual = (a, b) => {
    const x = Number(a); const y = Number(b);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    return Math.abs(round2(x) - round2(y)) < 0.01;
};

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

// Cascade a terminal payment event onto an order by EXPLICIT id, within an EXISTING
// transaction (the caller owns the tenant context). Shared by the Java finance-events
// bridge (id from payload) and the RazorpayX webhook (id from reference_id).
//
// `opts` carries OPTIONAL settlement guards (RazorpayX path only). The finance-events
// bridge calls with NO opts, so its behavior is byte-for-byte unchanged.
//   opts.expect = { amount, currency } — bind the payout to the order's own money
//       (a valid signature must not let an arbitrary reference_id / 1-paisa payout settle).
//   opts.requireForward — block state regression / replay on a state-advancing event.
//   opts.requirePending — completion only settles an order that actually requested payment.
async function cascadeOrderInTx(t, eventType, orderId, opts = {}) {
    const tr = orderTransitionFor(eventType);
    if (!tr || !orderId) return { matched: false };
    const order = await db.Order.findByPk(String(orderId), { transaction: t });
    if (!order) return { matched: false, orderId };

    // 3A/3B: amount + currency must match the SERVER-computed order total. No mutation on mismatch.
    if (opts.expect) {
        const wantCurrency = String(order.base_currency || '').toLowerCase();
        const gotCurrency = String(opts.expect.currency || '').toLowerCase();
        if (!gotCurrency || gotCurrency !== wantCurrency
            || !amountsEqual(opts.expect.amount, order.base_currency_amount)) {
            return { matched: false, rejected: 'amount_or_currency_mismatch', orderId: order.id };
        }
    }
    // requirePending: a forged 'completed' must not settle an order nobody initiated payment for.
    if (opts.requirePending && eventType === 'payments.transaction.completed' && order.payment_status !== 'pending') {
        return { matched: false, rejected: 'not_pending', orderId: order.id };
    }
    // requireForward: a state-advancing transition (order_status set) must be a legal forward move.
    if (opts.requireForward && tr.order_status && !canTransition(order.status, tr.order_status)) {
        return { matched: false, rejected: 'illegal_transition', from: order.status, orderId: order.id };
    }

    order.payment_status = tr.payment_status;
    if (tr.order_status) order.status = tr.order_status;
    await order.save({ transaction: t });
    await db.OrderSagaState.upsert({
        order_id: String(order.id), tenant_id: order.tenant_id,
        state: tr.state, last_event: eventType, updated_at: new Date(),
    }, { transaction: t });

    // GL double-entry (external rail only): on a CONFIRMED settlement, enqueue a ledger-post
    // intent in the SAME tx (publish-iff-commit). A consumer posts it to the Java ledger
    // (idempotent by transactionRef). Skipped unless both account ids resolve to UUIDs —
    // a guessed/missing chart-of-accounts mapping must never produce a malformed GL row.
    if (opts.ledgerPost && eventType === 'payments.transaction.completed') {
        const debitAccountId = opts.ledgerPost.debitAccountId || order.buyer_org_id;
        const creditAccountId = opts.ledgerPost.creditAccountId || order.seller_org_id;
        // 1a: app-layer dedup — never enqueue a SECOND GL post intent for the same order, even
        // if the cascade somehow re-runs (the consumer is idempotent by transactionRef, but a
        // duplicate outbox row is a second money-movement signal we must not produce).
        const existing = await db.OutboxEvent.findOne({
            where: { aggregate_id: String(order.id), event_type: OrderEvents.SETTLEMENT_LEDGER_POST },
            transaction: t,
        });
        const decision = shouldWriteLedgerOutbox({
            existing, debitAccountId, creditAccountId, tenantId: order.tenant_id,
        });
        if (decision.write) {
            await db.OutboxEvent.create({
                tenant_id: order.tenant_id, aggregate_type: 'order', aggregate_id: String(order.id),
                event_type: OrderEvents.SETTLEMENT_LEDGER_POST,
                payload: {
                    orderId: String(order.id), tenantId: order.tenant_id,
                    amount: order.base_currency_amount, currency: order.base_currency,
                    debitAccountId: String(debitAccountId), creditAccountId: String(creditAccountId),
                    transactionRef: `oms-settle-${order.id}`,
                },
            }, { transaction: t });
        } else if (decision.reason === 'dedup') {
            // Already posted — nothing to do (no second GL intent, no error).
        } else if (decision.reason === 'non_uuid_tenant') {
            console.error(`[${config.service}] settlement GL post skipped for order ${sanitize(order.id)}: `
                + 'tenant id is not a UUID (ambiguous tenant — refusing to post a GL entry)');
        } else {
            console.error(`[${config.service}] settlement GL post skipped for order ${sanitize(order.id)}: `
                + 'debit/credit account ids are not UUIDs (configure LEDGER_SETTLEMENT_*_ACCOUNT_ID)');
        }
    }
    return { matched: true, orderId: order.id, state: tr.state };
}

// Cascade within an EXISTING transaction, resolving the order id from the payload.
async function cascadeInTx(t, eventType, payload) {
    return cascadeOrderInTx(t, eventType, refOf(payload));
}

/**
 * Atomically record the webhook in the idempotency inbox AND cascade the terminal
 * payment state onto the order, in ONE tenant-bypass transaction (F7). A duplicate
 * webhook_id throws SequelizeUniqueConstraintError (the caller maps it to 200/deduped);
 * a cascade failure rolls back the marker too so the sender can safely retry.
 * Reused by the RazorpayX settlement webhook.
 */
async function applySettlement({ webhookId, eventType, hash, orderId, expect, requireForward, requirePending, ledgerPost }) {
    return runWithTenant({ tenantId: null, bypass: true }, () =>
        db.sequelize.transaction(async (t) => {
            // Marker commits FIRST. A guard rejection (returns {matched:false,rejected}, does
            // NOT throw) still commits the marker, so the same providerId is never reprocessed.
            await db.ProcessedWebhook.create({ webhook_id: webhookId, event_type: eventType, payload_hash: hash }, { transaction: t });
            return cascadeOrderInTx(t, eventType, orderId, { expect, requireForward, requirePending, ledgerPost });
        }));
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
        console.error(`[${config.service}] finance-event processing failed:`, sanitize(eventType), sanitize(err.message));
        return res.status(500).json({ error: { code: 'CASCADE_FAILED', message: 'event processing failed; retry' } });
    }
};

// Reused by the RazorpayX settlement webhook (controller/paymentWebhookController).
exports.applySettlement = applySettlement;
exports.cascadeOrderInTx = cascadeOrderInTx;
exports.shouldWriteLedgerOutbox = shouldWriteLedgerOutbox;

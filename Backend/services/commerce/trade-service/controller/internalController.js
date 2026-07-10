'use strict';
/**
 * Internal service-to-service ingress — NOT a user-facing API.
 *
 * `POST /v1/internal/finance-events` is the Java→Node event bridge: financial-services-java
 * (audit-service WebhookDispatcher) delivers money/risk events here over HMAC-SHA256, and we
 * project them onto trade-service's read models (Payment/Order/Escrow) + fan out over realtime
 * so the GTI frontend's finance pages update live. Java uses BullMQ-less Kafka internally; this
 * webhook is the deliberate seam so the Node stack needs no Kafka client.
 *
 * Auth: NOT a user JWT — authenticated by the shared HMAC secret (config.finance.webhookSecret,
 * must equal the audit-service webhook_subscription secret). Verified over the EXACT raw bytes.
 */
const crypto = require('crypto');
const config = require('../config/appConfig');
const db = require('../models');
const { runAs } = require('../middleware/tenantContext');
const realtime = require('../realtime');

// Bounded in-memory idempotency cache keyed by X-Webhook-Id. A dev bridge: projection updates are
// themselves idempotent (setting a terminal status on replay is a no-op), so a crash that loses
// this cache is safe — it just lets one duplicate event re-apply harmlessly.
const seen = new Map();
const SEEN_MAX = 5000;
function alreadyProcessed(id) {
    if (!id) return false;
    if (seen.has(id)) return true;
    seen.set(id, Date.now());
    if (seen.size > SEEN_MAX) seen.delete(seen.keys().next().value);
    return false;
}

// Matches financial-services-java WebhookSigner: "sha256=" + lowercase-hex HMAC-SHA256(secret, payload).
function verifySignature(req) {
    const header = req.headers['x-webhook-signature'] || '';
    const secret = config.finance.webhookSecret;
    if (!secret || !header.startsWith('sha256=')) return false;
    // CR-9: verify over the EXACT raw bytes only. A JSON re-stringify fallback
    // would let a caller bypass the signature by exploiting key-order / encoding
    // differences, so a missing rawBody is a hard verification failure.
    if (!req.rawBody || !Buffer.isBuffer(req.rawBody)) return false;
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
    const a = Buffer.from(header);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Java payment event type → trade-service Payment.status.
const PAYMENT_STATUS = {
    'payments.transaction.initiated': 'processing',
    'payments.transaction.completed': 'completed',
    'payments.transaction.failed': 'failed',
    'payments.transaction.reversed': 'refunded',
};

// The reference linking a Java payment to the trade-service Payment row (stored in provider_tx_id
// when the facade initiates the payment). Tolerant of the various names the event may carry.
function refOf(p) {
    return p.transactionRef || p.provider_tx_id || p.providerTxId || p.paymentId
        || p.payment_id || p.reference || p.id || null;
}

async function applyPaymentProjection(eventType, payload) {
    const status = PAYMENT_STATUS[eventType];
    const ref = refOf(payload);
    if (!status || !ref) return { matched: false, ref: ref || null };
    // bypass tenant scoping — this is a trusted system write, not a user request.
    return runAs({ bypass: true }, async () => {
        const payment = await db.Payment.findOne({ where: { provider_tx_id: String(ref) } });
        if (!payment) return { matched: false, ref };
        payment.status = status;
        if (status === 'completed' && !payment.settled_at) payment.settled_at = new Date();
        payment.metadata = { ...(payment.metadata || {}), lastFinanceEvent: eventType, financeUpdatedAt: new Date().toISOString() };
        await payment.save();
        return { matched: true, ref, paymentId: payment.id, status };
    });
}

// Java escrow-service event → trade-service Escrow.status. Java's EscrowStatus (HELD/RELEASED/
// REFUNDED/DISPUTED/EXPIRED) predates trade.escrows' enum (pending/funded/released/refunded/
// disputed); HELD carries real held funds so it maps to 'funded', not 'pending'. EXPIRED never
// actually lands (EscrowService.sweepExpiredHolds always resolves it to release/refund first).
const ESCROW_STATUS = {
    'escrow.hold.created':   'funded',
    'escrow.hold.released':  'released',
    'escrow.hold.refunded':  'refunded',
    'escrow.hold.disputed':  'disputed',
};

// The Java Escrow entity's `metadata` is a caller-supplied JSON *string* (not an object) — parse
// defensively since a malformed value must not crash the projection.
function parseMetadata(raw) {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch { return {}; }
}

// trade.escrows.order_id is an integer FK (trade.orders.id) — a non-numeric orderId in the
// Java escrow's metadata (malformed caller input) must not throw and lose the whole projection;
// degrade to null so status/escrow tracking still lands.
function parseOrderId(raw) {
    if (raw === undefined || raw === null || raw === '') return null;
    const n = Number.parseInt(raw, 10);
    return Number.isInteger(n) ? n : null;
}

async function applyEscrowProjection(eventType, payload) {
    const status = ESCROW_STATUS[eventType];
    const escrowRef = payload.escrowRef || payload.escrow_ref;
    if (!status || !escrowRef) return { matched: false, escrowRef: escrowRef || null };
    const meta = parseMetadata(payload.metadata);
    const buildDefaults = (orderId) => ({
        tenant_id: payload.tenantId || payload.tenant_id || 'T-DEMO',
        order_id: orderId,
        buyer_org_id: meta.buyerOrgId || meta.buyer_org_id || null,
        seller_org_id: meta.sellerOrgId || meta.seller_org_id || null,
        amount: payload.amount,
        currency: payload.currency,
        status,
        escrow_ref: String(escrowRef),
        java_escrow_id: payload.id || null,
    });
    // bypass tenant scoping — this is a trusted system write, not a user request.
    return runAs({ bypass: true }, async () => {
        const orderId = parseOrderId(meta.orderId ?? meta.order_id);
        let escrow;
        try {
            [escrow] = await db.Escrow.findOrCreate({ where: { escrow_ref: String(escrowRef) }, defaults: buildDefaults(orderId) });
        } catch (err) {
            // A syntactically-valid but nonexistent order_id (stale/deleted order) must not lose
            // the whole escrow projection — degrade to order_id=null and keep the money-state tracking.
            if (orderId !== null && err instanceof db.Sequelize.ForeignKeyConstraintError) {
                console.error(`[finance-events] escrow ${escrowRef}: order_id ${orderId} not found in trade.orders — projecting with order_id=null`);
                [escrow] = await db.Escrow.findOrCreate({ where: { escrow_ref: String(escrowRef) }, defaults: buildDefaults(null) });
            } else {
                throw err;
            }
        }
        escrow.status = status;
        if (status === 'funded' && !escrow.funded_at) escrow.funded_at = new Date();
        if (status === 'released' && !escrow.released_at) escrow.released_at = new Date();
        if (payload.id) escrow.java_escrow_id = payload.id;
        await escrow.save();
        return { matched: true, escrowRef, escrowId: escrow.id, status };
    });
}

// Java credit-service event → trade-service FinancedInvoice.status. credit-service has no
// "submitted" outbox event (only funded/collected/closed are enqueued — see
// InvoiceFinanceService.java), so this projection only ever creates a row once financing is
// actually disbursed; PENDING/APPROVED status is read live from credit-service, not projected here.
const FINANCING_STATUS = {
    'credit.invoice.funded':    'funded',
    'credit.invoice.collected': 'collected',
    'credit.invoice.closed':    'closed',
};

async function applyFinancingProjection(eventType, payload) {
    const status = FINANCING_STATUS[eventType];
    // DisbursementEvent (funded/collected) carries `reference`; the closed-sweep payload is a full
    // InvoiceResponse and carries `reference` too — same field name either way.
    const invoiceRef = payload.reference;
    if (!status || !invoiceRef) return { matched: false, invoiceRef: invoiceRef || null };
    const orderId = parseOrderId(payload.orderRef);
    const buildDefaults = (oid) => ({
        tenant_id: payload.tenantId || payload.tenant_id || 'T-DEMO',
        order_id: oid,
        invoice_ref: String(invoiceRef),
        java_invoice_id: payload.invoiceId || payload.id || null,
        seller_org_id: payload.beneficiaryId ? String(payload.beneficiaryId) : null,
        amount: payload.amount,
        currency: payload.currency,
        status,
    });
    return runAs({ bypass: true }, async () => {
        let invoice;
        try {
            [invoice] = await db.FinancedInvoice.findOrCreate({ where: { invoice_ref: String(invoiceRef) }, defaults: buildDefaults(orderId) });
        } catch (err) {
            if (orderId !== null && err instanceof db.Sequelize.ForeignKeyConstraintError) {
                console.error(`[finance-events] financed invoice ${invoiceRef}: order_id ${orderId} not found in trade.orders — projecting with order_id=null`);
                [invoice] = await db.FinancedInvoice.findOrCreate({ where: { invoice_ref: String(invoiceRef) }, defaults: buildDefaults(null) });
            } else {
                throw err;
            }
        }
        invoice.status = status;
        if (status === 'funded' && !invoice.funded_at) invoice.funded_at = new Date();
        if (status === 'collected' && !invoice.collected_at) invoice.collected_at = new Date();
        await invoice.save();
        return { matched: true, invoiceRef, invoiceId: invoice.id, status };
    });
}

// Best-effort durable trail so the event is inspectable in the UI (collection: finance_events).
async function recordEvent(eventType, tenantId, payload) {
    try {
        await runAs({ bypass: true }, () => db.Collection.create({
            collection: 'finance_events',
            tenantId: tenantId || 'T-DEMO',
            data: { eventType, receivedAt: new Date().toISOString(), payload },
        }));
    } catch (err) { console.error('[finance-events] trail write failed:', err.message); }
}

exports.financeEvents = async (req, res) => {
    if (!verifySignature(req)) {
        return res.status(401).json({ error: { code: 'BAD_SIGNATURE', message: 'invalid webhook signature' } });
    }
    const eventType = req.headers['x-webhook-event'] || (req.body && req.body.eventType) || 'unknown';
    const webhookId = req.headers['x-webhook-id'] || null;
    if (alreadyProcessed(webhookId)) return res.status(200).json({ ok: true, deduped: true, event: eventType });

    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const tenantId = payload.tenantId || payload.tenant_id || null;

    let projection = { matched: false };
    try {
        if (eventType.startsWith('payments.')) projection = await applyPaymentProjection(eventType, payload);
        else if (eventType.startsWith('escrow.')) projection = await applyEscrowProjection(eventType, payload);
        else if (eventType.startsWith('credit.invoice.')) projection = await applyFinancingProjection(eventType, payload);
        // settlement.* / risk.* projections land in their own phases; until then the
        // event is still recorded + broadcast so the UI sees it live (no data loss).
    } catch (err) {
        // Mapping gaps are not transient — record + 200 so Java does not retry forever.
        console.error('[finance-events] projection error:', eventType, err.message);
    }

    await recordEvent(eventType, tenantId, payload);
    try { if (tenantId) await realtime.publish(`tenant:${tenantId}`, eventType, { ...payload, _projection: projection }); }
    catch (err) { console.error('[finance-events] realtime publish failed:', err.message); }

    return res.status(200).json({ ok: true, event: eventType, projection });
};

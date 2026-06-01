'use strict';
/**
 * Gateway-checkout payment service — the SDK-native vertical.
 *
 *   createIntent : resolve provider+keys from CMS (sdk.config) → adapter.createOrder
 *                  → persist GatewayPayment (idempotent) → emit payment.created.
 *   handleWebhook: resolve the provider's webhook secret from CMS → VERIFY signature
 *                  → normalize → idempotent ledger write + status update in ONE
 *                  transaction (UNIQUE(provider,eventId) = hard dedup) → emit events.
 *
 * Every secret comes from the CMS vault via the SDK; nothing is read from env.
 */
const { Op } = require('sequelize');
const db = require('../models');
const { tryGetSdk } = require('../platform/sdk');
const { logger } = require('../platform/logger');
const { emit, PaymentEvents } = require('../platform/events');
const { resolveProvider, resolveProviderByName, GatewayError } = require('../gateway/providerResolver');
const { normalizeWebhook } = require('./webhookNormalizer');

const { GatewayPayment, PaymentLedgerEntry, sequelize } = db;

// Structured security audit (stdout JSON via the service logger) for webhook security events —
// invalid signatures, phantom/no-match webhooks, replayed (duplicate) events, amount mismatches.
// Mirrors the platform audit contract { audit, type, decision, ts, ... } so SOC tooling can ingest.
function auditSecurity(type, decision, fields) {
    try { logger('webhook.audit').warn({ audit: true, type, decision, ts: new Date().toISOString(), ...fields }, `payment security: ${type}`); } catch { /* never break the request */ }
}

function currentTraceId() {
    const sdk = tryGetSdk();
    const t = sdk && sdk.trace.current();
    return t ? t.traceId : null;
}

function isUniqueViolation(e) {
    return Boolean(
        e &&
        (e.name === 'SequelizeUniqueConstraintError' ||
            e.code === '23505' ||
            (e.original && e.original.code === '23505') ||
            (e.parent && e.parent.code === '23505')),
    );
}

// Forward-only payment state machine. Terminal states cannot be downgraded: a
// captured payment may only move to refunded; refunded is final. This prevents a
// late/duplicate 'failed' (with a distinct event id) from overwriting 'captured'.
const STATUS_RANK = { created: 0, failed: 1, authorized: 2, captured: 3, refunded: 4 };
function canTransition(from, to) {
    if (from === to) return false;
    if (from === 'captured') return to === 'refunded';
    if (from === 'refunded') return false;
    return (STATUS_RANK[to] ?? 0) >= (STATUS_RANK[from] ?? 0);
}

async function createIntent({ websiteSlug, amount, currency, idempotencyKey, receipt, notes, metadata }) {
    if (!websiteSlug) throw new GatewayError('VALIDATION', 'websiteSlug is required', 400);
    if (!(Number(amount) > 0)) throw new GatewayError('VALIDATION', 'amount (minor units) must be a positive number', 400);
    if (!idempotencyKey) throw new GatewayError('VALIDATION', 'idempotencyKey is required', 400);

    // resolveProvider is a pure read (CMS vault); safe to call before claiming.
    const { provider, adapter, secrets, config, mode } = await resolveProvider(websiteSlug);

    // Atomically CLAIM the (tenant, idempotencyKey) slot via the UNIQUE index.
    // Only the request that wins the insert calls the external provider, so
    // concurrent requests with the same key never double-create a provider order.
    const [gp, created] = await GatewayPayment.findOrCreate({
        where: { websiteSlug, idempotencyKey },
        defaults: {
            websiteSlug, provider, idempotencyKey, amount, currency,
            status: 'created', receipt: receipt || null, metadata: metadata || {}, traceId: currentTraceId(),
        },
    });
    if (!created) {
        return { payment: gp.toJSON(), provider: gp.provider, providerOrderId: gp.providerOrderId, idempotentReplay: true };
    }

    let order;
    try {
        order = await adapter.createOrder({ amount, currency, receipt, notes, secrets, config, mode });
    } catch (e) {
        // Release the claim so the key can be retried (no provider order was created).
        await gp.destroy().catch(() => {});
        throw e;
    }
    await gp.update({ providerOrderId: order.providerOrderId });

    await emit(
        PaymentEvents.CREATED,
        { eventType: PaymentEvents.CREATED, tenantId: websiteSlug, transactionId: gp.id, provider, amount, currency, status: 'created', traceId: gp.traceId },
        { tenantId: websiteSlug },
    );

    logger('gateway').info({ tenantId: websiteSlug, provider, mode, transactionId: gp.id }, 'payment intent created');
    return {
        payment: gp.toJSON(),
        provider,
        mode,
        providerOrderId: order.providerOrderId,
        clientParams: order.clientParams,
        idempotentReplay: false,
    };
}

async function findPayment(provider, websiteSlug, parsed) {
    const or = [];
    if (parsed.providerOrderId) or.push({ providerOrderId: parsed.providerOrderId });
    if (parsed.providerPaymentId) or.push({ providerPaymentId: parsed.providerPaymentId });
    if (or.length === 0) return null;
    return GatewayPayment.findOne({ where: { provider, websiteSlug, [Op.or]: or } });
}

async function handleWebhook({ provider, websiteSlug, rawBody, body, headers }) {
    if (!websiteSlug) throw new GatewayError('VALIDATION', 'websiteSlug (the ?site= on the webhook URL) is required', 400);

    // Resolve THIS provider's webhook secret from the CMS vault (deterministic —
    // the tenant comes from the URL, not from the untrusted body).
    const { adapter, secrets } = await resolveProviderByName(websiteSlug, provider);

    // 1) VERIFY the signature BEFORE trusting or persisting anything.
    if (!adapter.verifyWebhook({ rawBody, body, headers, secrets })) {
        auditSecurity('payment.invalid_signature', 'deny', { tenantId: websiteSlug, provider, reason: 'signature_verification_failed' });
        throw new GatewayError('INVALID_SIGNATURE', 'Webhook signature verification failed', 401);
    }

    // 2) Parse → canonical fields; dedup needs a provider event id.
    const parsed = adapter.parseWebhook({ body, headers });
    if (!parsed.providerEventId) throw new GatewayError('INVALID_WEBHOOK', 'Webhook missing a provider event id (cannot dedup)', 400);

    // 3) Locate our payment. Every legitimate webhook corresponds to a prior
    //    createIntent; reject (404 → the provider retries) if none matches —
    //    never write a ledger entry for a phantom payment.
    const gp = await findPayment(provider, websiteSlug, parsed);
    if (!gp) {
        auditSecurity('payment.webhook_no_match', 'deny', { tenantId: websiteSlug, provider, providerEventId: parsed.providerEventId, reason: 'no_matching_payment' });
        throw new GatewayError('PAYMENT_NOT_FOUND', `No payment matches this ${provider} webhook for tenant "${websiteSlug}"`, 404);
    }
    const normalized = normalizeWebhook({ provider, parsed, websiteSlug, gatewayPayment: gp });

    // Defense-in-depth: the (signature-verified) amount should match the intent.
    if (parsed.amount != null && Math.abs(Number(parsed.amount) - Number(gp.amount)) > 1) {
        auditSecurity('payment.amount_mismatch', 'flag', { tenantId: websiteSlug, provider, transactionId: gp.id, expected: gp.amount, received: parsed.amount });
        logger('webhook').warn(
            { tenantId: websiteSlug, transactionId: gp.id, expected: gp.amount, received: parsed.amount, provider },
            'webhook amount mismatch vs created intent',
        );
    }

    // 4) Idempotent ledger write + forward-only status update in ONE transaction.
    //    A replayed webhook trips UNIQUE(provider, provider_event_id) → caught → no-op.
    let duplicate = false;
    try {
        await sequelize.transaction(async (t) => {
            await PaymentLedgerEntry.create(
                {
                    websiteSlug,
                    gatewayPaymentId: gp.id,
                    provider,
                    providerEventId: parsed.providerEventId,
                    eventType: normalized.eventType,
                    direction: parsed.status === 'refunded' ? 'debit' : 'credit',
                    amount: parsed.amount != null ? parsed.amount : gp.amount,
                    currency: normalized.currency || 'INR',
                    status: parsed.status,
                    traceId: normalized.traceId,
                    payload: parsed.raw || {},
                },
                { transaction: t },
            );
            // Forward-only: a terminal status is never downgraded; the ledger row
            // is still recorded for audit even when the status update is skipped.
            if (canTransition(gp.status, parsed.status)) {
                await gp.update(
                    { status: parsed.status, providerPaymentId: parsed.providerPaymentId || gp.providerPaymentId },
                    { transaction: t },
                );
            }
        });
    } catch (e) {
        if (isUniqueViolation(e)) duplicate = true;
        else throw e;
    }

    if (duplicate) {
        auditSecurity('payment.duplicate_webhook', 'deny', { tenantId: websiteSlug, provider, providerEventId: parsed.providerEventId, reason: 'replayed_event' });
        logger('webhook').info({ provider, providerEventId: parsed.providerEventId, tenantId: websiteSlug }, 'duplicate webhook ignored (idempotent)');
        return { processed: true, duplicate: true, normalized };
    }

    // 5) Emit canonical events (awaited within the request; fail-open).
    await emit(normalized.eventType, normalized, { tenantId: websiteSlug });
    await emit(PaymentEvents.LEDGER_RECORDED, normalized, { tenantId: websiteSlug });
    logger('webhook').info(
        { provider, eventType: normalized.eventType, tenantId: websiteSlug, transactionId: normalized.transactionId, providerEventId: parsed.providerEventId },
        'webhook processed → ledger + event',
    );
    return { processed: true, duplicate: false, normalized };
}

module.exports = { createIntent, handleWebhook };

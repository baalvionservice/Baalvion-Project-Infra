'use strict';
/**
 * Normalize a provider-parsed webhook into the SINGLE canonical platform schema —
 * identical shape for every provider:
 *
 *   { eventType, tenantId, transactionId, provider, amount, currency, traceId, payload }
 *
 * Plus the provider correlation ids the ledger/dedup layer needs. tenant == the
 * CMS website slug; transactionId == our internal GatewayPayment id; traceId comes
 * from the SDK trace context so the whole chain stays correlated.
 */
const { tryGetSdk } = require('../platform/sdk');

function currentTraceId() {
    const sdk = tryGetSdk();
    const t = sdk && sdk.trace.current();
    return t ? t.traceId : null;
}

function normalizeWebhook({ provider, parsed, websiteSlug, gatewayPayment }) {
    return {
        eventType: parsed.eventType,
        tenantId: websiteSlug,
        transactionId: gatewayPayment ? gatewayPayment.id : null,
        provider,
        amount: parsed.amount,
        currency: parsed.currency || (gatewayPayment && gatewayPayment.currency) || null,
        traceId: currentTraceId(),
        payload: parsed.raw || {},
        // correlation (not part of the public envelope but carried through):
        providerEventId: parsed.providerEventId,
        providerOrderId: parsed.providerOrderId,
        providerPaymentId: parsed.providerPaymentId,
        status: parsed.status,
    };
}

module.exports = { normalizeWebhook };

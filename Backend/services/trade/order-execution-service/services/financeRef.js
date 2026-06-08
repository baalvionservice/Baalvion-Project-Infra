'use strict';
/**
 * Resolve the oms order id from a finance event payload (pure, testable).
 *
 * Direct payment events from the Java suite (payments.transaction.completed) carry
 * the payment fields, NOT the order id — but oes initiates them with
 * idempotencyKey = `order-<orderId>`, so we recover the order id from that when no
 * explicit order reference is present. Supports both shapes so the inbound
 * finance-events webhook can link a completion to its order.
 */
function orderRefFromPayload(p) {
    if (!p || typeof p !== 'object') return null;
    const direct = p.orderId || p.order_id || p.reference;
    if (direct) return String(direct);
    const idem = p.idempotencyKey || p.idempotency_key;
    if (idem) {
        const m = /^order-(.+)$/.exec(String(idem));
        if (m) return m[1];
    }
    return null;
}

module.exports = { orderRefFromPayload };

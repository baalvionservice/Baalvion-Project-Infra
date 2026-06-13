'use strict';
// Structured security-audit helpers for payment + cart events, emitted through the shared
// @baalvion/commerce-rbac audit emitter (stdout JSON + best-effort baalvion:events stream).
// Same field contract as ownership/RBAC events: { type, decision, userId, scope, action,
// resource, reason, requestId, metadata, timestamp }.
const { audit } = require('../middleware/rbacPep');

function emit(type, decision, info = {}) {
    audit.emit({
        type,
        decision,
        userId: info.userId != null ? String(info.userId) : null,
        role: info.role ?? null,
        scope: info.storeId ? { type: 'store', id: info.storeId } : (info.scope ?? null),
        action: info.action ?? null,
        resource: info.resource ?? null,
        reason: info.reason ?? null,
        requestId: info.requestId ?? null,
        metadata: info.metadata,
    });
}

module.exports = {
    emit,
    // payment events — type is suffixed under commerce.payment_*
    payment: (event, decision, info) => emit(`commerce.payment_${event}`, decision, info),
    // cart/session events — commerce.cart_*
    cart: (event, decision, info) => emit(`commerce.cart_${event}`, decision, info),
};

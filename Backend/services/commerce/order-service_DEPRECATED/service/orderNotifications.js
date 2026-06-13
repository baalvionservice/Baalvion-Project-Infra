'use strict';
/**
 * Transactional customer order emails (order confirmation + payment received) delivered via
 * notification-service (POST /v1/notifications/email → BullMQ → SMTP/Resend → templates).
 *
 * Fire-and-forget + fail-open + POST-COMMIT: this is called only AFTER the order/payment
 * transaction has committed, and it must NEVER throw into the checkout/payment path. Any
 * resolution, build, or delivery error is caught and logged — an email problem cannot fail
 * an order. Delivery is idempotent end-to-end: notification-service de-dupes on idempotencyKey
 * (`order-<templateName>-<orderId>`), so a retried/replayed confirm never re-sends.
 *
 * Auth mirrors alerts.js (internal service-to-service call) but uses the platform's canonical
 * sdk.internalAuth shared-secret contract — header `x-internal-secret: <INTERNAL_SERVICE_SECRET>`
 * (which MUST match notification-service's secret) plus `x-internal-service` for attribution.
 */
const config = require('../config/appConfig');
const { OrdersCustomer } = require('../models');

// Resolve the email recipient + display name for an order.
//   - Registered: the order's customer record (OrdersCustomer.email / firstName).
//   - Guest: the email captured on the order's shipping/billing address.
// Returns null when no recipient can be resolved (→ skip silently).
async function resolveRecipient(order) {
    if (order.customerId) {
        const c = await OrdersCustomer.findByPk(order.customerId, { attributes: ['email', 'firstName'] });
        if (c && c.email) return { email: c.email, name: c.firstName || null };
    }
    const ship = order.shippingAddress || {};
    const bill = order.billingAddress || {};
    const email = ship.email || bill.email || null;
    if (!email) return null;
    return { email, name: ship.firstName || bill.firstName || null };
}

// Build the Handlebars `data` payload the orderConfirmation/orderPaid templates expect.
function buildData(order, items, recipient) {
    const num = (v) => Number(v || 0).toFixed(2);
    return {
        orderNumber: order.orderNumber,
        name: recipient.name || undefined,
        total: num(order.totalAmount),
        currency: order.currencyCode || 'USD',
        items: (items || []).map((i) => ({
            name: i.name || i.sku || 'Item',
            quantity: i.quantity,
            price: num(i.price),
            total: num(i.total != null ? i.total : i.gross),
        })),
        orderUrl: `${config.notifications.storefrontUrl}/orders/${order.id}`,
    };
}

/**
 * Send a transactional order email. Never throws.
 * @param {'orderConfirmation'|'orderPaid'} templateName
 * @param {object} order  the committed order (toJSON() shape or model instance)
 * @param {Array}  items  the order's line items
 */
async function sendOrderEmail(templateName, order, items) {
    try {
        if (!config.notifications.orderEmailsEnabled) {
            console.info(JSON.stringify({ evt: 'order.email_skipped', reason: 'notifications_not_configured', templateName, orderId: order && order.id }));
            return;
        }
        const recipient = await resolveRecipient(order);
        if (!recipient) {
            console.info(JSON.stringify({ evt: 'order.email_skipped', reason: 'no_recipient', templateName, orderId: order.id }));
            return;
        }

        const payload = {
            to: recipient.email,
            templateName,
            data: buildData(order, items, recipient),
            idempotencyKey: `order-${templateName}-${order.id}`,
        };

        const url = `${config.notifications.baseUrl}${config.notifications.apiPrefix}/notifications/email`;
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), config.notifications.timeoutMs);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-secret': config.notifications.internalKey,
                    'x-internal-service': 'order-service',
                },
                body: JSON.stringify(payload),
                signal: ctrl.signal,
            });
            if (!res.ok) {
                console.error(JSON.stringify({ evt: 'order.email_delivery_failed', templateName, orderId: order.id, status: res.status }));
            } else {
                console.info(JSON.stringify({ evt: 'order.email_enqueued', templateName, orderId: order.id, to: recipient.email }));
            }
        } finally {
            clearTimeout(timer);
        }
    } catch (err) {
        // Fail-open: an email problem must never break checkout/payment.
        console.error(JSON.stringify({ evt: 'order.email_error', templateName, orderId: order && order.id, error: err.message }));
    }
}

module.exports = { sendOrderEmail };

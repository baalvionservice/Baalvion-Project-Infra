'use strict';
const { OrdersShipment, OrdersOrder, OrdersCustomer } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const ownership = require('./ownership');
const orderService = require('./orderService');

// An order is owned by the user behind its customer record (mirrors orderService.getOrder).
async function orderOwnerUserId(customerId) {
    if (!customerId) return null;
    const c = await OrdersCustomer.findByPk(customerId, { attributes: ['userId'] });
    return c ? c.userId : null;
}

// The guest session (if any) an order is bound to (mirrors orderService.orderOwnerSessionId).
function orderOwnerSessionId(order) {
    const meta = order && order.metadata;
    return meta && typeof meta.guestSessionId === 'string' ? meta.guestSessionId : null;
}

// Statuses that mean the parcel has physically left → set shipped_at.
const SHIPPED_STATUSES = new Set(['in_transit', 'out_for_delivery', 'delivered']);

/**
 * Customer-readable shipment list for an order. Ownership is enforced with the EXACT pattern
 * from orderService.getOrder (owner OR guest-session owner OR store staff) — never trust the client.
 */
async function listOrderShipments(storeId, orderId, actor) {
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId }, attributes: ['id', 'customerId', 'metadata'] });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    await ownership.enforce(actor, await orderOwnerUserId(order.customerId), { resourceType: 'order', resourceId: orderId, storeId, action: 'shipment.read', ownerSessionId: orderOwnerSessionId(order) });
    const shipments = await OrdersShipment.findAll({ where: { storeId, orderId }, order: [['createdAt', 'ASC']] });
    return shipments.map((s) => s.toJSON());
}

/**
 * Create a shipment for an order (admin/ops). Pushes the initial event into the timeline, sets
 * shipped_at when the status implies dispatch, then drives the order forward (processing→shipped)
 * and marks it fulfilled. Order-status advance is best-effort: an already-shipped/delivered order
 * stays where it is (the transition guard in updateOrderStatus rejects illegal jumps).
 */
async function createShipment(storeId, orderId, body) {
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);

    const status = body.status || 'pending';
    const now = new Date();
    const initialEvent = { status, message: `Shipment created (${body.carrier})`, at: now.toISOString() };

    const shipment = await OrdersShipment.create({
        orderId, storeId, status,
        carrier: body.carrier,
        trackingNumber: body.trackingNumber,
        trackingUrl: body.trackingUrl || null,
        estimatedDelivery: body.estimatedDelivery || null,
        shippedAt: SHIPPED_STATUSES.has(status) ? now : null,
        events: [initialEvent],
        metadata: {},
    });

    // Drive the order forward: processing → shipped, and mark fulfilled. The status machine in
    // updateOrderStatus only allows processing→shipped, so for a confirmed order step it up first.
    await advanceOrderToShipped(storeId, orderId, order);

    await cache.del(cache.keys.order(orderId));
    return shipment.toJSON();
}

// Best-effort advance of the parent order to 'shipped' + fulfillment 'fulfilled'.
// Follows the existing updateOrderStatus transition machine (confirmed→processing→shipped).
async function advanceOrderToShipped(storeId, orderId, order) {
    try {
        if (order.status === 'confirmed') {
            await orderService.updateOrderStatus(storeId, orderId, 'processing');
            order.status = 'processing';
        }
        if (order.status === 'processing') {
            await orderService.updateOrderStatus(storeId, orderId, 'shipped');
        }
    } catch (e) {
        // An order already past 'shipped' (delivered/refunded) or otherwise non-advanceable is fine.
        console.warn(JSON.stringify({ evt: 'shipment.order_advance_skipped', storeId, orderId, from: order.status, error: e.message }));
    }
    // Mark fulfilled regardless (a shipment exists → the order is being fulfilled).
    const fresh = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (fresh && fresh.fulfillmentStatus !== 'fulfilled') await fresh.update({ fulfillmentStatus: 'fulfilled' });
}

/**
 * Append a tracking event and update a shipment's status (admin/ops). On 'delivered' the
 * delivered_at timestamp is set and the parent order is advanced shipped→delivered.
 */
async function updateShipmentTracking(storeId, shipmentId, body) {
    const shipment = await OrdersShipment.findOne({ where: { id: shipmentId, storeId } });
    if (!shipment) throw new AppError('NOT_FOUND', 'Shipment not found', 404);

    const now = new Date();
    const event = { status: body.status, message: body.message || null, location: body.location || null, at: now.toISOString() };
    const updates = {
        status: body.status,
        events: [...(shipment.events || []), event],
    };
    if (body.trackingNumber !== undefined) updates.trackingNumber = body.trackingNumber;
    if (body.trackingUrl !== undefined) updates.trackingUrl = body.trackingUrl;
    if (SHIPPED_STATUSES.has(body.status) && !shipment.shippedAt) updates.shippedAt = now;
    if (body.status === 'delivered') updates.deliveredAt = now;

    await shipment.update(updates);

    // On delivery, advance the parent order shipped → delivered (transition-guarded, best-effort).
    if (body.status === 'delivered') {
        try {
            const order = await OrdersOrder.findOne({ where: { id: shipment.orderId, storeId }, attributes: ['id', 'status'] });
            if (order && order.status === 'shipped') {
                await orderService.updateOrderStatus(storeId, shipment.orderId, 'delivered');
            }
        } catch (e) {
            console.warn(JSON.stringify({ evt: 'shipment.order_deliver_skipped', storeId, orderId: shipment.orderId, error: e.message }));
        }
        await cache.del(cache.keys.order(shipment.orderId));
    }
    return shipment.toJSON();
}

module.exports = { listOrderShipments, createShipment, updateShipmentTracking };

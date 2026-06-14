'use strict';
const { Op } = require('sequelize');
const { OrdersReturn, OrdersReturnItem, OrdersOrder, OrdersOrderItem, OrdersCustomer, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination, buildPaginated } = require('../utils/pagination');
const cache = require('./cacheService');
const ownership = require('./ownership');
const orderService = require('./orderService');
const alerts = require('./alerts');

async function orderOwnerUserId(customerId) {
    if (!customerId) return null;
    const c = await OrdersCustomer.findByPk(customerId, { attributes: ['userId'] });
    return c ? c.userId : null;
}

// The guest session (if any) an order is bound to (order.metadata.guestSessionId). Mirrors
// orderService.orderOwnerSessionId so a guest who placed the order (and still holds the signed
// X-Cart-Session) can self-serve a return on it — guest orders have customerId=null, so without
// this the session branch never engages and every guest-return 403s.
function orderOwnerSessionId(order) {
    const meta = order && order.metadata;
    return meta && typeof meta.guestSessionId === 'string' ? meta.guestSessionId : null;
}

function generateReturnNumber() {
    const ts = Date.now().toString(36).toUpperCase();
    return `RET-${ts}`;
}

// Enrich a set of return rows for client display:
//   - each item gains `productName` (resolved from its order item; the UI showed a truncated UUID),
//   - `currencyCode` is backfilled from the parent order for legacy rows created before the column.
// Batched (one query for item names, one for legacy currencies) → no N+1.
async function enrichReturns(rows) {
    const plain = rows.map((r) => (typeof r.toJSON === 'function' ? r.toJSON() : r));
    const orderItemIds = [...new Set(plain.flatMap((r) => (r.items || []).map((i) => i.orderItemId)).filter(Boolean))];
    const orderIdsNeedingCcy = [...new Set(plain.filter((r) => !r.currencyCode).map((r) => r.orderId).filter(Boolean))];

    const nameById = new Map();
    if (orderItemIds.length) {
        const items = await OrdersOrderItem.findAll({ where: { id: { [Op.in]: orderItemIds } }, attributes: ['id', 'name', 'variantName'] });
        for (const it of items) nameById.set(it.id, { name: it.name, variantName: it.variantName });
    }
    const ccyByOrder = new Map();
    if (orderIdsNeedingCcy.length) {
        const orders = await OrdersOrder.findAll({ where: { id: { [Op.in]: orderIdsNeedingCcy } }, attributes: ['id', 'currencyCode'] });
        for (const o of orders) ccyByOrder.set(o.id, o.currencyCode);
    }

    return plain.map((r) => ({
        ...r,
        currencyCode: r.currencyCode || ccyByOrder.get(r.orderId) || 'USD',
        items: (r.items || []).map((i) => {
            const meta = nameById.get(i.orderItemId);
            return { ...i, productName: (meta && meta.name) || null, variantName: (meta && meta.variantName) || null };
        }),
    }));
}

async function listReturns(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = { storeId };
    if (query.status) where.status = query.status;
    if (query.orderId) where.orderId = query.orderId;
    const { rows, count } = await OrdersReturn.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']], include: [{ model: OrdersReturnItem, as: 'items' }] });
    return buildPaginated(await enrichReturns(rows), count, { page, limit });
}

// Customer-facing "my returns": returns owned by the authenticated user in this store.
// A return belongs to a customer (OrdersReturn.customerId); we resolve the caller's customer
// record(s) for the store, then page their returns. Mirrors orderService.listMyOrders — no
// store-role required, and guests (no userId) get an empty page (returns require an owner).
async function listMyReturns(storeId, userId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    if (userId == null) return buildPaginated([], 0, { page, limit });
    const customers = await OrdersCustomer.findAll({ where: { storeId, userId }, attributes: ['id'] });
    const customerIds = customers.map((c) => c.id);
    if (customerIds.length === 0) return buildPaginated([], 0, { page, limit });
    const where = { storeId, customerId: { [Op.in]: customerIds } };
    if (query.status) where.status = query.status;
    const { rows, count } = await OrdersReturn.findAndCountAll({
        where, limit, offset, order: [['createdAt', 'DESC']],
        include: [{ model: OrdersReturnItem, as: 'items' }],
    });
    return buildPaginated(await enrichReturns(rows), count, { page, limit });
}

async function createReturn(storeId, body, actor) {
    const { orderId, reason, notes, items } = body;
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    // Ownership: a caller may only request a return on an order they own — the authenticated owner,
    // OR the guest-session owner bound to the order at checkout (so a guest can self-serve), OR staff.
    await ownership.enforce(actor, await orderOwnerUserId(order.customerId), { resourceType: 'order', resourceId: orderId, storeId, action: 'return.create', ownerSessionId: orderOwnerSessionId(order) });
    if (!['delivered', 'shipped'].includes(order.status)) throw new AppError('CONFLICT', 'Returns can only be requested for delivered or shipped orders', 409);

    // Validate each requested line belongs to THIS order (no cross-order item references) and
    // derive its refund amount SERVER-SIDE from the order item's own price×quantity. The client
    // never supplies a refund amount — only which line + how many units.
    let normalizedItems = [];
    if (items?.length) {
        const orderItems = await OrdersOrderItem.findAll({ where: { orderId } });
        const byId = new Map(orderItems.map((oi) => [oi.id, oi]));
        normalizedItems = items.map((i) => {
            const oi = byId.get(i.orderItemId);
            if (!oi) throw new AppError('VALIDATION_ERROR', `Order item ${i.orderItemId} does not belong to this order`, 400);
            if (i.quantity > oi.quantity) throw new AppError('VALIDATION_ERROR', `Return quantity (${i.quantity}) exceeds purchased quantity for item ${i.orderItemId}`, 400);
            const unit = Number(oi.price) || 0;
            return { orderItemId: oi.id, quantity: i.quantity, reason: i.reason, condition: i.condition || 'good', refundAmount: Number((unit * i.quantity).toFixed(2)) };
        });
    }

    const returnRecord = await sequelize.transaction(async (t) => {
        // Stamp the order's currency on the return so the UI renders the right currency for non-USD markets.
        const ret = await OrdersReturn.create({ orderId, customerId: order.customerId, storeId, currencyCode: order.currencyCode || null, returnNumber: generateReturnNumber(), status: 'requested', reason, notes }, { transaction: t });
        if (normalizedItems.length) {
            await OrdersReturnItem.bulkCreate(normalizedItems.map((n) => ({ ...n, returnId: ret.id })), { transaction: t });
        }
        return ret;
    });
    return returnRecord.toJSON();
}

// Forward-only RMA status machine (mirrors orderService.js status-guard style). A status may
// only advance along this graph; any other jump is a 409. 'rejected' is terminal.
const RETURN_TRANSITIONS = {
    requested: ['approved', 'rejected'],
    approved: ['received'],
    received: ['refunded'],
    refunded: ['closed'],
    rejected: [],
    closed: [],
};

async function updateReturnStatus(storeId, returnId, status, userId) {
    const ret = await OrdersReturn.findOne({ where: { id: returnId, storeId }, include: [{ model: OrdersReturnItem, as: 'items' }] });
    if (!ret) throw new AppError('NOT_FOUND', 'Return not found', 404);

    // Transition guard: forward-only along RETURN_TRANSITIONS (no-op self-transition rejected too).
    const allowed = RETURN_TRANSITIONS[ret.status] || [];
    if (!allowed.includes(status)) {
        throw new AppError('CONFLICT', `Cannot transition return from ${ret.status} to ${status}`, 409);
    }

    // The refund itself is the authoritative money movement — delegate to orderService.refundPayment,
    // which does the provider refund, records the payment row, advances order.payment_status, and
    // posts the REFUND ledger entry. We do NOT duplicate any of that here.
    if (status === 'refunded') {
        const order = await OrdersOrder.findOne({ where: { id: ret.orderId, storeId }, attributes: ['totalAmount', 'paymentStatus'] });
        const REFUNDABLE = ['paid', 'partially_paid'];

        // NEVER-PAID dead-end fix: createReturn allows returns on shipped/delivered orders that may
        // never have been captured. Such an RMA has no money to refund — refundPayment would 409
        // forever, leaving the return stuck at 'received'. Resolve it to a terminal closed/amount-0
        // state (no provider call), so the RMA reaches a clean end instead of a permanent 409.
        const alreadyRefunded = order && order.paymentStatus === 'refunded';
        const neverPaid = order && !REFUNDABLE.includes(order.paymentStatus) && !alreadyRefunded;
        if (neverPaid) {
            const CLOSED_UNPAID_REASON = 'order_never_paid';
            // Stamp the reason on the return's own metadata so it is PERSISTED, not just returned —
            // a closed/refund-0 RMA that requested 'refunded' must carry why no money moved.
            const metadata = { ...(ret.metadata || {}), closedReason: CLOSED_UNPAID_REASON };
            await ret.update({ status: 'closed', totalRefund: 0, refundMethod: 'none', metadata, processedAt: new Date(), processedBy: userId });
            await OrdersOrder.update({ fulfillmentStatus: 'returned' }, { where: { id: ret.orderId, storeId } });
            await cache.del(cache.keys.order(ret.orderId));
            // Structured operational record via the alerts mechanism (no console.* in service code).
            await alerts.dispatch({
                severity: alerts.SEVERITY.INFO,
                title: 'Return closed without refund (order never paid)',
                body: `Return ${ret.returnNumber} on order ${ret.orderId} was closed at amount 0 because the order was never captured.`,
                data: { evt: 'return.closed_unpaid', storeId, returnId, orderId: ret.orderId, reason: CLOSED_UNPAID_REASON },
                idempotencyKey: `return-closed-unpaid:${storeId}:${returnId}`,
            }).catch(() => {});
            // Surface the reason to the caller so the forced 'closed' (not the requested 'refunded')
            // is not a silent surprise.
            return { ...ret.toJSON(), reason: CLOSED_UNPAID_REASON };
        }

        const itemsTotal = (ret.items || []).reduce((s, i) => s + Number(i.refundAmount || 0), 0);
        // Per-item server-derived total when present, else the full captured order total.
        let amount = itemsTotal > 0 ? itemsTotal : (order ? Number(order.totalAmount) : 0);
        if (!(amount > 0)) throw new AppError('VALIDATION_ERROR', 'Cannot determine a positive refund amount for this return', 400);

        // Idempotency / crash-safety: if the order was already refunded (e.g. a prior attempt
        // issued the provider refund but crashed before this return row was updated), do NOT
        // issue a second refund — just reconcile the return status. (refundPayment itself also
        // 409s on an already-refunded order, so this avoids both a double charge and a stuck state.)
        let refund = null;
        if (!alreadyRefunded) {
            refund = await orderService.refundPayment(storeId, ret.orderId, { amount, reason: `Return ${ret.returnNumber}` });
        }

        await ret.update({
            status,
            totalRefund: amount,
            refundMethod: (refund && refund.provider) || ret.refundMethod || 'provider',
            processedAt: new Date(),
            processedBy: userId,
        });
        // Reflect the return on the order's fulfillment lifecycle.
        await OrdersOrder.update({ fulfillmentStatus: 'returned' }, { where: { id: ret.orderId, storeId } });
        await cache.del(cache.keys.order(ret.orderId));
        return ret.toJSON();
    }

    const updates = { status };
    if (['closed', 'received', 'approved', 'rejected'].includes(status)) { updates.processedAt = new Date(); updates.processedBy = userId; }
    await ret.update(updates);
    return ret.toJSON();
}

module.exports = { listReturns, listMyReturns, createReturn, updateReturnStatus };

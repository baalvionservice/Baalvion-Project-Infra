'use strict';
const { Op } = require('sequelize');
const { OrdersReturn, OrdersReturnItem, OrdersOrder, OrdersCustomer, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination, buildPaginated } = require('../utils/pagination');
const cache = require('./cacheService');
const ownership = require('./ownership');
const orderService = require('./orderService');

async function orderOwnerUserId(customerId) {
    if (!customerId) return null;
    const c = await OrdersCustomer.findByPk(customerId, { attributes: ['userId'] });
    return c ? c.userId : null;
}

function generateReturnNumber() {
    const ts = Date.now().toString(36).toUpperCase();
    return `RET-${ts}`;
}

async function listReturns(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = { storeId };
    if (query.status) where.status = query.status;
    if (query.orderId) where.orderId = query.orderId;
    const { rows, count } = await OrdersReturn.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']], include: [{ model: OrdersReturnItem, as: 'items' }] });
    return buildPaginated(rows, count, { page, limit });
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
    return buildPaginated(rows, count, { page, limit });
}

async function createReturn(storeId, body, actor) {
    const { orderId, reason, notes, items } = body;
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    // Ownership: a caller may only request a return on an order they own (staff may on any).
    await ownership.enforce(actor, await orderOwnerUserId(order.customerId), { resourceType: 'order', resourceId: orderId, storeId, action: 'return.create' });
    if (!['delivered', 'shipped'].includes(order.status)) throw new AppError('CONFLICT', 'Returns can only be requested for delivered or shipped orders', 409);

    const returnRecord = await sequelize.transaction(async (t) => {
        const ret = await OrdersReturn.create({ orderId, customerId: order.customerId, storeId, returnNumber: generateReturnNumber(), status: 'requested', reason, notes }, { transaction: t });
        if (items?.length) {
            await OrdersReturnItem.bulkCreate(items.map(i => ({ returnId: ret.id, orderItemId: i.orderItemId, quantity: i.quantity, reason: i.reason, condition: i.condition || 'good', refundAmount: i.refundAmount || 0 })), { transaction: t });
        }
        return ret;
    });
    return returnRecord.toJSON();
}

async function updateReturnStatus(storeId, returnId, status, userId) {
    const ret = await OrdersReturn.findOne({ where: { id: returnId, storeId } });
    if (!ret) throw new AppError('NOT_FOUND', 'Return not found', 404);
    const updates = { status };
    if (['refunded', 'closed', 'received', 'approved', 'rejected'].includes(status)) { updates.processedAt = new Date(); updates.processedBy = userId; }
    await ret.update(updates);
    if (status === 'refunded') {
        await cache.del(cache.keys.order(ret.orderId));
    }
    return ret.toJSON();
}

module.exports = { listReturns, createReturn, updateReturnStatus };

'use strict';
const { Op } = require('sequelize');
const { OrdersOrder, OrdersOrderItem, OrdersOrderPayment, OrdersInvoice, OrdersCustomer, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const { parsePagination, buildPaginated } = require('../utils/pagination');

function generateOrderNumber(storeCode = 'ORD') {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${storeCode}-${ts}-${rand}`;
}

async function listOrders(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = { storeId };
    if (query.status) where.status = Array.isArray(query.status) ? { [Op.in]: query.status } : query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.fulfillmentStatus) where.fulfillmentStatus = query.fulfillmentStatus;
    if (query.customerId) where.customerId = query.customerId;
    if (query.search) where.orderNumber = { [Op.iLike]: `%${query.search}%` };
    const { rows, count } = await OrdersOrder.findAndCountAll({
        where, limit, offset, order: [['createdAt', 'DESC']],
        include: [{ model: OrdersOrderItem, as: 'items' }],
    });
    return buildPaginated(rows, count, { page, limit });
}

async function getOrder(storeId, orderId) {
    const cached = await cache.get(cache.keys.order(orderId));
    if (cached && cached.storeId === storeId) return cached;
    const order = await OrdersOrder.findOne({
        where: { id: orderId, storeId },
        include: [
            { model: OrdersOrderItem, as: 'items' },
            { model: OrdersOrderPayment, as: 'payments' },
            { model: OrdersInvoice, as: 'invoice' },
        ],
    });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    const data = order.toJSON();
    await cache.set(cache.keys.order(orderId), data, config.cache.orderTtl);
    return data;
}

async function createOrder(storeId, body) {
    const { customerId, items, currencyCode = 'USD', shippingAmount = 0, taxAmount = 0, discountAmount = 0, discountCode, notes, billingAddress, shippingAddress, metadata = {} } = body;

    if (!items || !items.length) throw new AppError('VALIDATION_ERROR', 'Order must have at least one item', 400);

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const totalAmount = subtotal + parseFloat(shippingAmount) + parseFloat(taxAmount) - parseFloat(discountAmount);
    const orderNumber = generateOrderNumber();

    const order = await sequelize.transaction(async (t) => {
        const o = await OrdersOrder.create({
            storeId, customerId, orderNumber, currencyCode,
            subtotal, discountAmount, shippingAmount, taxAmount, totalAmount,
            discountCode, notes, metadata, billingAddress, shippingAddress,
            status: 'pending', fulfillmentStatus: 'unfulfilled', paymentStatus: 'pending',
        }, { transaction: t });

        const orderItems = items.map(i => ({
            orderId: o.id,
            productId: i.productId || null,
            variantId: i.variantId || null,
            sku: i.sku,
            name: i.name,
            variantName: i.variantName || null,
            quantity: i.quantity,
            price: i.price,
            compareAtPrice: i.compareAtPrice || null,
            total: i.price * i.quantity,
            taxAmount: i.taxAmount || 0,
            fulfillableQuantity: i.quantity,
            metadata: i.metadata || {},
        }));
        await OrdersOrderItem.bulkCreate(orderItems, { transaction: t });

        if (customerId) await OrdersCustomer.increment({ totalOrders: 1, totalSpent: totalAmount }, { where: { id: customerId }, transaction: t });
        return o;
    });

    return order.toJSON();
}

async function updateOrderStatus(storeId, orderId, status, userId) {
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    const allowed = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['processing', 'cancelled'],
        processing: ['shipped', 'cancelled'],
        shipped: ['delivered'],
        delivered: ['refunded'],
    };
    if (allowed[order.status] && !allowed[order.status].includes(status)) {
        throw new AppError('CONFLICT', `Cannot transition from ${order.status} to ${status}`, 409);
    }
    const updates = { status };
    if (status === 'cancelled') { updates.cancelledAt = new Date(); updates.cancelReason = 'Manual cancellation'; }
    await order.update(updates);
    await cache.del(cache.keys.order(orderId));
    return order.toJSON();
}

async function cancelOrder(storeId, orderId, reason) {
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    if (['delivered', 'refunded', 'cancelled'].includes(order.status)) throw new AppError('CONFLICT', `Cannot cancel a ${order.status} order`, 409);
    await order.update({ status: 'cancelled', cancelledAt: new Date(), cancelReason: reason });
    await cache.del(cache.keys.order(orderId));
    return order.toJSON();
}

async function recordPayment(storeId, orderId, body) {
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    const payment = await OrdersOrderPayment.create({ orderId, ...body });
    if (['captured', 'authorized'].includes(body.status)) {
        await order.update({ paymentStatus: 'paid', status: order.status === 'pending' ? 'confirmed' : order.status });
    }
    await cache.del(cache.keys.order(orderId));
    return payment.toJSON();
}

module.exports = { listOrders, getOrder, createOrder, updateOrderStatus, cancelOrder, recordPayment };

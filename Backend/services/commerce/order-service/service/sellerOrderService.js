'use strict';
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { AppError } = require('../utils/errors');
const orderService = require('./orderService');
const shipmentService = require('./shipmentService');

/**
 * Orders as a SELLER sees them. Commerce products and orders live in one Postgres DB (see
 * orderService's cross-schema reads), so a seller's lines are the order items whose product was
 * created by the caller. A seller only ever gets their own lines, plus the buyer details they
 * need to fulfil and judge the sale — never other sellers' lines or customers.
 */
async function listSellerOrders(storeId, sellerUserId, { limit = 50 } = {}) {
    const rows = await sequelize.query(
        `SELECT o.id, o.order_number AS "orderNumber", o.status, o.payment_status AS "paymentStatus",
                o.currency_code AS "currencyCode", o.created_at AS "createdAt", o.shipping_address AS "shippingAddress",
                mp.member_number AS "buyerMemberNumber",
                c.id AS "customerId", c.first_name AS "firstName", c.last_name AS "lastName", c.email, c.phone,
                (SELECT COUNT(*)::int FROM orders.orders_orders po WHERE po.customer_id = c.id AND po.payment_status = 'paid') AS "buyerPaidOrders",
                (SELECT ROUND(AVG(br.rating)::numeric, 2)::float FROM orders.orders_buyer_ratings br WHERE br.customer_id = c.id) AS "buyerRatingAverage",
                (SELECT COUNT(*)::int FROM orders.orders_buyer_ratings br WHERE br.customer_id = c.id) AS "buyerRatingCount",
                (SELECT COUNT(DISTINCT p2.created_by) = 1 FROM orders.orders_order_items i2
                   JOIN commerce.commerce_products p2 ON p2.id = i2.product_id WHERE i2.order_id = o.id) AS "soleSeller",
                mine.rating AS "myRating", mine.comment AS "myComment",
                (SELECT json_agg(json_build_object('id', i.id, 'productId', i.product_id, 'name', i.name, 'sku', i.sku, 'quantity', i.quantity, 'price', i.price))
                   FROM orders.orders_order_items i
                   JOIN commerce.commerce_products p ON p.id = i.product_id
                  WHERE i.order_id = o.id AND p.created_by::text = :seller) AS items
           FROM orders.orders_orders o
           LEFT JOIN orders.orders_customers c ON c.id = o.customer_id
           LEFT JOIN commerce.commerce_member_profiles mp ON mp.user_id::text = c.user_id::text
           LEFT JOIN orders.orders_buyer_ratings mine ON mine.order_id = o.id AND mine.seller_user_id::text = :seller
          WHERE o.store_id = :storeId
            AND EXISTS (SELECT 1 FROM orders.orders_order_items i
                          JOIN commerce.commerce_products p ON p.id = i.product_id
                         WHERE i.order_id = o.id AND p.created_by::text = :seller)
          ORDER BY o.created_at DESC
          LIMIT :limit`,
        { type: QueryTypes.SELECT, replacements: { storeId, seller: String(sellerUserId), limit: Math.min(Number(limit) || 50, 200) } },
    );
    return rows.map((r) => ({
        id: r.id,
        orderNumber: r.orderNumber,
        status: r.status,
        paymentStatus: r.paymentStatus,
        currencyCode: r.currencyCode,
        createdAt: r.createdAt,
        shippingAddress: r.shippingAddress,
        items: r.items || [],
        buyer: {
            name: [r.firstName, r.lastName].filter(Boolean).join(' ') || null,
            email: r.email || null,
            phone: r.phone || null,
            memberNumber: r.buyerMemberNumber ? `HR-${r.buyerMemberNumber}` : null,
            paidOrders: r.buyerPaidOrders || 0,
            ratingAverage: r.buyerRatingAverage,
            ratingCount: r.buyerRatingCount || 0,
        },
        myRating: r.myRating == null ? null : { rating: r.myRating, comment: r.myComment },
        soleSeller: !!r.soleSeller,
        canRateBuyer: r.status === 'delivered' && r.paymentStatus === 'paid' && r.myRating == null && !!r.customerId,
    }));
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function rateBuyer(storeId, sellerUserId, orderId, { rating, comment }) {
    if (!UUID_RE.test(String(orderId))) throw new AppError('NOT_FOUND', 'Order not found', 404);
    const [order] = await sequelize.query(
        `SELECT o.id, o.status, o.payment_status AS "paymentStatus", o.customer_id AS "customerId"
           FROM orders.orders_orders o
          WHERE o.id = :orderId AND o.store_id = :storeId
            AND EXISTS (SELECT 1 FROM orders.orders_order_items i
                          JOIN commerce.commerce_products p ON p.id = i.product_id
                         WHERE i.order_id = o.id AND p.created_by::text = :seller)`,
        { type: QueryTypes.SELECT, replacements: { orderId, storeId, seller: String(sellerUserId) } },
    );
    // Same answer whether the order doesn't exist or just isn't this seller's — no probing.
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    if (order.status !== 'delivered' || order.paymentStatus !== 'paid') {
        throw new AppError('CONFLICT', 'You can rate the buyer once the order is delivered and paid', 409);
    }
    if (!order.customerId) throw new AppError('CONFLICT', 'This order has no buyer account to rate', 409);

    try {
        await sequelize.query(
            `INSERT INTO orders.orders_buyer_ratings (store_id, order_id, customer_id, seller_user_id, rating, comment)
             VALUES (:storeId, :orderId, :customerId, :seller, :rating, :comment)`,
            { replacements: { storeId, orderId, customerId: order.customerId, seller: sellerUserId, rating, comment: comment || null } },
        );
    } catch (err) {
        if (err.parent && err.parent.code === '23505') throw new AppError('CONFLICT', 'You already rated this buyer for this order', 409);
        throw err;
    }
    return { orderId, rating, comment: comment || null };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SELLER_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'];

// Loads the order only if it contains at least one of the caller's products, and says whether
// the caller is the ONLY seller on it. Same 404 for "missing" and "not yours".
async function loadOwnOrder(storeId, sellerUserId, orderId) {
    if (!UUID.test(String(orderId))) throw new AppError('NOT_FOUND', 'Order not found', 404);
    const [row] = await sequelize.query(
        `SELECT o.id, o.status, o.payment_status AS "paymentStatus",
                COUNT(DISTINCT p.created_by)::int AS "sellerCount",
                BOOL_OR(p.created_by::text = :seller) AS "mine"
           FROM orders.orders_orders o
           JOIN orders.orders_order_items i ON i.order_id = o.id
           JOIN commerce.commerce_products p ON p.id = i.product_id
          WHERE o.id = :orderId AND o.store_id = :storeId
          GROUP BY o.id`,
        { type: QueryTypes.SELECT, replacements: { orderId, storeId, seller: String(sellerUserId) } },
    );
    if (!row || !row.mine) throw new AppError('NOT_FOUND', 'Order not found', 404);
    return { ...row, soleSeller: row.sellerCount === 1 };
}

function assertPaid(order) {
    if (order.paymentStatus !== 'paid') throw new AppError('CONFLICT', 'The order has not been paid yet', 409);
}

// Seller fulfilment. Statuses apply to the whole order, so a seller may only move an order that
// holds nobody else's items; mixed orders are handled by an admin.
async function setStatus(storeId, sellerUserId, orderId, status) {
    if (!SELLER_STATUSES.includes(status)) throw new AppError('VALIDATION_ERROR', `status must be one of ${SELLER_STATUSES.join(', ')}`, 400);
    const order = await loadOwnOrder(storeId, sellerUserId, orderId);
    assertPaid(order);
    if (!order.soleSeller) throw new AppError('FORBIDDEN', 'This order includes another seller\'s items. Ask an admin to update its status.', 403);
    return orderService.updateOrderStatus(storeId, orderId, status, sellerUserId);
}

// Adding tracking is allowed on mixed orders — it only records a parcel, it doesn't change the order.
async function addShipment(storeId, sellerUserId, orderId, body) {
    const order = await loadOwnOrder(storeId, sellerUserId, orderId);
    assertPaid(order);
    return shipmentService.createShipment(storeId, orderId, body);
}

module.exports = { listSellerOrders, rateBuyer, setStatus, addShipment };

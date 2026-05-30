'use strict';
// Commerce analytics — real aggregations over orders/order-items (store-scoped). Excludes
// cancelled/refunded orders from revenue. Backs the Amarise admin analytics dashboard.
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

const VALID = "status NOT IN ('cancelled','refunded')";

function range(query = {}) {
    const from = query.from ? new Date(query.from) : new Date(Date.now() - 90 * 864e5);
    const to = query.to ? new Date(query.to) : new Date();
    return { from, to };
}

async function summary(storeId, query = {}) {
    const { from, to } = range(query);
    const [row] = await sequelize.query(
        `SELECT COALESCE(SUM(total_amount), 0)::float AS revenue,
                COUNT(*)::int AS orders,
                COUNT(DISTINCT customer_id)::int AS customers,
                COALESCE(MAX(currency_code), 'USD') AS currency
         FROM orders.orders_orders
         WHERE store_id = :storeId AND ${VALID} AND created_at BETWEEN :from AND :to`,
        { replacements: { storeId, from, to }, type: QueryTypes.SELECT }
    );
    const orders = row?.orders || 0;
    const revenue = row?.revenue || 0;
    return {
        revenue, orders, customers: row?.customers || 0,
        avgOrderValue: orders ? Number((revenue / orders).toFixed(2)) : 0,
        currency: row?.currency || 'USD',
        periodStart: from.toISOString(), periodEnd: to.toISOString(),
    };
}

async function topProducts(storeId, query = {}, limit = 10) {
    const { from, to } = range(query);
    return sequelize.query(
        `SELECT i.product_id AS "productId", MAX(i.name) AS name,
                SUM(i.total)::float AS revenue, SUM(i.quantity)::int AS "unitsSold"
         FROM orders.orders_order_items i
         JOIN orders.orders_orders o ON o.id = i.order_id
         WHERE o.store_id = :storeId AND o.${VALID} AND o.created_at BETWEEN :from AND :to
         GROUP BY i.product_id
         ORDER BY revenue DESC
         LIMIT :limit`,
        { replacements: { storeId, from, to, limit: Number(limit) || 10 }, type: QueryTypes.SELECT }
    );
}

async function salesByCountry(storeId, query = {}) {
    const { from, to } = range(query);
    const rows = await sequelize.query(
        `SELECT COALESCE(shipping_address->>'country', shipping_address->>'countryCode', 'Unknown') AS country,
                SUM(total_amount)::float AS revenue
         FROM orders.orders_orders
         WHERE store_id = :storeId AND ${VALID} AND created_at BETWEEN :from AND :to
         GROUP BY 1 ORDER BY revenue DESC`,
        { replacements: { storeId, from, to }, type: QueryTypes.SELECT }
    );
    return rows.reduce((acc, r) => { acc[r.country] = r.revenue; return acc; }, {});
}

async function revenueTimeSeries(storeId, query = {}, granularity = 'day') {
    const gran = ['day', 'week', 'month'].includes(granularity) ? granularity : 'day';
    const { from, to } = range(query);
    return sequelize.query(
        `SELECT TO_CHAR(DATE_TRUNC(:gran, created_at), 'YYYY-MM-DD') AS date,
                SUM(total_amount)::float AS revenue
         FROM orders.orders_orders
         WHERE store_id = :storeId AND ${VALID} AND created_at BETWEEN :from AND :to
         GROUP BY 1 ORDER BY 1`,
        { replacements: { storeId, from, to, gran }, type: QueryTypes.SELECT }
    );
}

module.exports = { summary, topProducts, salesByCountry, revenueTimeSeries };

'use strict';
// Commerce analytics — real aggregations over orders/order-items. The STORE-scoped fns below
// (summary/topProducts/...) are gross-booked: they include any non-cancelled/refunded order
// (see GROSS_BOOKED) and surface a single MAX(currency_code) label — documented as gross-booked,
// not earned. The PLATFORM-scoped platformRevenue() below is the EARNED, currency-normalized
// aggregate that backs the admin /commerce/revenue page (C2 contract).
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const markets = require('../config/markets');
const fxRateProvider = require('./fxRateProvider');

// Gross-booked filter for the store-level dashboards: every non-cancelled/refunded order, paid or
// not. NOTE: this counts unpaid pending orders — these endpoints are GROSS-BOOKED bookings, not
// earned revenue. The platform endpoint (and the C2 contract) uses EARNED instead (see below).
const GROSS_BOOKED = "status NOT IN ('cancelled','refunded')";
// Earned-revenue recognition (C2): money actually captured. Pending/cancelled/refunded are
// reported separately and NEVER summed into earned.
const EARNED = "payment_status IN ('paid','partially_paid')";

function range(query = {}) {
    const from = query.from ? new Date(query.from) : new Date(Date.now() - 90 * 864e5);
    const to = query.to ? new Date(query.to) : new Date();
    return { from, to };
}

// USD value of a native market revenue. markets.fxRate is the USD→market rate (convertFromBase
// multiplies by it), so the inverse — native / fxRate — converts back to USD. Uses the live-feed
// effective rate when enabled+fresh, else the static market rate. Unknown markets (legacy rows
// already stored in USD, or a null market) pass through as-is.
function toBaseUsd(market, nativeAmount) {
    const amt = Number(nativeAmount) || 0;
    const m = markets.getMarket(market);
    if (!m) return Math.round((amt + Number.EPSILON) * 100) / 100; // already USD / untagged
    const fx = fxRateProvider.getEffectiveFxRate(m.currency, m.fxRate);
    if (!Number.isFinite(fx) || fx <= 0) return Math.round((amt + Number.EPSILON) * 100) / 100;
    return Math.round(((amt / fx) + Number.EPSILON) * 100) / 100;
}

async function summary(storeId, query = {}) {
    const { from, to } = range(query);
    // `revenue` is GROSS-BOOKED (all non-cancelled/refunded bookings, paid or not) for backward
    // compatibility; `earnedRevenue`/`pendingRevenue` break out the captured-vs-awaiting split so a
    // consumer is never misled into treating unpaid pending bookings as earned money.
    const [row] = await sequelize.query(
        `SELECT COALESCE(SUM(total_amount), 0)::float AS revenue,
                COALESCE(SUM(total_amount) FILTER (WHERE ${EARNED}), 0)::float AS earned_revenue,
                COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'pending'), 0)::float AS pending_revenue,
                COUNT(*)::int AS orders,
                COUNT(DISTINCT customer_id)::int AS customers,
                COALESCE(MAX(currency_code), 'USD') AS currency
         FROM orders.orders_orders
         WHERE store_id = :storeId AND ${GROSS_BOOKED} AND created_at BETWEEN :from AND :to`,
        { replacements: { storeId, from, to }, type: QueryTypes.SELECT }
    );
    const orders = row?.orders || 0;
    const revenue = row?.revenue || 0;
    return {
        revenue, // gross-booked (legacy field; kept for backward compatibility)
        earnedRevenue: row?.earned_revenue || 0,
        pendingRevenue: row?.pending_revenue || 0,
        orders, customers: row?.customers || 0,
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
         WHERE o.store_id = :storeId AND o.${GROSS_BOOKED} AND o.created_at BETWEEN :from AND :to
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
         WHERE store_id = :storeId AND ${GROSS_BOOKED} AND created_at BETWEEN :from AND :to
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
         WHERE store_id = :storeId AND ${GROSS_BOOKED} AND created_at BETWEEN :from AND :to
         GROUP BY 1 ORDER BY 1`,
        { replacements: { storeId, from, to, gran }, type: QueryTypes.SELECT }
    );
}

// ── Platform-wide order revenue (C2) ───────────────────────────────────────────
// Cross-store EARNED revenue, currency-normalized. Backs the admin /commerce/revenue page.
//
// Correctness rules enforced here:
//   (A) Earned = payment_status IN ('paid','partially_paid'). pending/cancelled/refunded are
//       reported in byStatus separately and NEVER summed into the earned totals.
//   (B) total_amount is stored in EACH row's own currency (mixed currencies). We group by the
//       persisted `market` column and keep each market's NATIVE currency; the single normalized
//       base-USD total is computed by FX-converting EACH market via toBaseUsd() — we NEVER naively
//       SUM total_amount across mixed currencies.
//   (C) Grouping is by the `market` column, NOT shipping_address JSONB country.
//
// `granularity` (day|week|month) controls the time series bucket. Optional `storeId` scopes to a
// single store (e.g. the Amarisé store) while still spanning all its markets.
async function platformRevenue(query = {}) {
    const { from, to } = range(query);
    const granularity = ['day', 'week', 'month'].includes(query.granularity) ? query.granularity : 'day';
    const storeId = query.storeId || null;
    // Refresh the live FX memo so base-USD normalization uses the SAME effective rates the
    // storefront/order priced at (no-op when FX_LIVE_FEED is off → static rates).
    await fxRateProvider.primeFromCache().catch(() => {});

    const storeFilter = storeId ? 'AND store_id = :storeId' : '';
    const repl = { from, to, ...(storeId ? { storeId } : {}) };

    // (A)+(B)+(C): earned revenue grouped by the market column, native currency retained.
    const marketRows = await sequelize.query(
        `SELECT COALESCE(market, 'unknown') AS market,
                COALESCE(MAX(currency_code), 'USD') AS "currencyCode",
                COALESCE(SUM(total_amount), 0)::float AS revenue,
                COALESCE(SUM(tax_amount), 0)::float AS tax,
                COUNT(*)::int AS orders
         FROM orders.orders_orders
         WHERE ${EARNED} ${storeFilter} AND created_at BETWEEN :from AND :to
         GROUP BY COALESCE(market, 'unknown')`,
        { replacements: repl, type: QueryTypes.SELECT },
    );

    // Normalize each market to USD (never sum mixed currencies). Earned totals are the SUM of the
    // per-market FX-converted values — by construction this equals Σ byMarket.revenueBaseUsd.
    const byMarketRaw = marketRows.map((r) => {
        const market = r.market;
        const revenueBaseUsd = toBaseUsd(market === 'unknown' ? null : market, r.revenue);
        const taxBaseUsd = toBaseUsd(market === 'unknown' ? null : market, r.tax);
        return {
            market,
            revenue: Number(r.revenue) || 0,        // native market currency
            currencyCode: r.currencyCode || 'USD',
            orders: r.orders || 0,
            revenueBaseUsd, taxBaseUsd,
        };
    });
    const revenueBaseUsd = Math.round((byMarketRaw.reduce((s, m) => s + m.revenueBaseUsd, 0) + Number.EPSILON) * 100) / 100;
    const taxBaseUsd = Math.round((byMarketRaw.reduce((s, m) => s + m.taxBaseUsd, 0) + Number.EPSILON) * 100) / 100;
    const totalOrders = byMarketRaw.reduce((s, m) => s + m.orders, 0);

    const byMarket = byMarketRaw.map((m) => ({
        market: m.market,
        revenue: m.revenue,
        currencyCode: m.currencyCode,
        orders: m.orders,
        // Share of the normalized base-USD total (so shares across mixed currencies are comparable).
        sharePct: revenueBaseUsd > 0 ? Math.round((m.revenueBaseUsd / revenueBaseUsd) * 1000) / 10 : 0,
    }));
    // DISPLAY-ONLY rounding correction: each sharePct is rounded independently, so N equal markets can
    // sum to e.g. 99.9 instead of 100. Push the residual onto the LARGEST market so the displayed
    // shares total exactly 100. This never touches any money/revenue field.
    if (revenueBaseUsd > 0 && byMarket.length) {
        const sumPct = byMarket.reduce((s, m) => s + m.sharePct, 0);
        const residual = Math.round((100 - sumPct) * 10) / 10;
        if (residual !== 0) {
            const largestIdx = byMarketRaw.reduce(
                (best, m, i) => (m.revenueBaseUsd > byMarketRaw[best].revenueBaseUsd ? i : best),
                0,
            );
            byMarket[largestIdx].sharePct = Math.round((byMarket[largestIdx].sharePct + residual) * 10) / 10;
        }
    }

    // byStatus: grouped by payment_status across the SAME store/date window. Reported for ALL
    // statuses (paid/partially_paid/pending/refunded/...) — earned vs awaiting is the consumer's call;
    // we never fold pending/refunded into the earned totals above. Revenue here is base-USD-normalized
    // per-row by joining the market, so this column is comparable across currencies too.
    const statusRows = await sequelize.query(
        `SELECT payment_status AS status,
                COALESCE(market, 'unknown') AS market,
                COUNT(*)::int AS count,
                COALESCE(SUM(total_amount), 0)::float AS revenue
         FROM orders.orders_orders
         WHERE 1=1 ${storeFilter} AND created_at BETWEEN :from AND :to
         GROUP BY payment_status, COALESCE(market, 'unknown')`,
        { replacements: repl, type: QueryTypes.SELECT },
    );
    const statusAgg = new Map();
    for (const r of statusRows) {
        const prev = statusAgg.get(r.status) || { status: r.status, count: 0, revenue: 0 };
        prev.count += r.count;
        prev.revenue += toBaseUsd(r.market === 'unknown' ? null : r.market, r.revenue);
        statusAgg.set(r.status, prev);
    }
    const byStatus = [...statusAgg.values()].map((s) => ({
        status: s.status, count: s.count, revenue: Math.round((s.revenue + Number.EPSILON) * 100) / 100,
    }));

    // Time series of EARNED base-USD revenue, bucketed by granularity and normalized per market.
    const seriesRows = await sequelize.query(
        `SELECT TO_CHAR(DATE_TRUNC(:gran, created_at), 'YYYY-MM-DD') AS date,
                COALESCE(market, 'unknown') AS market,
                COALESCE(SUM(total_amount), 0)::float AS revenue,
                COUNT(*)::int AS orders
         FROM orders.orders_orders
         WHERE ${EARNED} ${storeFilter} AND created_at BETWEEN :from AND :to
         GROUP BY 1, COALESCE(market, 'unknown') ORDER BY 1`,
        { replacements: { ...repl, gran: granularity }, type: QueryTypes.SELECT },
    );
    const seriesAgg = new Map();
    for (const r of seriesRows) {
        const prev = seriesAgg.get(r.date) || { date: r.date, revenueBaseUsd: 0, orders: 0 };
        prev.revenueBaseUsd += toBaseUsd(r.market === 'unknown' ? null : r.market, r.revenue);
        prev.orders += r.orders;
        seriesAgg.set(r.date, prev);
    }
    const series = [...seriesAgg.values()]
        .map((s) => ({ date: s.date, revenueBaseUsd: Math.round((s.revenueBaseUsd + Number.EPSILON) * 100) / 100, orders: s.orders }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        totals: { revenueBaseUsd, taxBaseUsd, orders: totalOrders, baseCurrency: 'USD' },
        byMarket, byStatus, series,
    };
}

module.exports = { summary, topProducts, salesByCountry, revenueTimeSeries, platformRevenue, toBaseUsd };

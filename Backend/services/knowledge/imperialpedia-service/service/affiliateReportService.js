'use strict';
const { QueryTypes } = require('sequelize');
const { AppError } = require('../utils/errors');

// Never interpolate the caller's groupBy value directly into SQL — map through this allowlist
// to a fixed, safe column/CASE expression instead.
const GROUP_EXPRESSIONS = {
    merchant: 'ap.merchant_name',
    category: "COALESCE(ap.category, 'uncategorized')",
    contentType: "CASE WHEN ap.article_id IS NOT NULL THEN 'article' ELSE 'standalone' END",
    product: 'ap.product_name',
};

const buildReport = async ({ groupBy = 'merchant', from, to }) => {
    const groupExpr = GROUP_EXPRESSIONS[groupBy];
    if (!groupExpr) {
        throw new AppError('VALIDATION_ERROR', `groupBy must be one of: ${Object.keys(GROUP_EXPRESSIONS).join(', ')}`, 400);
    }

    const db = require('../models');
    const fromDate = from ? new Date(from) : new Date(0);
    const toDate = to ? new Date(to) : new Date();
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        throw new AppError('VALIDATION_ERROR', 'from/to must be valid dates', 400);
    }

    // estimated_revenue: see migrations/20260005 — SUM over every click row of that click's
    // product's (avg_order_value * commission_rate%). This is a projection assuming every click
    // converts at the admin-entered order value, NOT a count of confirmed sales — there is no
    // purchase/postback signal anywhere in this system to compute real revenue from.
    const rows = await db.sequelize.query(
        `SELECT
            ${groupExpr} AS group_key,
            COUNT(ac.id)::int AS clicks,
            COUNT(DISTINCT ap.id)::int AS product_count,
            ROUND(SUM(COALESCE(ap.avg_order_value, 0) * COALESCE(ap.commission_rate, 0) / 100.0), 2) AS estimated_revenue
         FROM imperialpedia.affiliate_clicks ac
         JOIN imperialpedia.affiliate_products ap ON ap.id = ac.product_id
         WHERE ac.created_at BETWEEN :fromDate AND :toDate
         GROUP BY group_key
         ORDER BY estimated_revenue DESC NULLS LAST, clicks DESC`,
        { replacements: { fromDate, toDate }, type: QueryTypes.SELECT }
    );

    const totals = rows.reduce(
        (acc, r) => ({ clicks: acc.clicks + r.clicks, estimatedRevenue: acc.estimatedRevenue + Number(r.estimated_revenue || 0) }),
        { clicks: 0, estimatedRevenue: 0 }
    );

    return {
        groupBy,
        range: { from: fromDate.toISOString(), to: toDate.toISOString() },
        rows: rows.map((r) => ({
            groupKey: r.group_key,
            clicks: r.clicks,
            productCount: r.product_count,
            estimatedRevenue: Number(r.estimated_revenue || 0),
        })),
        totals: { clicks: totals.clicks, estimatedRevenue: Math.round(totals.estimatedRevenue * 100) / 100 },
        // Surfaced verbatim in the admin UI next to the figure — see ArticleForm-style
        // disclosure convention used elsewhere (affiliate disclosure text on Provider cards).
        disclaimer: 'Estimated revenue assumes every click converts at the admin-entered average order value × commission rate. No purchase/conversion tracking exists yet — treat this as a projection, not confirmed revenue.',
    };
};

// Minimal RFC 4180-ish CSV — values here are merchant/category names, integers, and decimals;
// only the group key is free text, so only that needs quote-escaping.
const escapeCsvField = (value) => {
    const str = String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

const toCsv = (report) => {
    const header = ['group', 'clicks', 'productCount', 'estimatedRevenue'];
    const lines = [header.join(',')];
    for (const row of report.rows) {
        lines.push([escapeCsvField(row.groupKey), row.clicks, row.productCount, row.estimatedRevenue].join(','));
    }
    lines.push(['TOTAL', report.totals.clicks, '', report.totals.estimatedRevenue].join(','));
    return lines.join('\n');
};

module.exports = { buildReport, toCsv, GROUP_EXPRESSIONS };

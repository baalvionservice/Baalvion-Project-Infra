'use strict';
// Platform revenue aggregate (C2). Stubs the data layer (sequelize.query) so the test exercises the
// REAL aggregation/normalization logic with seeded rows in >=2 markets and mixed payment_status.
// Asserts: (A) normalized revenueBaseUsd == Σ FX-converted per-market revenues; (B) pending/cancelled
// are excluded from earned; (C) no single scalar sums mixed currencies (each market keeps native ccy).
process.env.FX_LIVE_FEED = 'false'; // pure static rates
process.env.FX_USD_USD = '1';
process.env.FX_USD_GBP = '0.79';
process.env.FX_USD_INR = '83.3';
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';

const { test } = require('node:test');
const assert = require('node:assert');

const models = require('../models');

// ── Seed: EARNED rows in 2 markets (us paid + uk partially_paid) and a PENDING us row that must be
// excluded from earned. Native currency per market: us=USD, uk=GBP, in=INR.
//   us paid:           1000 USD  → 1000 USD base
//   uk partially_paid:  790 GBP  →  790/0.79 = 1000 USD base
//   ⇒ revenueBaseUsd should be 2000, never a naive 1000+790=1790 cross-currency sum.
const EARNED_MARKET_ROWS = [
    { market: 'us', currencyCode: 'USD', revenue: 1000, tax: 85, orders: 1 },
    { market: 'uk', currencyCode: 'GBP', revenue: 790, tax: 131.67, orders: 1 },
];
const STATUS_ROWS = [
    { status: 'paid', market: 'us', count: 1, revenue: 1000 },
    { status: 'partially_paid', market: 'uk', count: 1, revenue: 790 },
    { status: 'pending', market: 'us', count: 1, revenue: 500 },     // must NOT enter earned totals
    { status: 'cancelled', market: 'in', count: 1, revenue: 41650 }, // must NOT enter earned totals
];
const SERIES_ROWS = [
    { date: '2026-06-01', market: 'us', revenue: 1000, orders: 1 },
    { date: '2026-06-02', market: 'uk', revenue: 790, orders: 1 },
];

// Route each query to its canned rows by matching a distinctive fragment of the SQL.
models.sequelize.query = async (sql) => {
    const s = String(sql);
    if (s.includes('GROUP BY COALESCE(market')) return EARNED_MARKET_ROWS;       // byMarket
    if (s.includes('GROUP BY payment_status')) return STATUS_ROWS;               // byStatus (no EARNED filter)
    if (s.includes("DATE_TRUNC")) return SERIES_ROWS;                            // series
    return [];
};

const analyticsService = require('../service/analyticsService');

test('platformRevenue normalizes mixed currencies to base USD (Σ per-market == total)', async () => {
    const out = await analyticsService.platformRevenue({ from: '2026-06-01', to: '2026-06-30' });

    // (A) normalized revenueBaseUsd equals the sum of FX-converted per-market revenues.
    assert.equal(out.totals.baseCurrency, 'USD');
    assert.equal(out.totals.revenueBaseUsd, 2000, 'us 1000 USD + uk 790 GBP→1000 USD = 2000');
    assert.equal(out.totals.orders, 2);

    // (C) each market keeps its NATIVE currency + amount (never naively summed).
    const us = out.byMarket.find((m) => m.market === 'us');
    const uk = out.byMarket.find((m) => m.market === 'uk');
    assert.equal(us.revenue, 1000); assert.equal(us.currencyCode, 'USD');
    assert.equal(uk.revenue, 790);  assert.equal(uk.currencyCode, 'GBP'); // native GBP, NOT 1000
    // sharePct is over the base-USD total (us 1000/2000 = 50, uk 1000/2000 = 50).
    assert.equal(us.sharePct, 50);
    assert.equal(uk.sharePct, 50);
});

test('platformRevenue excludes pending/cancelled from earned, reports them in byStatus', async () => {
    const out = await analyticsService.platformRevenue({});
    // pending + cancelled appear in byStatus but never inflate the earned totals (still 2000).
    assert.equal(out.totals.revenueBaseUsd, 2000);
    const statuses = out.byStatus.map((s) => s.status).sort();
    assert.deepEqual(statuses, ['cancelled', 'paid', 'partially_paid', 'pending']);
    const pending = out.byStatus.find((s) => s.status === 'pending');
    assert.ok(pending && pending.count === 1);
});

test('platformRevenue base-USD series sums per-market buckets', async () => {
    const out = await analyticsService.platformRevenue({ granularity: 'day' });
    const total = out.series.reduce((s, d) => s + d.revenueBaseUsd, 0);
    assert.equal(Math.round(total), 2000); // 1000 USD + 790 GBP→1000 USD
});

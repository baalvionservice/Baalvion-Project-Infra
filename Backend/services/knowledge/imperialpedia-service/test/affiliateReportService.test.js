'use strict';

// Pure-logic tests for the affiliate report module: CSV serialization and groupBy validation.
// No live database — buildReport's actual SQL aggregation is verified separately against a
// real Postgres (see the local end-to-end verification notes), since it's a raw aggregate
// query that's more meaningfully checked against real rows than mocked.
// Run: node --test

const test = require('node:test');
const assert = require('node:assert/strict');

const { buildReport, toCsv, GROUP_EXPRESSIONS } = require('../service/affiliateReportService');

test('buildReport rejects an unknown groupBy before touching the database', async () => {
    await assert.rejects(
        () => buildReport({ groupBy: 'DROP TABLE affiliate_products; --' }),
        (err) => {
            assert.equal(err.code, 'VALIDATION_ERROR');
            assert.equal(err.statusCode, 400);
            return true;
        }
    );
});

test('buildReport rejects invalid from/to dates before touching the database', async () => {
    await assert.rejects(
        () => buildReport({ groupBy: 'merchant', from: 'not-a-date' }),
        (err) => {
            assert.equal(err.code, 'VALIDATION_ERROR');
            return true;
        }
    );
});

test('GROUP_EXPRESSIONS only exposes the allowlisted dimensions', () => {
    assert.deepEqual(Object.keys(GROUP_EXPRESSIONS).sort(), ['category', 'contentType', 'merchant', 'product']);
});

test('toCsv formats a header, one row per group, and a TOTAL row', () => {
    const report = {
        groupBy: 'merchant',
        rows: [
            { groupKey: 'Acme Brokerage', clicks: 10, productCount: 2, estimatedRevenue: 125.5 },
            { groupKey: 'Beta Insurance', clicks: 3, productCount: 1, estimatedRevenue: 9 },
        ],
        totals: { clicks: 13, estimatedRevenue: 134.5 },
    };
    const csv = toCsv(report);
    const lines = csv.split('\n');

    assert.equal(lines[0], 'group,clicks,productCount,estimatedRevenue');
    assert.equal(lines[1], 'Acme Brokerage,10,2,125.5');
    assert.equal(lines[2], 'Beta Insurance,3,1,9');
    assert.equal(lines[3], 'TOTAL,13,,134.5');
    assert.equal(lines.length, 4);
});

test('toCsv quote-escapes a group name containing a comma', () => {
    const report = {
        rows: [{ groupKey: 'Acme, Inc.', clicks: 1, productCount: 1, estimatedRevenue: 5 }],
        totals: { clicks: 1, estimatedRevenue: 5 },
    };
    const csv = toCsv(report);
    assert.ok(csv.includes('"Acme, Inc."'));
});

test('toCsv quote-escapes and doubles an embedded double-quote', () => {
    const report = {
        rows: [{ groupKey: 'The "Best" Broker', clicks: 1, productCount: 1, estimatedRevenue: 5 }],
        totals: { clicks: 1, estimatedRevenue: 5 },
    };
    const csv = toCsv(report);
    assert.ok(csv.includes('"The ""Best"" Broker"'));
});

test('toCsv handles an empty report (no clicks in range) without throwing', () => {
    const report = { rows: [], totals: { clicks: 0, estimatedRevenue: 0 } };
    const csv = toCsv(report);
    assert.equal(csv.split('\n').length, 2); // header + TOTAL only
});

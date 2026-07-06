'use strict';
/**
 * Logistics Core Foundation (Phase 1) — utils/pagination.js verification.
 * Pure, no DB.
 *
 *   node tests/logistics-pagination.verify.js
 */
const assert = require('assert');
const { parseListQuery, DEFAULT_LIMIT, MAX_LIMIT } = require('../utils/pagination');

let pass = 0;
let fail = 0;
const failures = [];

function t(name, fn) {
    try {
        fn();
        pass += 1;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        fail += 1;
        failures.push({ name, message: err.message });
        console.log(`  ✗ ${name}\n      ${err.message}`);
    }
}

t('defaults page=1, limit=DEFAULT_LIMIT, offset=0', () => {
    const r = parseListQuery({});
    assert.strictEqual(r.page, 1);
    assert.strictEqual(r.limit, DEFAULT_LIMIT);
    assert.strictEqual(r.offset, 0);
});

t('computes offset from page/limit', () => {
    const r = parseListQuery({ page: 3, limit: 10 });
    assert.strictEqual(r.offset, 20);
});

t('clamps limit to MAX_LIMIT', () => {
    const r = parseListQuery({ limit: 999999 });
    assert.strictEqual(r.limit, MAX_LIMIT);
});

t('clamps page below 1 up to 1', () => {
    const r = parseListQuery({ page: -5 });
    assert.strictEqual(r.page, 1);
});

t('defaults sort to the first allowed column, DESC', () => {
    const r = parseListQuery({}, { allowedSort: ['created_at', 'status'] });
    assert.deepStrictEqual(r.order, [['created_at', 'DESC']]);
});

t('honors an explicit ascending sort on an allowed column', () => {
    const r = parseListQuery({ sort: 'status' }, { allowedSort: ['created_at', 'status'] });
    assert.deepStrictEqual(r.order, [['status', 'ASC']]);
});

t('honors a "-" prefix for descending sort', () => {
    const r = parseListQuery({ sort: '-status' }, { allowedSort: ['created_at', 'status'] });
    assert.deepStrictEqual(r.order, [['status', 'DESC']]);
});

t('ignores a sort column not in the allow-list (falls back to default)', () => {
    const r = parseListQuery({ sort: 'password_hash' }, { allowedSort: ['created_at'] });
    assert.deepStrictEqual(r.order, [['created_at', 'DESC']]);
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Logistics pagination — ${pass} passed, ${fail} failed`);
if (fail > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f.name}: ${f.message}`);
    process.exit(1);
}
process.exit(0);

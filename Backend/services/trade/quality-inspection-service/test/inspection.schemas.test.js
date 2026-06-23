'use strict';
/**
 * Pure unit tests for the inspection validation schemas. No DB, no network, no HTTP
 * server — these exercise the zod schemas exported by the controller directly.
 * Runner: node:test (built-in), assertions: node:assert. No external dependency.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { schemas } = require('../controller/inspectionController');
const { createSchema, resultSchema, listQuerySchema, MAX_PAGE_SIZE } = schemas;

test('createSchema accepts a valid inspection payload', () => {
    const parsed = createSchema.parse({ type: 'incoming', supplier_id: 'sup-1' });
    assert.equal(parsed.type, 'incoming');
    assert.equal(parsed.supplier_id, 'sup-1');
});

test('createSchema rejects an unknown inspection type', () => {
    assert.throws(() => createSchema.parse({ type: 'not_a_type' }));
});

test('createSchema requires the type field', () => {
    assert.throws(() => createSchema.parse({ supplier_id: 'sup-1' }));
});

test('resultSchema defaults defects to an empty array', () => {
    const parsed = resultSchema.parse({ passed: true });
    assert.deepEqual(parsed.defects, []);
    assert.equal(parsed.passed, true);
});

test('resultSchema defaults defect qty to 1 and validates severity', () => {
    const parsed = resultSchema.parse({
        passed: false,
        defects: [{ severity: 'major', description: 'scratch' }],
    });
    assert.equal(parsed.defects[0].qty, 1);
    assert.equal(parsed.defects[0].severity, 'major');
});

test('resultSchema rejects an invalid defect severity', () => {
    assert.throws(() => resultSchema.parse({ passed: false, defects: [{ severity: 'blocker', description: 'x' }] }));
});

test('listQuerySchema applies default page and limit when absent', () => {
    const parsed = listQuerySchema.parse({});
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 20);
});

test('listQuerySchema coerces numeric strings from the query string', () => {
    const parsed = listQuerySchema.parse({ page: '3', limit: '50' });
    assert.equal(parsed.page, 3);
    assert.equal(parsed.limit, 50);
});

test('listQuerySchema honours a limit at exactly MAX_PAGE_SIZE', () => {
    const parsed = listQuerySchema.parse({ limit: String(MAX_PAGE_SIZE) });
    assert.equal(parsed.limit, MAX_PAGE_SIZE);
});

test('listQuerySchema clamps an oversized limit back to the safe default', () => {
    // A request over the cap must never trigger a full-table scan; it degrades to the
    // default page size rather than being honoured or 422-ing the caller.
    const parsed = listQuerySchema.parse({ limit: String(MAX_PAGE_SIZE + 1) });
    assert.equal(parsed.limit, 20);
    assert.ok(parsed.limit <= MAX_PAGE_SIZE);
});

test('listQuerySchema falls back to the default limit for a non-numeric value', () => {
    const parsed = listQuerySchema.parse({ limit: 'abc' });
    assert.equal(parsed.limit, 20);
});

test('listQuerySchema preserves passthrough filter fields', () => {
    const parsed = listQuerySchema.parse({ orderId: 'o-1', supplierId: 's-1', status: 'passed' });
    assert.equal(parsed.orderId, 'o-1');
    assert.equal(parsed.supplierId, 's-1');
    assert.equal(parsed.status, 'passed');
});

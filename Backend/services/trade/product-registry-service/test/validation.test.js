'use strict';
/**
 * Pure-logic unit tests for product-registry-service.
 * Uses the built-in node:test runner + node:assert — NO external test dependency,
 * NO live database, NO network. Covers the zod validation schemas and the pure
 * HS-prefix helper exported from the controller.
 *
 * Run: node --test   (or: pnpm test)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
    createSchema,
    listQuerySchema,
    prefixes,
    MAX_PAGE_SIZE,
} = require('../controller/productController');

// --- listQuerySchema: pagination defaults + cap --------------------------------

test('listQuerySchema applies page=1/limit=20 defaults on empty query', () => {
    // Arrange / Act
    const parsed = listQuerySchema.parse({});

    // Assert — must mirror the previous hard-coded defaults exactly.
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 20);
});

test('listQuerySchema coerces numeric string query params', () => {
    const parsed = listQuerySchema.parse({ page: '3', limit: '50' });
    assert.equal(parsed.page, 3);
    assert.equal(parsed.limit, 50);
});

test('listQuerySchema rejects a limit above the page-size cap', () => {
    assert.throws(
        () => listQuerySchema.parse({ limit: String(MAX_PAGE_SIZE + 1) }),
        (err) => err && err.name === 'ZodError',
    );
});

test('listQuerySchema accepts the maximum allowed page size', () => {
    const parsed = listQuerySchema.parse({ limit: String(MAX_PAGE_SIZE) });
    assert.equal(parsed.limit, MAX_PAGE_SIZE);
});

test('listQuerySchema passes optional filters through untouched', () => {
    const parsed = listQuerySchema.parse({ hsCode: '0901', status: 'active', q: 'coffee' });
    assert.equal(parsed.hsCode, '0901');
    assert.equal(parsed.status, 'active');
    assert.equal(parsed.q, 'coffee');
});

test('listQuerySchema rejects a non-positive page', () => {
    assert.throws(
        () => listQuerySchema.parse({ page: '0' }),
        (err) => err && err.name === 'ZodError',
    );
});

// --- createSchema: required fields + permissive defaults ------------------------

test('createSchema accepts a minimal valid product and applies defaults', () => {
    const parsed = createSchema.parse({ sku: 'SKU-1', name: 'Widget', hs_code: '0901' });
    assert.equal(parsed.sku, 'SKU-1');
    assert.equal(parsed.uom, 'EA');
    assert.equal(parsed.hazmat, false);
    assert.deepEqual(parsed.attributes, {});
});

test('createSchema rejects a missing required sku', () => {
    assert.throws(
        () => createSchema.parse({ name: 'Widget', hs_code: '0901' }),
        (err) => err && err.name === 'ZodError',
    );
});

test('createSchema rejects an hs_code shorter than 4 characters', () => {
    assert.throws(
        () => createSchema.parse({ sku: 'SKU-1', name: 'Widget', hs_code: '09' }),
        (err) => err && err.name === 'ZodError',
    );
});

test('createSchema rejects a non 2-letter origin_country', () => {
    assert.throws(
        () => createSchema.parse({ sku: 'SKU-1', name: 'Widget', hs_code: '0901', origin_country: 'USA' }),
        (err) => err && err.name === 'ZodError',
    );
});

// --- prefixes: pure HS-code prefix expansion -----------------------------------

test('prefixes expands an HS code into 2/4/6/8-digit prefixes', () => {
    assert.deepEqual(prefixes('09011100'), ['09', '0901', '090111', '09011100']);
});

test('prefixes returns an empty array for an empty string', () => {
    assert.deepEqual(prefixes(''), []);
});

test('prefixes handles a 4-digit HS heading', () => {
    assert.deepEqual(prefixes('0901'), ['09', '0901']);
});

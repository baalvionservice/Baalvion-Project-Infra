'use strict';
/**
 * Pure validation tests — no DB, no network. Run with: node --test
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { z } = require('zod');
const { listQuerySchema, signSchema, createSchema, MAX_PAGE_SIZE, DOC_TYPES } = require('./documentSchemas');

test('listQuerySchema applies default page/limit when query is empty', () => {
    const out = listQuerySchema.parse({});
    assert.equal(out.page, 1);
    assert.equal(out.limit, 20);
});

test('listQuerySchema coerces string page/limit from req.query', () => {
    const out = listQuerySchema.parse({ page: '3', limit: '50' });
    assert.equal(out.page, 3);
    assert.equal(out.limit, 50);
});

test('listQuerySchema caps limit above the max page size', () => {
    assert.throws(() => listQuerySchema.parse({ limit: String(MAX_PAGE_SIZE + 1) }), z.ZodError);
    // boundary value is accepted
    assert.equal(listQuerySchema.parse({ limit: String(MAX_PAGE_SIZE) }).limit, MAX_PAGE_SIZE);
});

test('listQuerySchema rejects page below 1', () => {
    assert.throws(() => listQuerySchema.parse({ page: '0' }), z.ZodError);
});

test('listQuerySchema passes through optional filters unchanged', () => {
    const out = listQuerySchema.parse({ orderId: 'o-1', docType: 'commercial_invoice', status: 'issued' });
    assert.equal(out.orderId, 'o-1');
    assert.equal(out.docType, 'commercial_invoice');
    assert.equal(out.status, 'issued');
});

test('signSchema requires a non-empty signature', () => {
    assert.throws(() => signSchema.parse({}), z.ZodError);
    assert.throws(() => signSchema.parse({ signature: '' }), z.ZodError);
});

test('signSchema accepts a present signature and ignores extra keys', () => {
    const out = signSchema.parse({ signature: 'abc', extra: 'kept' });
    assert.equal(out.signature, 'abc');
});

test('createSchema requires a known doc_type and defaults payload', () => {
    const out = createSchema.parse({ doc_type: 'packing_list' });
    assert.deepEqual(out.payload, {});
    assert.throws(() => createSchema.parse({ doc_type: 'not_a_doc' }), z.ZodError);
});

test('DOC_TYPES enumerates the supported document types', () => {
    assert.ok(DOC_TYPES.includes('bill_of_lading'));
    assert.equal(DOC_TYPES.length, 6);
});

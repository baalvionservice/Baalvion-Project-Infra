'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { z } = require('zod');
const { validate } = require('../middleware/validate');

const makeReq = (over = {}) => ({ body: {}, query: {}, params: {}, ...over });

test('validate: attaches parsed/coerced data to req.valid on success', () => {
    const req = makeReq({ body: { name: 'Acme', count: '5' } });
    const schema = { body: z.object({ name: z.string(), count: z.coerce.number() }) };
    let nextErr = 'untouched';
    validate(schema)(req, {}, (err) => { nextErr = err; });
    assert.equal(nextErr, undefined); // next() called with no error
    assert.deepEqual(req.valid.body, { name: 'Acme', count: 5 });
});

test('validate: calls next with a 400 AppError on a schema violation', () => {
    const req = makeReq({ body: { name: 123 } });
    const schema = { body: z.object({ name: z.string() }) };
    let captured = null;
    validate(schema)(req, {}, (err) => { captured = err; });
    assert.ok(captured);
    assert.equal(captured.code, 'VALIDATION_ERROR');
    assert.equal(captured.statusCode, 400);
});

test('validate: only validates the parts that have schemas', () => {
    const req = makeReq({ query: { page: '2' }, body: { anything: true } });
    const schema = { query: z.object({ page: z.coerce.number() }) };
    let nextErr = 'untouched';
    validate(schema)(req, {}, (err) => { nextErr = err; });
    assert.equal(nextErr, undefined);
    assert.deepEqual(req.valid.query, { page: 2 });
    assert.equal(req.valid.body, undefined); // body had no schema → not parsed
});

'use strict';
// Regression: the address schemas must ACCEPT explicit null on optional fields. The storefront's
// toAddressInput() maps a blank optional to `null` (`.trim() || null`), so a plain `.optional()`
// (which rejects null) 400'd every common save (no company/line2/state/zip/phone). Pure Zod — no DB.
const { test } = require('node:test');
const assert = require('node:assert');

const { createAddressSchema, updateAddressSchema } = require('../validators/customerSchemas');
const { createOrderSchema } = require('../validators/orderSchemas');

// The exact frontend full-null payload: only the 5 required fields, every optional explicitly null.
const FULL_NULL = {
    firstName: 'Jane', lastName: 'Doe', company: null, address1: '1 Main St',
    address2: null, city: 'New York', state: null, zip: null, countryCode: 'US', phone: null,
};

test('createAddressSchema accepts a body with null company/address2/state/zip/phone', () => {
    const result = createAddressSchema.safeParse(FULL_NULL);
    assert.equal(result.success, true, result.success ? '' : JSON.stringify(result.error.flatten()));
});

test('updateAddressSchema (partial) accepts null optionals', () => {
    const result = updateAddressSchema.safeParse({ company: null, state: null, zip: null, phone: null, address2: null });
    assert.equal(result.success, true, result.success ? '' : JSON.stringify(result.error.flatten()));
});

test('required address fields are still enforced (empty address1 rejected)', () => {
    assert.equal(createAddressSchema.safeParse({ ...FULL_NULL, address1: '' }).success, false);
    assert.equal(createAddressSchema.safeParse({ ...FULL_NULL, city: '' }).success, false);
    assert.equal(createAddressSchema.safeParse({ ...FULL_NULL, countryCode: 'USA' }).success, false); // ISO-2 only
});

test('orderSchemas address (checkout shape) also accepts the full-null optionals', () => {
    const order = createOrderSchema.safeParse({
        items: [{ productId: '11111111-1111-1111-1111-111111111111', quantity: 1 }],
        shippingAddress: FULL_NULL,
        billingAddress: FULL_NULL,
    });
    assert.equal(order.success, true, order.success ? '' : JSON.stringify(order.error.flatten()));
});

'use strict';
// Pure-Zod validation of the wishlist add-item schema. No DB.
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';
process.env.CART_SESSION_SECRET = process.env.CART_SESSION_SECRET || 'test';

const { test } = require('node:test');
const assert = require('node:assert');

const { addWishlistItemSchema } = require('../validators/wishlistSchemas');

const PRODUCT = '11111111-1111-1111-1111-111111111111';
const VARIANT = '22222222-2222-2222-2222-222222222222';

test('addWishlistItemSchema accepts a productId with no variant', () => {
    const r = addWishlistItemSchema.safeParse({ productId: PRODUCT });
    assert.equal(r.success, true, r.success ? '' : JSON.stringify(r.error.flatten()));
});

test('addWishlistItemSchema accepts a productId + variantId, and an explicit null variant', () => {
    assert.equal(addWishlistItemSchema.safeParse({ productId: PRODUCT, variantId: VARIANT }).success, true);
    assert.equal(addWishlistItemSchema.safeParse({ productId: PRODUCT, variantId: null }).success, true);
});

test('addWishlistItemSchema requires productId to be a UUID', () => {
    assert.equal(addWishlistItemSchema.safeParse({}).success, false);
    assert.equal(addWishlistItemSchema.safeParse({ productId: 'not-a-uuid' }).success, false);
});

test('addWishlistItemSchema rejects a non-UUID variantId', () => {
    assert.equal(addWishlistItemSchema.safeParse({ productId: PRODUCT, variantId: 'nope' }).success, false);
});

'use strict';

// Pure-logic unit tests for the affiliate-product Zod schemas + tracking-code generator.
// No live database, no network — matches the convention in test/glossarySchemas.test.js.
// Run: node --test

const test = require('node:test');
const assert = require('node:assert/strict');

const { createAffiliateProductSchema, updateAffiliateProductSchema } = require('../validators/schemas');
const { generateTrackingCode } = require('../utils/trackingCode');

test('createAffiliateProductSchema accepts a minimal valid product and applies defaults', () => {
    const result = createAffiliateProductSchema.safeParse({
        slug: 'best-online-broker',
        product_name: 'Elite Trading Account',
        merchant_name: 'Acme Brokerage',
        cta_url: 'https://acme.example.com/signup',
    });
    assert.equal(result.success, true);
    assert.equal(result.data.status, 'active');
});

test('createAffiliateProductSchema rejects missing required fields', () => {
    const result = createAffiliateProductSchema.safeParse({ slug: 'orphan' });
    assert.equal(result.success, false);
    const fields = result.error.flatten().fieldErrors;
    assert.ok(fields.product_name, 'product_name should be required');
    assert.ok(fields.merchant_name, 'merchant_name should be required');
    assert.ok(fields.cta_url, 'cta_url should be required');
});

test('createAffiliateProductSchema rejects an invalid slug pattern', () => {
    const result = createAffiliateProductSchema.safeParse({
        slug: 'Not A Slug!',
        product_name: 'x',
        merchant_name: 'y',
        cta_url: 'https://example.com',
    });
    assert.equal(result.success, false);
});

test('cta_url is restricted to http/https (blocks javascript: open-redirect/XSS)', () => {
    const ok = createAffiliateProductSchema.safeParse({
        slug: 'safe-link',
        product_name: 'x',
        merchant_name: 'y',
        cta_url: 'https://example.com/offer',
    });
    assert.equal(ok.success, true);

    const bad = createAffiliateProductSchema.safeParse({
        slug: 'bad-link',
        product_name: 'x',
        merchant_name: 'y',
        cta_url: 'javascript:alert(1)',
    });
    assert.equal(bad.success, false);
});

test('commission_rate is bounded to a 0-100 percentage', () => {
    const tooHigh = createAffiliateProductSchema.safeParse({
        slug: 'x', product_name: 'x', merchant_name: 'y', cta_url: 'https://example.com', commission_rate: 150,
    });
    assert.equal(tooHigh.success, false);

    const negative = createAffiliateProductSchema.safeParse({
        slug: 'x', product_name: 'x', merchant_name: 'y', cta_url: 'https://example.com', commission_rate: -1,
    });
    assert.equal(negative.success, false);

    const valid = createAffiliateProductSchema.safeParse({
        slug: 'x', product_name: 'x', merchant_name: 'y', cta_url: 'https://example.com', commission_rate: 12.5,
    });
    assert.equal(valid.success, true);
});

test('updateAffiliateProductSchema is a permissive partial of createAffiliateProductSchema', () => {
    assert.equal(updateAffiliateProductSchema.safeParse({}).success, true);
    assert.equal(updateAffiliateProductSchema.safeParse({ status: 'paused' }).success, true);
    // But field-level validation still applies.
    assert.equal(updateAffiliateProductSchema.safeParse({ status: 'not-a-status' }).success, false);
    assert.equal(updateAffiliateProductSchema.safeParse({ cta_url: 'javascript:alert(1)' }).success, false);
});

test('generateTrackingCode produces a short, URL-safe, non-empty code with no repeats across many calls', () => {
    const codes = new Set();
    for (let i = 0; i < 1000; i++) {
        const code = generateTrackingCode();
        assert.match(code, /^[A-Za-z0-9_-]+$/, 'tracking code must be URL-safe base64url');
        assert.ok(code.length >= 6 && code.length <= 16, 'tracking code should be short');
        codes.add(code);
    }
    assert.equal(codes.size, 1000, 'no collisions expected across 1000 samples');
});

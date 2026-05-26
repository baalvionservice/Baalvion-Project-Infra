'use strict';

// Billing accuracy unit tests — `npm test` (node --test). Pure pricing math,
// no DB/Redis. Ingestion/quota/Razorpay integration tests need live infra.

const { test } = require('node:test');
const assert = require('node:assert');

const pricing = require('../service/pricing');

const GB = pricing.BYTES_PER_GB;

test('no overage when under allowance', () => {
  const c = pricing.computeCharges({ totalBytes: 3 * GB, includedGb: 5, overagePerGb: 5, taxRate: 0 });
  assert.strictEqual(c.overageGb, 0);
  assert.strictEqual(c.subtotal, 0);
  assert.strictEqual(c.total, 0);
});

test('flat overage: 10GB used, 5GB allowance, $5/GB = $25 + 18% tax', () => {
  const c = pricing.computeCharges({ totalBytes: 10 * GB, includedGb: 5, overagePerGb: 5, taxRate: 0.18 });
  assert.strictEqual(c.overageGb, 5);
  assert.strictEqual(c.subtotal, 25);
  assert.strictEqual(c.tax, 4.5);
  assert.strictEqual(c.total, 29.5);
});

test('geo-weighted overage applies premium multipliers', () => {
  // 10GB over allowance, split 50/50 us(1.0) and cn(1.6) → rate = 5 * (0.5*1.0 + 0.5*1.6) = 6.5
  const c = pricing.computeCharges({
    totalBytes: 15 * GB, includedGb: 5, overagePerGb: 5, taxRate: 0,
    geoBytes: { us: 5 * GB, cn: 5 * GB },
  });
  assert.strictEqual(c.overageGb, 10);
  assert.strictEqual(c.subtotal, 65); // 10GB * 6.5
});

test('prepaid credits reduce the taxable subtotal', () => {
  const c = pricing.computeCharges({ totalBytes: 10 * GB, includedGb: 5, overagePerGb: 5, taxRate: 0.1, prepaidCredits: 10 });
  assert.strictEqual(c.subtotal, 25);
  assert.strictEqual(c.creditsApplied, 10);
  assert.strictEqual(c.tax, 1.5);  // (25-10)*0.1
  assert.strictEqual(c.total, 16.5);
});

test('credits cannot exceed subtotal (no negative invoice)', () => {
  const c = pricing.computeCharges({ totalBytes: 6 * GB, includedGb: 5, overagePerGb: 5, taxRate: 0, prepaidCredits: 1000 });
  assert.strictEqual(c.creditsApplied, 5); // overage was 1GB * $5
  assert.strictEqual(c.total, 0);
});

test('planPricing returns tier config with fallback', () => {
  assert.strictEqual(pricing.planPricing('enterprise').overagePerGb, 1.5);
  assert.strictEqual(pricing.planPricing('nonexistent').overagePerGb, pricing.planPricing('starter').overagePerGb);
});

test('bytesToGB conversion', () => {
  assert.strictEqual(pricing.bytesToGB(GB), 1);
  assert.strictEqual(pricing.bytesToGB(0), 0);
});

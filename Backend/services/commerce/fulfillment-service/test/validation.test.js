'use strict';

// Pure-logic tests — no live DB, no network. Covers the zod request schemas and
// the pagination helper. Run with: npm test  (node --test).
const test = require('node:test');
const assert = require('node:assert');

const {
    createShipmentSchema,
    updateShipmentSchema,
    addTrackingEventSchema,
    createZoneSchema,
    createRateSchema,
    createCourierSchema,
} = require('../validators/fulfillmentSchemas');
const { parsePagination, buildPaginated } = require('../utils/pagination');

const UUID = '11111111-1111-4111-8111-111111111111';

test('createShipmentSchema accepts a minimal valid shipment', () => {
    const result = createShipmentSchema.safeParse({
        orderId: UUID,
        shippingAddress: { line1: '1 Main St', city: 'Pune' },
    });
    assert.strictEqual(result.success, true);
    // Permissive defaults are applied.
    assert.deepStrictEqual(result.data.items, []);
    assert.deepStrictEqual(result.data.metadata, {});
});

test('createShipmentSchema rejects a non-uuid orderId', () => {
    const result = createShipmentSchema.safeParse({
        orderId: 'not-a-uuid',
        shippingAddress: {},
    });
    assert.strictEqual(result.success, false);
});

test('createShipmentSchema rejects a missing shippingAddress', () => {
    const result = createShipmentSchema.safeParse({ orderId: UUID });
    assert.strictEqual(result.success, false);
});

test('updateShipmentSchema accepts every allowed status', () => {
    const statuses = ['pending', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'];
    for (const status of statuses) {
        const result = updateShipmentSchema.safeParse({ status });
        assert.strictEqual(result.success, true, `status ${status} should be valid`);
    }
});

test('updateShipmentSchema rejects an unknown status', () => {
    const result = updateShipmentSchema.safeParse({ status: 'teleported' });
    assert.strictEqual(result.success, false);
});

test('addTrackingEventSchema requires a non-empty status', () => {
    assert.strictEqual(addTrackingEventSchema.safeParse({ status: 'in_transit' }).success, true);
    assert.strictEqual(addTrackingEventSchema.safeParse({ status: '' }).success, false);
    assert.strictEqual(addTrackingEventSchema.safeParse({}).success, false);
});

test('createZoneSchema enforces ISO-2 country codes', () => {
    assert.strictEqual(createZoneSchema.safeParse({ name: 'India', countries: ['IN'] }).success, true);
    assert.strictEqual(createZoneSchema.safeParse({ name: 'Bad', countries: ['IND'] }).success, false);
});

test('createRateSchema defaults type to flat and baseRate to 0', () => {
    const result = createRateSchema.safeParse({ name: 'Standard' });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.type, 'flat');
    assert.strictEqual(result.data.baseRate, 0);
});

test('createRateSchema rejects a negative baseRate', () => {
    const result = createRateSchema.safeParse({ name: 'Standard', baseRate: -5 });
    assert.strictEqual(result.success, false);
});

test('createCourierSchema requires name and code', () => {
    assert.strictEqual(createCourierSchema.safeParse({ name: 'DHL', code: 'dhl' }).success, true);
    assert.strictEqual(createCourierSchema.safeParse({ name: 'DHL' }).success, false);
});

test('parsePagination applies safe defaults', () => {
    const { page, limit, offset } = parsePagination({});
    assert.strictEqual(page, 1);
    assert.strictEqual(limit, 20);
    assert.strictEqual(offset, 0);
});

test('parsePagination caps limit at the maxLimit', () => {
    const { limit } = parsePagination({ limit: '5000' });
    assert.strictEqual(limit, 100);
});

test('parsePagination clamps a negative page up to 1 and applies the default limit', () => {
    // parseInt('0') is falsy, so the limit falls back to its default (20); a
    // negative page is clamped up to 1 by Math.max.
    const { page, limit, offset } = parsePagination({ page: '-5', limit: '0' });
    assert.strictEqual(page, 1);
    assert.strictEqual(limit, 20);
    assert.strictEqual(offset, 0);
});

test('parsePagination computes offset from page and limit', () => {
    const { offset } = parsePagination({ page: '3', limit: '10' });
    assert.strictEqual(offset, 20);
});

test('buildPaginated reports pagination metadata', () => {
    const payload = buildPaginated([{ id: 1 }], 42, { page: 2, limit: 10 });
    assert.strictEqual(payload.pagination.total, 42);
    assert.strictEqual(payload.pagination.totalPages, 5);
    assert.strictEqual(payload.pagination.hasNext, true);
    assert.strictEqual(payload.pagination.hasPrev, true);
});

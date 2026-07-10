'use strict';
/**
 * Warehouse Management System, Phase A — Zod validator verification.
 * Pure, no DB, no network. Same shape as tests/logistics-validators.verify.js.
 *
 *   node tests/wms-validators.verify.js
 */
const assert = require('assert');
const { createWarehouseZoneSchema, updateWarehouseZoneSchema } = require('../validators/warehouseZone.schema');
const { createWarehouseBinSchema } = require('../validators/warehouseBin.schema');
const { createGoodsReceiptNoteSchema, createGoodsReceiptLineSchema } = require('../validators/goodsReceiptNote.schema');
const { suggestPutawaySchema, assignBinSchema } = require('../validators/putawayTask.schema');

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
function section(title) { console.log(`\n${title}`); }

const UUID = '11111111-1111-1111-1111-111111111111';

section('warehouseZone.schema');
t('accepts a minimal valid zone', () => {
    const r = createWarehouseZoneSchema.safeParse({ warehouseId: UUID, name: 'Receiving Dock A' });
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.data.zoneType, 'storage');
    assert.strictEqual(r.data.status, 'active');
});
t('rejects missing warehouseId', () => {
    const r = createWarehouseZoneSchema.safeParse({ name: 'Zone' });
    assert.strictEqual(r.success, false);
});
t('rejects an unknown zoneType', () => {
    const r = createWarehouseZoneSchema.safeParse({ warehouseId: UUID, name: 'Zone', zoneType: 'garbage' });
    assert.strictEqual(r.success, false);
});
t('update schema does not require warehouseId', () => {
    const r = updateWarehouseZoneSchema.safeParse({ status: 'full' });
    assert.strictEqual(r.success, true);
});

section('warehouseBin.schema');
t('accepts a minimal valid bin', () => {
    const r = createWarehouseBinSchema.safeParse({ warehouseId: UUID, zoneId: UUID });
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.data.binType, 'bin');
});
t('rejects an unknown binType', () => {
    const r = createWarehouseBinSchema.safeParse({ warehouseId: UUID, zoneId: UUID, binType: 'container' });
    assert.strictEqual(r.success, false);
});
t('rejects an unknown abcClass', () => {
    const r = createWarehouseBinSchema.safeParse({ warehouseId: UUID, zoneId: UUID, abcClass: 'D' });
    assert.strictEqual(r.success, false);
});

section('goodsReceiptNote.schema');
t('accepts a minimal valid GRN', () => {
    const r = createGoodsReceiptNoteSchema.safeParse({ warehouseId: UUID });
    assert.strictEqual(r.success, true);
});
t('accepts a valid GRN line with defaults', () => {
    const r = createGoodsReceiptLineSchema.safeParse({ sku: 'SKU-1' });
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.data.condition, 'good');
    assert.strictEqual(r.data.unit, 'unit');
});
t('rejects an unknown line condition', () => {
    const r = createGoodsReceiptLineSchema.safeParse({ condition: 'destroyed' });
    assert.strictEqual(r.success, false);
});

section('putawayTask.schema');
t('accepts a minimal valid suggestion request', () => {
    const r = suggestPutawaySchema.safeParse({ warehouseId: UUID, quantity: 10 });
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.data.unit, 'unit');
});
t('rejects a non-positive quantity', () => {
    const r = suggestPutawaySchema.safeParse({ warehouseId: UUID, quantity: 0 });
    assert.strictEqual(r.success, false);
});
t('rejects an unknown strategy', () => {
    const r = suggestPutawaySchema.safeParse({ warehouseId: UUID, quantity: 1, strategy: 'random' });
    assert.strictEqual(r.success, false);
});
t('assignBinSchema requires binId', () => {
    const r = assignBinSchema.safeParse({});
    assert.strictEqual(r.success, false);
});
t('assignBinSchema accepts binId with an optional overrideReason', () => {
    const r = assignBinSchema.safeParse({ binId: UUID, overrideReason: 'closer to packing' });
    assert.strictEqual(r.success, true);
});

console.log(`\n${'='.repeat(50)}`);
console.log(`WMS validators — ${pass} passed, ${fail} failed`);
if (fail > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f.name}: ${f.message}`);
    process.exit(1);
}
process.exit(0);

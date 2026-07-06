'use strict';
/**
 * Logistics Core Foundation (Phase 1) — Zod validator verification.
 *
 * jest is broken repo-wide (see tests/hs-code.verify.js), so this runs pure
 * assertions with a tiny built-in runner. No DB, no network.
 *
 *   node tests/logistics-validators.verify.js
 */
const assert = require('assert');
const { createContainerSchema, updateContainerSchema } = require('../validators/container.schema');
const { createPackageSchema } = require('../validators/package.schema');
const { createAddressSchema } = require('../validators/address.schema');

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

section('container.schema');
t('accepts a minimal valid container', () => {
    const r = createContainerSchema.safeParse({ containerNumber: 'MSCU1234567' });
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.data.containerType, '20ft'); // default
    assert.strictEqual(r.data.status, 'empty'); // default
});
t('rejects missing containerNumber', () => {
    const r = createContainerSchema.safeParse({});
    assert.strictEqual(r.success, false);
});
t('rejects an unknown containerType', () => {
    const r = createContainerSchema.safeParse({ containerNumber: 'X1', containerType: 'garbage' });
    assert.strictEqual(r.success, false);
});
t('update schema allows a partial patch', () => {
    const r = updateContainerSchema.safeParse({ status: 'in_transit' });
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.data.status, 'in_transit');
});

section('package.schema');
t('requires a UUID shipmentId', () => {
    const r = createPackageSchema.safeParse({ shipmentId: 'not-a-uuid' });
    assert.strictEqual(r.success, false);
});
t('accepts a valid package with defaults', () => {
    const r = createPackageSchema.safeParse({ shipmentId: '11111111-1111-1111-1111-111111111111' });
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.data.packageType, 'box');
});
t('rejects negative weight', () => {
    const r = createPackageSchema.safeParse({ shipmentId: '11111111-1111-1111-1111-111111111111', weightKg: -5 });
    assert.strictEqual(r.success, false);
});

section('address.schema');
t('accepts a valid address', () => {
    const r = createAddressSchema.safeParse({ line1: '1 Dock Rd', city: 'Mumbai', countryCode: 'IN' });
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.data.addressType, 'pickup'); // default
});
t('rejects a non-alpha-2 countryCode', () => {
    const r = createAddressSchema.safeParse({ line1: '1 Dock Rd', city: 'Mumbai', countryCode: 'IND' });
    assert.strictEqual(r.success, false);
});
t('rejects out-of-range latitude', () => {
    const r = createAddressSchema.safeParse({ line1: 'x', city: 'y', countryCode: 'IN', latitude: 200 });
    assert.strictEqual(r.success, false);
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Logistics validators — ${pass} passed, ${fail} failed`);
if (fail > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f.name}: ${f.message}`);
    process.exit(1);
}
process.exit(0);

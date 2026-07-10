'use strict';
/**
 * Warehouse Management System, Phase A — new permission constants verification.
 * Pure, no DB — fake req/res/next objects only, same shape as
 * tests/logistics-permissions.verify.js.
 *
 *   node tests/wms-permissions.verify.js
 */
const assert = require('assert');
const { LOGISTICS_PERMISSIONS, requirePermission } = require('../middleware/permissions');

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

function fakeReq(auth) { return { auth }; }
function callWithNext(mw, req) {
    let captured;
    const next = (err) => { captured = err; };
    mw(req, {}, next);
    return captured;
}

t('WMS permission constants exist with the expected string shape', () => {
    assert.strictEqual(LOGISTICS_PERMISSIONS.WAREHOUSE_ZONE_MANAGE, 'logistics:warehouse:zone_manage');
    assert.strictEqual(LOGISTICS_PERMISSIONS.WAREHOUSE_RECEIVE, 'logistics:warehouse:receive');
    assert.strictEqual(LOGISTICS_PERMISSIONS.WAREHOUSE_PUTAWAY, 'logistics:warehouse:putaway');
});

t('rejects when WAREHOUSE_ZONE_MANAGE is absent', () => {
    const mw = requirePermission(LOGISTICS_PERMISSIONS.WAREHOUSE_ZONE_MANAGE);
    const err = callWithNext(mw, fakeReq({ role: 'client', roles: ['client'], permissions: [] }));
    assert.ok(err);
    assert.strictEqual(err.code, 'FORBIDDEN');
});

t('allows when WAREHOUSE_RECEIVE is granted', () => {
    const mw = requirePermission(LOGISTICS_PERMISSIONS.WAREHOUSE_RECEIVE);
    const err = callWithNext(mw, fakeReq({ role: 'client', roles: ['client'], permissions: [LOGISTICS_PERMISSIONS.WAREHOUSE_RECEIVE] }));
    assert.strictEqual(err, undefined);
});

t('allows WAREHOUSE_PUTAWAY via admin-tier role bypass', () => {
    const mw = requirePermission(LOGISTICS_PERMISSIONS.WAREHOUSE_PUTAWAY);
    const err = callWithNext(mw, fakeReq({ role: 'warehouse_manager', roles: ['warehouse_manager', 'admin'], permissions: [] }));
    assert.strictEqual(err, undefined);
});

console.log(`\n${'='.repeat(50)}`);
console.log(`WMS permissions — ${pass} passed, ${fail} failed`);
if (fail > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f.name}: ${f.message}`);
    process.exit(1);
}
process.exit(0);

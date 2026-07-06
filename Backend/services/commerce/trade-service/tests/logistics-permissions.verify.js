'use strict';
/**
 * Logistics Core Foundation (Phase 1) — middleware/permissions.js verification.
 * Pure, no DB — fake req/res/next objects only.
 *
 *   node tests/logistics-permissions.verify.js
 */
const assert = require('assert');
const { LOGISTICS_PERMISSIONS, requirePermission, isAdminBypass } = require('../middleware/permissions');

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
    return captured; // undefined => next() called with no error (allowed)
}

t('LOGISTICS_PERMISSIONS catalog is frozen and non-empty', () => {
    assert.ok(Object.isFrozen(LOGISTICS_PERMISSIONS));
    assert.ok(Object.keys(LOGISTICS_PERMISSIONS).length >= 15);
    assert.strictEqual(LOGISTICS_PERMISSIONS.CONTAINER_MANAGE, 'logistics:container:manage');
});

t('rejects an unauthenticated request', () => {
    const mw = requirePermission(LOGISTICS_PERMISSIONS.CONTAINER_MANAGE);
    const err = callWithNext(mw, fakeReq(null));
    assert.ok(err);
    assert.strictEqual(err.code, 'UNAUTHORIZED');
});

t('rejects when the required permission is absent', () => {
    const mw = requirePermission(LOGISTICS_PERMISSIONS.CONTAINER_MANAGE);
    const err = callWithNext(mw, fakeReq({ role: 'client', roles: ['client'], permissions: [] }));
    assert.ok(err);
    assert.strictEqual(err.code, 'FORBIDDEN');
    assert.strictEqual(err.statusCode, 403);
});

t('allows when the required permission is present', () => {
    const mw = requirePermission(LOGISTICS_PERMISSIONS.CONTAINER_MANAGE);
    const err = callWithNext(mw, fakeReq({ role: 'client', roles: ['client'], permissions: [LOGISTICS_PERMISSIONS.CONTAINER_MANAGE] }));
    assert.strictEqual(err, undefined);
});

t('allows via admin-tier role bypass even with no explicit permission', () => {
    const mw = requirePermission(LOGISTICS_PERMISSIONS.CONTAINER_MANAGE);
    const err = callWithNext(mw, fakeReq({ role: 'admin', roles: ['admin'], permissions: [] }));
    assert.strictEqual(err, undefined);
});

t('isAdminBypass checks both scalar role and roles[]', () => {
    assert.strictEqual(isAdminBypass({ auth: { role: 'owner' } }), true);
    assert.strictEqual(isAdminBypass({ auth: { role: 'client', roles: ['super_admin'] } }), true);
    assert.strictEqual(isAdminBypass({ auth: { role: 'client', roles: ['client'] } }), false);
});

t('requirePermission accepts ANY of multiple listed permissions', () => {
    const mw = requirePermission(LOGISTICS_PERMISSIONS.CONTAINER_MANAGE, LOGISTICS_PERMISSIONS.SHIPMENT_UPDATE);
    const err = callWithNext(mw, fakeReq({ role: 'client', roles: [], permissions: [LOGISTICS_PERMISSIONS.SHIPMENT_UPDATE] }));
    assert.strictEqual(err, undefined);
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Logistics permissions — ${pass} passed, ${fail} failed`);
if (fail > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f.name}: ${f.message}`);
    process.exit(1);
}
process.exit(0);

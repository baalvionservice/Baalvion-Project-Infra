'use strict';
// CI-ready regression suite for the shared commerce RBAC PEP. No infra required: the RBAC
// client and cache are stubbed. Covers the production invariants:
//   - cross-country isolation     (UAE admin cannot reach an India store)
//   - store-level isolation       (a store_admin/product_manager is bounded to their store)
//   - role privilege boundaries   (requireStoreRole thresholds)
//   - RBAC outage behaviour       (fail-closed by default; super_admin break-glass)
//   - audit emission              (cross_scope_attempt vs access_denied)
const { test } = require('node:test');
const assert = require('node:assert');

const { createScopeResolver, createPep, createAuditEmitter } = require('..');

// ── test doubles ────────────────────────────────────────────────────────────────
class TestError extends Error {
    constructor(code, message, statusCode = 400) { super(message); this.code = code; this.statusCode = statusCode; }
}
const memCache = () => {
    const m = new Map();
    return { get: async (k) => (m.has(k) ? m.get(k) : null), set: async (k, v) => void m.set(k, v), del: async (k) => void m.delete(k) };
};
const EFF = {
    super: { roles: ['super_admin'], maxLevel: 400, perScope: {} },
    aeAdmin: { roles: ['country_admin'], maxLevel: 300, perScope: { AE: { scopeType: 'country', level: 300, roles: ['country_admin'] } } },
    pmStore: { roles: ['product_manager'], maxLevel: 170, perScope: { 'store-ae-1': { scopeType: 'organization', level: 170, roles: ['product_manager'] } } },
    viewer: { roles: ['store_viewer'], maxLevel: 110, perScope: { 'store-ae-1': { scopeType: 'organization', level: 110, roles: ['store_viewer'] } } },
    multiCountry: { roles: ['country_admin'], maxLevel: 300, perScope: { AE: { scopeType: 'country', level: 300, roles: ['country_admin'] }, SG: { scopeType: 'country', level: 300, roles: ['country_admin'] } } },
    none: { roles: ['end_user'], maxLevel: 100, perScope: { 'store-ae-1': { scopeType: 'organization', level: 100, roles: ['end_user'] } } },
    storeGrant: { roles: ['store_admin'], maxLevel: 190, perScope: { 'store-nc': { scopeType: 'organization', level: 190, roles: ['store_admin'] } } },
};
const STORES = {
    'store-ae-1': { id: 'store-ae-1', countryCode: 'AE' },
    'store-in-1': { id: 'store-in-1', countryCode: 'IN' },
    'store-nc': { id: 'store-nc', countryCode: null }, // misconfigured: no resolvable country
};

function harness({ effFor, outage = false } = {}) {
    const captured = [];
    const audit = createAuditEmitter({ service: 'test', logger: { warn: (s) => captured.push(JSON.parse(s)) } });
    const rbacClient = {
        getUserEffective: async (userId) => {
            if (outage) throw new TestError('RBAC_UNAVAILABLE', 'down', 503);
            return effFor(userId);
        },
    };
    const scope = createScopeResolver({ rbacClient, cache: memCache(), config: { failMode: 'closed', breakglassSuperAdmin: true, effectiveTtl: 30 }, audit });
    const resolveStoreScope = async (storeId) => STORES[storeId] || null;
    const pep = createPep({ scope, resolveStoreScope, config: { failMode: 'closed' }, AppError: TestError, audit });
    return { scope, pep, captured };
}
const mkReq = (storeId, { roles = [] } = {}) => ({
    auth: { userId: '42', roles }, params: { storeId },
    get: (h) => (h && h.toLowerCase() === 'authorization' ? 'Bearer t' : undefined),
    method: 'GET', originalUrl: `/x/${storeId}`,
});
const run = (mw, req) => new Promise((resolve) => mw(req, {}, (err) => resolve(err)));

// ── cross-country isolation ───────────────────────────────────────────────────
test('UAE country_admin is granted full capability on a UAE store', async () => {
    const { scope } = harness({ effFor: () => EFF.aeAdmin });
    const cap = await scope.resolveStoreCapability({ userId: '42', token: 't', store: STORES['store-ae-1'], jwtRoles: [] });
    assert.equal(cap.level, 100);
    assert.equal(cap.viaScope, 'AE');
});
test('UAE country_admin is DENIED on an India store (cross-country isolation)', async () => {
    const { scope } = harness({ effFor: () => EFF.aeAdmin });
    const cap = await scope.resolveStoreCapability({ userId: '42', token: 't', store: STORES['store-in-1'], jwtRoles: [] });
    assert.equal(cap.level, 0);
});
test('loadStoreRole on a foreign-country store → 403 + cross_scope_attempt audit', async () => {
    const { pep, captured } = harness({ effFor: () => EFF.aeAdmin });
    const err = await run(pep.loadStoreRole, mkReq('store-in-1'));
    assert.equal(err.statusCode, 403);
    const evt = captured.find((e) => e.type === 'commerce.cross_scope_attempt');
    assert.ok(evt, 'cross_scope_attempt audited');
    assert.equal(evt.decision, 'deny');
    assert.equal(evt.scope.id, 'store-in-1');
});

// ── store-level isolation ─────────────────────────────────────────────────────
test('product_manager is bounded to their own store', async () => {
    const { scope } = harness({ effFor: () => EFF.pmStore });
    assert.equal((await scope.resolveStoreCapability({ userId: '42', token: 't', store: STORES['store-ae-1'], jwtRoles: [] })).level, 80);
    assert.equal((await scope.resolveStoreCapability({ userId: '42', token: 't', store: STORES['store-in-1'], jwtRoles: [] })).level, 0);
});

// ── role privilege boundaries ─────────────────────────────────────────────────
test('store_viewer cannot perform a content_editor-level action; product_manager can', async () => {
    const viewer = harness({ effFor: () => EFF.viewer });
    let req = mkReq('store-ae-1');
    await run(viewer.pep.loadStoreRole, req);            // stamps storeLevel = 20
    let err = await run(viewer.pep.requireStoreRole('content_editor'), req); // needs 40
    assert.equal(err.statusCode, 403);
    assert.ok(viewer.captured.find((e) => e.type === 'commerce.access_denied'), 'access_denied audited');

    const pm = harness({ effFor: () => EFF.pmStore });
    req = mkReq('store-ae-1');
    await run(pm.pep.loadStoreRole, req);                // storeLevel = 80
    err = await run(pm.pep.requireStoreRole('content_editor'), req);
    assert.equal(err, undefined, 'product_manager passes content_editor threshold');
    err = await run(pm.pep.requireStoreRole('commerce_manager'), req); // 80 >= 80
    assert.equal(err, undefined, 'product_manager passes commerce_manager threshold');
});

// ── access scope (cross-store lists) ──────────────────────────────────────────
test('resolveAccessScope: super=unrestricted, country=only-its-country, store=only-its-store', async () => {
    assert.equal((await harness({ effFor: () => EFF.super }).scope.resolveAccessScope({ userId: '42', token: 't' })).unrestricted, true);
    const ae = await harness({ effFor: () => EFF.aeAdmin }).scope.resolveAccessScope({ userId: '42', token: 't' });
    assert.deepEqual(ae.allowedCountries, ['AE']);
    assert.ok(!ae.allowedCountries.includes('IN'));
    const pm = await harness({ effFor: () => EFF.pmStore }).scope.resolveAccessScope({ userId: '42', token: 't' });
    assert.deepEqual(pm.allowedStoreIds, ['store-ae-1']);
    const multi = await harness({ effFor: () => EFF.multiCountry }).scope.resolveAccessScope({ userId: '42', token: 't' });
    assert.deepEqual(multi.allowedCountries.sort(), ['AE', 'SG']);
});

// ── RBAC outage ───────────────────────────────────────────────────────────────
test('RBAC outage, non-super → fail-closed (loadStoreRole 503)', async () => {
    const { pep } = harness({ effFor: () => EFF.aeAdmin, outage: true });
    const err = await run(pep.loadStoreRole, mkReq('store-ae-1', { roles: ['country_admin'] }));
    assert.equal(err.statusCode, 503);
});
test('RBAC outage, super_admin JWT → break-glass allow + breakglass audit', async () => {
    const { pep, captured } = harness({ effFor: () => EFF.super, outage: true });
    const req = mkReq('store-ae-1', { roles: ['super_admin'] });
    const err = await run(pep.loadStoreRole, req);
    assert.equal(err, undefined);
    assert.equal(req.storeLevel, 100);
    assert.ok(captured.find((e) => e.type === 'commerce.rbac_breakglass'), 'breakglass audited');
});
test('RBAC outage, loadAccessScope fail-closed → 403', async () => {
    const { pep } = harness({ effFor: () => EFF.aeAdmin, outage: true });
    const req = mkReq('store-ae-1', { roles: ['country_admin'] });
    const err = await run(pep.loadAccessScope, req);
    assert.equal(err.statusCode, 403);
});

// ── no auth ───────────────────────────────────────────────────────────────────
test('loadStoreRole without req.auth → 401', async () => {
    const { pep } = harness({ effFor: () => EFF.super });
    const err = await run(pep.loadStoreRole, { params: { storeId: 'store-ae-1' }, get: () => undefined, method: 'GET' });
    assert.equal(err.statusCode, 401);
});

// ── misconfigured store (null countryCode) stays SAFE ───────────────────────────
// A store whose country can't be resolved must NOT become broadly accessible: only '*'
// (platform) and storeId scopes can match — never a country grant.
test('null-country store: super_admin allowed, store-level grant allowed, country_admin denied', async () => {
    const sup = harness({ effFor: () => EFF.super });
    assert.equal((await run(sup.pep.loadStoreRole, mkReq('store-nc'))), undefined); // platform super → allowed

    const sg = harness({ effFor: () => EFF.storeGrant });
    const sgReq = mkReq('store-nc');
    assert.equal(await run(sg.pep.loadStoreRole, sgReq), undefined); // store-level grant → allowed
    assert.equal(sgReq.storeLevel, 100);

    const ca = harness({ effFor: () => EFF.aeAdmin });
    const err = await run(ca.pep.loadStoreRole, mkReq('store-nc')); // AE country grant cannot match → denied
    assert.equal(err.statusCode, 403);
});

// ── audit field contract ────────────────────────────────────────────────────────
test('audit events carry the required fields (timestamp, role, scope, action, decision)', async () => {
    const cs = harness({ effFor: () => EFF.aeAdmin });
    await run(cs.pep.loadStoreRole, mkReq('store-in-1'));
    const denied = cs.captured.find((e) => e.type === 'commerce.cross_scope_attempt');
    assert.ok(denied.timestamp && denied.decision === 'deny' && denied.scope && denied.action, 'cross_scope_attempt fields');

    const bg = harness({ effFor: () => EFF.super, outage: true });
    await run(bg.pep.loadStoreRole, mkReq('store-ae-1', { roles: ['super_admin'] }));
    const evt = bg.captured.find((e) => e.type === 'commerce.rbac_breakglass');
    assert.equal(evt.role, 'super_admin');
    assert.ok(evt.timestamp, 'breakglass has timestamp');
});

'use strict';
// Route-layer auth for the reservation `confirm` guard (requireInternalKey). Pure unit test: no
// Express server, no DB — we exercise the middleware directly with fake req/res/next, toggling the
// configured internal key via require.cache so both the configured and dev-fallback branches run.
//
// What this asserts is the SECURITY MODEL: confirm is internal-only. An anonymous browser/shopper
// can NEVER confirm (commit stock without payment); a matching internal key (order-service) passes;
// a wrong key is 401; a platform/ops staff token is the documented fallback; with no key configured
// the ops RBAC chain must run (never anonymous-open).
const path = require('path');
const { test, beforeEach } = require('node:test');
const assert = require('node:assert');

const CONFIG_PATH = require.resolve(path.join(__dirname, '..', 'config', 'appConfig'));
const MW_PATH = require.resolve(path.join(__dirname, '..', 'middleware', 'internalAuth'));

// Load internalAuth with a stubbed config (avoids appConfig's requireEnv('JWT_PUBLIC_KEY') at import).
function loadGuard({ internalKey = '' } = {}) {
    require.cache[CONFIG_PATH] = {
        id: CONFIG_PATH, filename: CONFIG_PATH, loaded: true,
        exports: { internal: { key: internalKey } },
    };
    delete require.cache[MW_PATH];
    return require('../middleware/internalAuth');
}

function fakeReq({ headers = {}, auth = null } = {}) {
    const lower = {};
    for (const [k, v] of Object.entries(headers)) lower[k.toLowerCase()] = v;
    return { get: (h) => lower[String(h).toLowerCase()], auth };
}

// Capture next(err): undefined arg = pass; AppError = rejected with its statusCode.
function runGuard(guard, req) {
    return new Promise((resolve) => {
        guard(req, {}, (err) => resolve(err ? { ok: false, status: err.statusCode, code: err.code } : { ok: true }));
    });
}

const KEY = 'super-secret-internal-key';

beforeEach(() => {
    // Reset module cache between tests so each loadGuard sees fresh config.
    delete require.cache[MW_PATH];
});

test('configured key + matching X-Internal-Key → passes (order-service path)', async () => {
    const { requireInternalKey } = loadGuard({ internalKey: KEY });
    const out = await runGuard(requireInternalKey([]), fakeReq({ headers: { 'X-Internal-Key': KEY } }));
    assert.deepEqual(out, { ok: true });
});

test('configured key + WRONG X-Internal-Key → 401 (no silent RBAC downgrade)', async () => {
    const { requireInternalKey } = loadGuard({ internalKey: KEY });
    const out = await runGuard(requireInternalKey([]), fakeReq({ headers: { 'X-Internal-Key': 'nope' } }));
    assert.equal(out.ok, false);
    assert.equal(out.status, 401);
});

test('configured key + anonymous (no header, no token) → 401 (shopper can NEVER confirm)', async () => {
    const { requireInternalKey } = loadGuard({ internalKey: KEY });
    const out = await runGuard(requireInternalKey([]), fakeReq());
    assert.equal(out.ok, false);
    assert.equal(out.status, 401);
});

test('configured key + platform/ops staff token (no header) → passes (staff fallback)', async () => {
    const { requireInternalKey } = loadGuard({ internalKey: KEY });
    const out = await runGuard(requireInternalKey([]), fakeReq({ auth: { userId: 'u1', roles: ['ops_manager'] } }));
    assert.deepEqual(out, { ok: true });
});

test('configured key + ordinary shopper token (no staff role) → 401', async () => {
    const { requireInternalKey } = loadGuard({ internalKey: KEY });
    const out = await runGuard(requireInternalKey([]), fakeReq({ auth: { userId: 'u1', roles: ['store_viewer'] } }));
    assert.equal(out.ok, false);
    assert.equal(out.status, 401);
});

test('NO key configured (dev) → the ops RBAC chain runs (never anonymous-open)', async () => {
    const { requireInternalKey } = loadGuard({ internalKey: '' });
    let ran = 0;
    // Simulate the [authMiddleware, loadStoreRole, requireStoreRole('ops_manager')] chain: each
    // middleware calls next() to proceed; the final next() reaching the guard's caller = authorized.
    const chain = [
        (req, res, next) => { ran += 1; next(); },
        (req, res, next) => { ran += 1; next(); },
        (req, res, next) => { ran += 1; next(); },
    ];
    const out = await runGuard(requireInternalKey(chain), fakeReq());
    assert.deepEqual(out, { ok: true });
    assert.equal(ran, 3, 'all three RBAC middlewares ran');
});

test('NO key configured (dev) → an RBAC chain rejection (403) propagates', async () => {
    const { requireInternalKey } = loadGuard({ internalKey: '' });
    const { AppError } = require('../utils/errors');
    const chain = [
        (req, res, next) => next(), // authn ok
        (req, res, next) => next(), // scope ok
        (req, res, next) => next(new AppError('FORBIDDEN', 'ops_manager required', 403)), // authz denies
    ];
    const out = await runGuard(requireInternalKey(chain), fakeReq({ auth: { userId: 'u1', roles: ['store_viewer'] } }));
    assert.equal(out.ok, false);
    assert.equal(out.status, 403);
});

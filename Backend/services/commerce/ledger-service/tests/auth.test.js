'use strict';
// Ledger auth hardening — proves the previously-bypassed middleware now actually verifies
// RS256 signatures and honours the internal service key. Generates a throwaway keypair,
// signs tokens by hand, and asserts forged / none-alg / HS256 / expired tokens are rejected.
const { test } = require('node:test');
const assert = require('node:assert');
const { generateKeyPairSync, createSign } = require('crypto');

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Configure BEFORE requiring the middleware (it reads env at module load).
process.env.JWT_PUBLIC_KEY = publicKey;
process.env.LEDGER_INTERNAL_KEY = 'super-secret-internal-key';
const { verify } = require('../middleware/verifyJwt');
const authMiddleware = require('../middleware/authMiddleware');

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
function signRs256(payload) {
    const data = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url(payload)}`;
    const sig = createSign('RSA-SHA256').update(data).end().sign(privateKey).toString('base64url');
    return `${data}.${sig}`;
}
const now = Math.floor(Date.now() / 1000);

// ── verifyJwt ───────────────────────────────────────────────────────────────────
test('accepts a valid RS256 token and returns its claims', () => {
    const claims = verify(signRs256({ sub: 'user-1', roles: ['admin'], exp: now + 3600 }));
    assert.equal(claims.sub, 'user-1');
    assert.deepEqual(claims.roles, ['admin']);
});

test('rejects an expired token', () => {
    assert.throws(() => verify(signRs256({ sub: 'u', exp: now - 10 })), /expired/i);
});

test('rejects a tampered payload (signature mismatch)', () => {
    const tok = signRs256({ sub: 'u', exp: now + 3600 });
    const [h, , s] = tok.split('.');
    const forged = `${h}.${b64url({ sub: 'admin', exp: now + 3600 })}.${s}`;
    assert.throws(() => verify(forged), /signature/i);
});

test("rejects the 'none' algorithm and HS256 tokens (no symmetric / alg-confusion bypass)", () => {
    const none = `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ sub: 'admin' })}.`;
    assert.throws(() => verify(none), /algorithm/i);
    const hs = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: 'admin' })}.c2ln`;
    assert.throws(() => verify(hs), /algorithm/i);
});

test('rejects a garbage / malformed token', () => {
    assert.throws(() => verify('not-a-jwt'), /malformed/i);
});

// ── authMiddleware ────────────────────────────────────────────────────────────────
function run(headers) {
    return new Promise((resolve) => {
        const req = { headers };
        const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(b) { resolve({ status: this.statusCode, body: b, nexted: false }); } };
        authMiddleware(req, res, () => resolve({ status: 200, req, nexted: true }));
    });
}

test('internal service key authenticates a service caller', async () => {
    const out = await run({ 'x-internal-key': 'super-secret-internal-key', 'x-service-name': 'order-service', 'x-tenant-id': 't1' });
    assert.equal(out.nexted, true);
    assert.equal(out.req.user.isService, true);
    assert.equal(out.req.user.tenantId, 't1');
});

test('a wrong internal key with no bearer is rejected 401', async () => {
    const out = await run({ 'x-internal-key': 'wrong-key' });
    assert.equal(out.nexted, false);
    assert.equal(out.status, 401);
});

test('a valid bearer token passes the middleware', async () => {
    const out = await run({ authorization: `Bearer ${signRs256({ sub: 'admin', roles: ['country_admin'], exp: now + 3600 })}` });
    assert.equal(out.nexted, true);
    assert.equal(out.req.user.sub, 'admin');
});

test('no credentials at all is rejected 401', async () => {
    const out = await run({});
    assert.equal(out.nexted, false);
    assert.equal(out.status, 401);
});

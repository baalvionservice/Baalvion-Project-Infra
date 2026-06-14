'use strict';
/* Smoke test for @baalvion/auth-node. Run: node test.smoke.js (exit 0 = pass). */
const assert = require('assert');
const crypto = require('crypto');
const http = require('http');
const jwt = require('jsonwebtoken');
const { createAuthServer, createJwksVerifier } = require('./index.js');

let pass = 0;
const ok = (m) => { console.log('  ✓', m); pass++; };
// R2: raw HS256 issuance is retired in the library; tests mint HS256 directly to
// prove the verifiers REJECT it.
const hs256 = (payload, secret = 'shared-secret') => jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '1h' });

// 1. R2: an issuer WITHOUT an RS256 private key can no longer mint HS256 access
//    tokens, but refresh tokens (HS256 by design) still round-trip.
{
  const a = createAuthServer({ accessSecret: 's3cr3t', refreshSecret: 'r3fr3sh', claimStyle: 'id', env: 'test' });
  assert.throws(
    () => a.generateAccessToken({ id: 7, email: 'x@b.io', orgId: 'o1', role: 'admin' }),
    /RS256 private key required/,
    'R2: HS256 access-token issuance must be rejected',
  );
  const rt = a.generateRefreshToken({ id: 7, orgId: 'o1', sessionId: 'sess' });
  assert.strictEqual(a.verifyRefreshToken(rt).id, 7);
  ok('R2: HS256 access issuance disabled; refresh HS256 still round-trips');
}

// 2. R2: verifyAccessToken rejects an HS256 token; signAccessToken is retired.
{
  const a = createAuthServer({ accessSecret: 'k', env: 'test' });
  assert.throws(
    () => a.signAccessToken({ id: 1, scope: 'read' }, '1h'),
    /permanently retired/,
    'R2: raw HS256 signAccessToken must be retired',
  );
  const t = hs256({ id: 1, scope: 'read' }, 'k'); // HS256 raw token, minted directly
  assert.throws(
    () => a.verifyAccessToken(t),
    /only RS256 access tokens/,
    'R2: HS256 access-token verification must be rejected',
  );
  ok('R2: signAccessToken retired + verifyAccessToken rejects HS256 access tokens');
}

// 3. modern RS256 + JWKS issuer/verifier (proxy style: claimStyle 'sub', normalize)
{
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const priv = privateKey.export({ type: 'pkcs1', format: 'pem' });
  const pub = publicKey.export({ type: 'spki', format: 'pem' });
  process.env.JWT_PRIVATE_KEY = priv;
  process.env.JWT_PUBLIC_KEY = pub;
  const a = createAuthServer({ accessSecret: 'unused', claimStyle: 'sub', normalizeClaims: true, env: 'production', activeKid: 'baalvion-key-1' });
  assert.strictEqual(a.isRs256Enabled(), true);
  const t = a.generateAccessToken({ userId: 42, email: 'r@b.io', organizationId: 'org', role: 'r' });
  const dec = a.verifyAccessToken(t);
  assert.strictEqual(dec.sub, '42');
  assert.strictEqual(dec.userId, '42');            // normalized
  assert.strictEqual(dec.organizationId, 'org');
  const jwks = a.getJwks();
  assert.ok(jwks.keys.length >= 1 && jwks.keys[0].kid === 'baalvion-key-1');
  delete process.env.JWT_PRIVATE_KEY; delete process.env.JWT_PUBLIC_KEY;
  ok('RS256/JWKS issuer round-trips + publishes JWKS');
}

// 4. R2: no cross-scheme HS256 migration fallback — a legacy HS256 token is rejected.
{
  const legacy = hs256({ id: 99 }, 'shared'); // legacy HS256 access token, minted directly
  const verifier = createAuthServer({ accessSecret: 'shared', env: 'development' }); // no keys
  assert.throws(
    () => verifier.verifyAccessToken(legacy),
    /only RS256 access tokens/,
    'R2: HS256 migration fallback must be closed',
  );
  ok('R2: HS256 access tokens are not accepted (island closed)');
}

// 5. static-public-key verify-only mode (session/admin/notification verifier style)
{
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const priv = privateKey.export({ type: 'pkcs1', format: 'pem' });
  const pub = publicKey.export({ type: 'spki', format: 'pem' });

  // issuer signs RS256 with an arbitrary kid
  process.env.JWT_PRIVATE_KEY = priv; process.env.JWT_PUBLIC_KEY = pub;
  const issuer = createAuthServer({ claimStyle: 'sub', activeKid: 'k99', env: 'production' });
  const tok = issuer.generateAccessToken({ userId: 5, email: 'v@b.io', role: 'r' });
  delete process.env.JWT_PRIVATE_KEY; delete process.env.JWT_PUBLIC_KEY;

  // verifier holds ONLY the public PEM (no private key), RS256-only, default kid differs
  const verifier = createAuthServer({ publicKey: pub, allowHs256Fallback: false, env: 'production' });
  assert.strictEqual(verifier.isRs256Enabled(), false, 'verify-only must not report issue capability');
  const dec = verifier.verifyAccessToken(tok);
  assert.strictEqual(dec.sub, '5', 'static-key RS256 verify failed (kid-agnostic fallback)');

  // and it must REJECT an HS256 token (no fallback) — matches original algorithms:['RS256']
  const hsTok = hs256({ id: 9 }, 'k');
  assert.throws(() => verifier.verifyAccessToken(hsTok), 'RS256-only verifier must reject HS256');
  ok('static-public-key verify-only mode (RS256-only, kid-agnostic, rejects HS256)');
}

(async () => {
  // 6. JWKS verifier — static RSA fallback + HS256 fallback
  {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const priv = privateKey.export({ type: 'pkcs1', format: 'pem' });
    const pub = publicKey.export({ type: 'spki', format: 'pem' });
    process.env.JWT_PRIVATE_KEY = priv; process.env.JWT_PUBLIC_KEY = pub;
    const issuer = createAuthServer({ claimStyle: 'sub', activeKid: 'jwks-key-1', env: 'production' });
    const tok = issuer.generateAccessToken({ userId: 3, role: 'r' });
    delete process.env.JWT_PRIVATE_KEY; delete process.env.JWT_PUBLIC_KEY;

    const v = createJwksVerifier({ staticPublicKey: pub, hs256Secret: 'h' }); // hs256Secret now inert
    assert.strictEqual((await v.verify(tok)).sub, '3');
    ok('JWKS verifier falls back to static RSA key when JWKS unavailable (RS256-only)');

    // R2: the HS256 shared-secret fallback is permanently removed — even when an
    // hs256Secret is (vestigially) passed, an HS256 token is REJECTED.
    const hsTok = hs256({ id: 8 }, 'h');
    await assert.rejects(
      () => createJwksVerifier({ hs256Secret: 'h' }).verify(hsTok),
      /not allowed \(RS256 only\)/,
      'R2: createJwksVerifier must reject HS256 even with hs256Secret set',
    );
    ok('R2: JWKS verifier rejects HS256 (shared-secret fallback removed)');
  }

  // 7. JWKS verifier — live fetch from a real endpoint
  {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const priv = privateKey.export({ type: 'pkcs1', format: 'pem' });
    const pub = publicKey.export({ type: 'spki', format: 'pem' });
    const jwk = { ...crypto.createPublicKey(pub).export({ format: 'jwk' }), kid: 'jwks-key-1', use: 'sig', alg: 'RS256' };
    const server = http.createServer((_req, res) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ keys: [jwk] })); });
    await new Promise((r) => server.listen(0, r));
    const port = server.address().port;

    process.env.JWT_PRIVATE_KEY = priv; process.env.JWT_PUBLIC_KEY = pub;
    const issuer = createAuthServer({ claimStyle: 'sub', activeKid: 'jwks-key-1', env: 'production' });
    const tok = issuer.generateAccessToken({ userId: 11, role: 'r' });
    delete process.env.JWT_PRIVATE_KEY; delete process.env.JWT_PUBLIC_KEY;

    const dec = await createJwksVerifier({ jwksUri: `http://127.0.0.1:${port}/jwks` }).verify(tok);
    server.close();
    assert.strictEqual(dec.sub, '11');
    ok('JWKS verifier fetches live JWKS endpoint and verifies RS256');
  }

  console.log(`\nauth-node smoke: ${pass} checks passed`);
})().catch((e) => { console.error('  ✗', e.message); process.exit(1); });

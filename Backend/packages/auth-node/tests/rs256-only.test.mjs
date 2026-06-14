// R2 (GO/NO-GO) regression: access tokens are RS256-only.
// Locks the closure of the HS256 issuer islands so it can never silently regress.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import pkg from '../index.js';

const { createAuthServer } = pkg;

function rsaKeypair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  return {
    priv: privateKey.export({ type: 'pkcs1', format: 'pem' }),
    pub: publicKey.export({ type: 'spki', format: 'pem' }),
  };
}

test('valid RS256 access token verifies', () => {
  const { priv, pub } = rsaKeypair();
  process.env.JWT_PRIVATE_KEY = priv;
  process.env.JWT_PUBLIC_KEY = pub;
  try {
    const a = createAuthServer({ claimStyle: 'sub', activeKid: 'baalvion-key-1', env: 'production' });
    const tok = a.generateAccessToken({ userId: 42, role: 'admin' });
    const dec = a.verifyAccessToken(tok);
    assert.equal(dec.sub, '42');
  } finally {
    delete process.env.JWT_PRIVATE_KEY;
    delete process.env.JWT_PUBLIC_KEY;
  }
});

test('HS256 access token is rejected', () => {
  const { pub } = rsaKeypair();
  // Verifier holds only an RS256 public key.
  const verifier = createAuthServer({ publicKey: pub, env: 'production' });
  const hsTok = jwt.sign({ sub: '7', role: 'admin' }, 'shared-secret', { algorithm: 'HS256', expiresIn: '5m' });
  assert.throws(() => verifier.verifyAccessToken(hsTok), /only RS256 access tokens/);
});

test('alg:none access token is rejected', () => {
  const { pub } = rsaKeypair();
  const verifier = createAuthServer({ publicKey: pub, env: 'production' });
  // Craft an unsigned alg:none token.
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const noneTok = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: '7' })}.`;
  assert.throws(() => verifier.verifyAccessToken(noneTok), /only RS256 access tokens/);
});

test('HS256 access-token issuance is disabled (no RS256 private key)', () => {
  const a = createAuthServer({ accessSecret: 'k', env: 'test' });
  assert.throws(() => a.generateAccessToken({ userId: 1, role: 'r' }), /RS256 private key required/);
});

test('production verifier with no RS256 public key refuses to construct (fail-closed)', () => {
  assert.throws(
    () => createAuthServer({ accessSecret: 'k', env: 'production' }),
    /no RS256 public key configured/,
  );
});

test('refresh tokens remain HS256 (by design) and round-trip', () => {
  const a = createAuthServer({ refreshSecret: 'r3fr3sh', env: 'test' });
  const rt = a.generateRefreshToken({ id: 9, orgId: 'o1', sessionId: 's1' });
  assert.equal(a.verifyRefreshToken(rt).id, 9);
});

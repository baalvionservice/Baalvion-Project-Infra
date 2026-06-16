'use strict';
// End-to-end proof of the CTM auth boundary on Node's built-in runner (no jest/supertest):
//   • anonymous request            -> 401 (denied)
//   • forged bearer token          -> 401 (denied)
//   • valid RS256 session token    -> 200 (authenticated access works)
//   • the sensitive admin reads stay wired to authMiddleware (regression guard)
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');

// Generate our own RS256 keypair and pin the PUBLIC half as JWT_PUBLIC_KEY before appConfig loads,
// so the canonical verifier trusts tokens we sign with the matching PRIVATE half. (Overriding any
// inherited env is intentional — we must control both halves to mint a genuinely valid token.)
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
process.env.JWT_PUBLIC_KEY = publicKey.export({ type: 'spki', format: 'pem' });
const PRIVATE_PEM = privateKey.export({ type: 'pkcs8', format: 'pem' });

const { authMiddleware } = require('../middleware/authMiddleware');
const config = require('../config/appConfig');
const jwt = require('jsonwebtoken');

// A genuine, verifier-accepted access token: RS256-signed by our key, the full canonical claim set
// (sub/org_id/sid/jti + array roles/permissions) the One True Middleware enforces, correct
// issuer/audience, unexpired.
function signValidToken(claims) {
  return jwt.sign(
    Object.assign(
      { sub: 'user-1', org_id: 'org-1', sid: 'sess-1', jti: 'jti-1', roles: ['admin'], permissions: [] },
      claims || {},
    ),
    PRIVATE_PEM,
    { algorithm: 'RS256', issuer: config.jwt.issuer, audience: config.jwt.audience, expiresIn: '5m' },
  );
}

function buildApp() {
  const app = express();
  app.get('/protected', authMiddleware, (req, res) => res.json({ ok: true }));
  // Mirror the service's AppError -> HTTP mapping so the gate's 401 surfaces as a response.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ error: err.code || 'error' }));
  return app;
}

function get(app, headers) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      http
        .get({ host: '127.0.0.1', port, path: '/protected', headers: headers || {} }, (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => server.close(() => resolve({ status: res.statusCode, body })));
        })
        .on('error', (e) => server.close(() => reject(e)));
    });
  });
}

test('denies a request with NO Authorization header or session cookie', async () => {
  const res = await get(buildApp(), {});
  assert.equal(res.status, 401, 'anonymous request must be rejected with 401');
  assert.doesNotMatch(res.body, /"ok":true/, 'the protected handler must not run');
});

test('denies a request carrying a malformed / forged bearer token', async () => {
  const res = await get(buildApp(), { authorization: 'Bearer not-a-real-jwt' });
  assert.equal(res.status, 401, 'invalid token must be rejected with 401');
  assert.doesNotMatch(res.body, /"ok":true/, 'the protected handler must not run');
});

test('GRANTS access to a request with a VALID RS256 session token', async () => {
  const res = await get(buildApp(), { authorization: `Bearer ${signValidToken()}` });
  assert.equal(res.status, 200, 'an authenticated request must pass the gate');
  assert.match(res.body, /"ok":true/, 'the protected handler runs for an authenticated caller');
});

test('sensitive admin-facing reads are wired to authMiddleware (not optionalAuth)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'routes', 'v1.js'), 'utf8');
  const lines = src.split('\n');
  const mustBeAuthed = [
    '/analytics',
    '/teams',
    '/evaluation-schemas',
    '/integrations/github/repos',
    '/integrations/github/repo',
  ];
  for (const route of mustBeAuthed) {
    const line = lines.find((l) => l.includes(`router.get('${route}'`));
    assert.ok(line, `route GET ${route} should be registered`);
    assert.match(line, /authMiddleware/, `${route} must use authMiddleware`);
    assert.doesNotMatch(line, /optionalAuth/, `${route} must NOT use optionalAuth`);
  }
});

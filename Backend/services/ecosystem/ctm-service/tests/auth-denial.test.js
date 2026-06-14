'use strict';
// Proves the hard auth gate denies unauthenticated access, and that the sensitive admin-facing
// reads stay wired to it (regression guard against a revert to optionalAuth).
// Runs on Node's built-in runner — no jest/supertest dependency: `node --test`.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');

// authMiddleware's appConfig calls requireEnv('JWT_PUBLIC_KEY') at load and builds the canonical
// RS256 verifier from it. Provide a throwaway public key so the module loads; the denial paths
// under test reject before any signature verification, so any structurally-valid key works.
if (!process.env.JWT_PUBLIC_KEY) {
  const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  process.env.JWT_PUBLIC_KEY = publicKey.export({ type: 'spki', format: 'pem' });
}

const { authMiddleware } = require('../middleware/authMiddleware');

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

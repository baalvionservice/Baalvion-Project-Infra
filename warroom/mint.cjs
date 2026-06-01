'use strict';
// Shared RS256 token minter for war-room live tests (signs with the platform private key).
const crypto = require('crypto');
const fs = require('fs');
const PRIV = fs.readFileSync('d:/Baalvion Projects/docker/secrets/jwt_private_key.pem', 'utf8');
const STORE = 'a0a00000-0000-4000-8000-000000000001';
const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function mintToken({ sub, roles, org = STORE }) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT', kid: 'baalvion-key-1' };
  const payload = {
    sub: String(sub), email: `user${sub}@baalvion.test`, org_id: org, sid: 'sess-' + crypto.randomUUID(),
    roles, role: roles[0] || null, permissions: [], jti: crypto.randomUUID(),
    iss: 'baalvion-auth', aud: 'baalvion-platform', iat: now, exp: now + 3600,
  };
  const input = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(payload));
  const sig = crypto.sign('RSA-SHA256', Buffer.from(input), PRIV);
  return input + '.' + b64url(sig);
}
function http(method, urlPath, token, body, port = 3055) {
  const lib = require('http');
  return new Promise((resolve) => {
    const payload = body !== undefined ? JSON.stringify(body) : null;
    const req = lib.request({ host: '127.0.0.1', port, method, path: urlPath, headers: {
      'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}),
      ...(payload ? { 'content-length': Buffer.byteLength(payload) } : {}) } }, (res) => {
      let raw = ''; res.on('data', (c) => (raw += c));
      res.on('end', () => { let d; try { d = JSON.parse(raw); } catch { d = raw; } resolve({ status: res.statusCode, data: d }); });
    });
    req.on('error', (e) => resolve({ status: 0, data: 'CONN_ERR: ' + e.message }));
    if (payload) req.write(payload); req.end();
  });
}
module.exports = { mintToken, http, STORE };

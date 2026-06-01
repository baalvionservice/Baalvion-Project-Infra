'use strict';
// Shared RS256 token minter for war-room live tests.
// Delegates to the portable, repo-relative minter (Backend/scripts/mint-token.cjs) so it
// works on any machine — the previous version hard-coded an absolute D:\ key path.
const { mintToken: portableMint } = require('../Backend/scripts/mint-token.cjs');
const fixtures = require('./fixtures.cjs');

const STORE = fixtures.store;

// Backward-compatible signature: ({ sub, roles, org }) -> token. org defaults to the store.
function mintToken({ sub, roles, org = STORE }) {
  return portableMint({ sub, roles, org });
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

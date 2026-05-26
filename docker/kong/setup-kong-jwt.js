#!/usr/bin/env node
/**
 * Kong JWT Consumer Setup
 *
 * Fetches the RS256 public key from auth-service JWKS, then registers (or
 * updates) a Kong consumer + JWT credential so the built-in JWT plugin can
 * validate Baalvion access tokens on protected routes.
 *
 * Run after auth-service AND Kong are healthy:
 *   node docker/kong/setup-kong-jwt.js
 *
 * Env vars (all optional — defaults work for local Docker Compose):
 *   KONG_ADMIN_URL   Kong Admin API base URL  (default: http://localhost:8001)
 *   JWKS_URI         auth-service JWKS URL     (default: http://localhost:3001/.well-known/jwks.json)
 *   CONSUMER_NAME    Kong consumer username    (default: baalvion-services)
 *   MAX_RETRIES      Retry count for health waits  (default: 30)
 *   RETRY_DELAY_MS   Ms between retries           (default: 2000)
 */

'use strict';
const http   = require('http');
const https  = require('https');
const crypto = require('crypto');

const KONG_ADMIN  = process.env.KONG_ADMIN_URL  || 'http://localhost:8001';
const JWKS_URI    = process.env.JWKS_URI         || 'http://localhost:3001/.well-known/jwks.json';
const CONSUMER    = process.env.CONSUMER_NAME    || 'baalvion-services';
const MAX_RETRIES = Number(process.env.MAX_RETRIES    || 30);
const RETRY_DELAY = Number(process.env.RETRY_DELAY_MS || 2000);

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function request(urlStr, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const mod = url.protocol === 'https:' ? https : http;
    const opts = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname + url.search,
      method:   options.method  || 'GET',
      headers:  options.headers || {},
      timeout:  options.timeout || 10000,
    };
    if (body) {
      const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
      opts.headers['Content-Length'] = buf.length;
      opts.headers['Content-Type']   = opts.headers['Content-Type'] || 'application/json';
    }
    const req = mod.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${urlStr}`)); });
    if (body) req.write(Buffer.isBuffer(body) ? body : body);
    req.end();
  });
}

function get(url)             { return request(url); }
function post(url, payload)   { return request(url, { method: 'POST'  }, JSON.stringify(payload)); }
function put(url, payload)    { return request(url, { method: 'PUT'   }, JSON.stringify(payload)); }
function patch(url, payload)  { return request(url, { method: 'PATCH' }, JSON.stringify(payload)); }
function del(url)             { return request(url, { method: 'DELETE' }); }

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── Key conversion ────────────────────────────────────────────────────────────

function jwkToPem(jwk) {
  const keyObj = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  return keyObj.export({ type: 'spki', format: 'pem' });
}

// ── Wait helpers ──────────────────────────────────────────────────────────────

async function waitForUrl(url, name) {
  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      const res = await get(url);
      if (res.status < 500) return;
    } catch { /* not ready yet */ }
    console.log(`  [${i}/${MAX_RETRIES}] Waiting for ${name}...`);
    await sleep(RETRY_DELAY);
  }
  throw new Error(`${name} did not become healthy after ${MAX_RETRIES} attempts`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Kong JWT Consumer Setup ===\n');

  // 1. Wait for dependencies
  console.log('Waiting for auth-service JWKS endpoint...');
  await waitForUrl(JWKS_URI, 'auth-service JWKS');
  console.log('  ✓ auth-service ready\n');

  console.log('Waiting for Kong Admin API...');
  await waitForUrl(`${KONG_ADMIN}/status`, 'Kong Admin API');
  console.log('  ✓ Kong Admin API ready\n');

  // 2. Fetch JWKS
  console.log(`Fetching JWKS from ${JWKS_URI}...`);
  const jwksRes = await get(JWKS_URI);
  if (jwksRes.status !== 200) throw new Error(`JWKS fetch failed: HTTP ${jwksRes.status}`);
  const jwks = JSON.parse(jwksRes.body);
  if (!jwks.keys || jwks.keys.length === 0) throw new Error('JWKS returned no keys');
  console.log(`  ✓ ${jwks.keys.length} key(s) found\n`);

  // 3. Ensure consumer exists
  console.log(`Ensuring consumer "${CONSUMER}" exists...`);
  const consumerUrl = `${KONG_ADMIN}/consumers/${CONSUMER}`;
  const consumerCheck = await get(consumerUrl);
  if (consumerCheck.status === 404) {
    const created = await post(`${KONG_ADMIN}/consumers`, { username: CONSUMER, tags: ['baalvion', 'jwt-rs256'] });
    if (created.status !== 201) throw new Error(`Failed to create consumer: ${created.body}`);
    console.log(`  ✓ Consumer "${CONSUMER}" created\n`);
  } else {
    console.log(`  ✓ Consumer "${CONSUMER}" already exists\n`);
  }

  // 4. Register each key from JWKS
  for (const jwk of jwks.keys) {
    if (jwk.alg && jwk.alg !== 'RS256') {
      console.log(`  Skipping key kid=${jwk.kid} alg=${jwk.alg} (not RS256)`);
      continue;
    }
    if (jwk.kty !== 'RSA') {
      console.log(`  Skipping key kid=${jwk.kid} kty=${jwk.kty} (not RSA)`);
      continue;
    }

    const kid = jwk.kid;
    let pem;
    try {
      pem = jwkToPem(jwk);
    } catch (err) {
      console.error(`  ✗ Failed to convert JWK kid=${kid} to PEM: ${err.message}`);
      continue;
    }

    console.log(`Registering JWT credential for kid=${kid}...`);

    // Check if credential already exists (Kong jwt credentials keyed by 'key' field = kid)
    const credsRes = await get(`${KONG_ADMIN}/consumers/${CONSUMER}/jwt`);
    const creds    = JSON.parse(credsRes.body);
    const existing = creds.data?.find((c) => c.key === kid);

    if (existing) {
      // Update the credential if PEM changed
      const updateRes = await patch(
        `${KONG_ADMIN}/consumers/${CONSUMER}/jwt/${existing.id}`,
        {
          key:            kid,
          algorithm:      'RS256',
          rsa_public_key: pem,
        },
      );
      if (updateRes.status === 200) {
        console.log(`  ✓ Credential kid=${kid} updated`);
      } else {
        console.error(`  ✗ Failed to update credential kid=${kid}: ${updateRes.body}`);
      }
    } else {
      const createRes = await post(
        `${KONG_ADMIN}/consumers/${CONSUMER}/jwt`,
        {
          key:            kid,
          algorithm:      'RS256',
          rsa_public_key: pem,
        },
      );
      if (createRes.status === 201) {
        console.log(`  ✓ Credential kid=${kid} created`);
      } else {
        console.error(`  ✗ Failed to create credential kid=${kid}: ${createRes.body}`);
      }
    }
  }

  console.log('\n=== Setup complete ===\n');
  console.log('Kong JWT plugin will now accept RS256 access tokens from auth-service.');
  console.log('Re-run this script whenever auth-service rotates its signing key.\n');
}

main().catch((err) => {
  console.error('\n[ERROR]', err.message);
  process.exit(1);
});

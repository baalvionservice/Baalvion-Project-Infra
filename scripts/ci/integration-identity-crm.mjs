#!/usr/bin/env node
/**
 * integration-identity-crm.mjs — the cross-service half of CI.
 *
 * Two real services, two processes, a real HTTP hop between them: auth-service (:3001)
 * registers a user in Postgres, mints an RS256 access token and publishes the signing key
 * at /.well-known/jwks.json; crm-service (:3063) verifies that token through
 * @baalvion/auth-node by fetching that JWKS, then serves an authenticated write + read.
 * Neither service is stubbed and neither is told the other's keys up front.
 *
 * crm-service is booted with a DECOY JWT_PUBLIC_KEY on purpose. auth-node falls back to
 * the static key whenever the JWKS path errors (index.js, `catch (jwksErr)`), so a
 * CORRECT static key would let this suite pass with auth-service dead — proving nothing.
 * With a decoy, every 2xx below is only reachable if the JWKS fetch really happened and
 * the kid really matched.
 *
 * Env: AUTH_URL, CRM_URL. Exits 1 on any failing assertion.
 *
 *   node scripts/ci/integration-identity-crm.mjs --emit-decoy <dir>   # write the decoy keypair
 *   node scripts/ci/integration-identity-crm.mjs                      # run the assertions
 */
import { randomUUID, generateKeyPairSync } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

// The decoy lives here rather than in the workflow so the reason for it stays next to the
// assertions that depend on it.
const emitAt = process.argv.indexOf('--emit-decoy');
if (emitAt !== -1) {
  const dir = process.argv[emitAt + 1];
  if (!dir) { console.error('--emit-decoy needs a directory'); process.exit(2); }
  const { publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  writeFileSync(join(dir, 'decoy_public.pem'), publicKey);
  console.log(`decoy public key -> ${join(dir, 'decoy_public.pem')}`);
  process.exit(0);
}

const AUTH = (process.env.AUTH_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const CRM = (process.env.CRM_URL || 'http://127.0.0.1:3063').replace(/\/$/, '');

let failed = 0;
const check = (cond, msg, detail) => {
  if (cond) {
    console.log(`  ok    ${msg}`);
    return;
  }
  failed += 1;
  console.error(`  FAIL  ${msg}${detail ? `\n        ${detail}` : ''}`);
};
const body = async (res) => {
  try { return await res.json(); } catch { return null; }
};
const decodeSegment = (s) => {
  try { return JSON.parse(Buffer.from(s, 'base64url').toString()); } catch { return {}; }
};

async function run() {
  console.log(`auth-service ${AUTH}\ncrm-service  ${CRM}\n`);

  // 1 — auth-service publishes a key other services can verify against.
  const jwksRes = await fetch(`${AUTH}/.well-known/jwks.json`);
  const jwks = await body(jwksRes);
  check(jwksRes.status === 200 && Array.isArray(jwks?.keys) && jwks.keys.length > 0,
    'auth-service publishes a JWKS', `status=${jwksRes.status} keys=${jwks?.keys?.length}`);
  const jwksKid = jwks?.keys?.[0]?.kid;
  check(typeof jwksKid === 'string' && jwksKid.length > 0, 'the published key carries a kid');

  // 2 — a real registration: auth-service writes the user + org to Postgres and mints a token.
  const email = `ci-integration-${randomUUID()}@baalvion.test`;
  const regRes = await fetch(`${AUTH}/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'CiIntegration!2026', fullName: 'CI Integration' }),
  });
  const reg = await body(regRes);
  check(regRes.status === 201 || regRes.status === 200, 'auth-service registers a user',
    `status=${regRes.status} body=${JSON.stringify(reg)?.slice(0, 300)}`);
  const token = reg?.data?.accessToken;
  check(typeof token === 'string' && token.split('.').length === 3, 'registration returns an RS256 access token');
  if (typeof token !== 'string') return;

  const header = decodeSegment(token.split('.')[0]);
  const claims = decodeSegment(token.split('.')[1]);
  check(header.alg === 'RS256', 'the token is RS256', `alg=${header.alg}`);
  check(header.kid === jwksKid, 'the token kid is the one on the JWKS', `token=${header.kid} jwks=${jwksKid}`);
  // crm-service's middleware requires these; without them the 200s below would be vacuous.
  check(Boolean(claims.sub && claims.org_id && claims.sid && claims.jti),
    'the token carries the canonical sub/org_id/sid/jti claims', JSON.stringify(Object.keys(claims)));

  const authed = { Authorization: `Bearer ${token}` };

  // 3 — crm-service is listening, so a 401 below reads as "rejected", not "nothing there".
  const health = await fetch(`${CRM}/health`);
  check(health.status === 200, 'crm-service is serving', `status=${health.status}`);

  // 4 — and it is actually closed to anonymous callers.
  const anon = await fetch(`${CRM}/v1/crm/segments`);
  check(anon.status === 401, 'crm-service rejects an unauthenticated read', `status=${anon.status}`);

  // 5 — the cross-service assertion. crm-service has never seen this token or its key;
  // accepting it means it fetched auth-service's JWKS over HTTP and matched the kid.
  const name = `ci-integration-${randomUUID().slice(0, 8)}`;
  const createRes = await fetch(`${CRM}/v1/crm/segments`, {
    method: 'POST',
    headers: { ...authed, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description: 'written by the CI cross-service integration test' }),
  });
  const created = await body(createRes);
  check(createRes.status === 201, 'crm-service accepts a write authorised by an auth-service token',
    `status=${createRes.status} body=${JSON.stringify(created)?.slice(0, 300)}`);
  const createdId = created?.data?.id;

  // 6 — and the row is really there on the read path, not just echoed back.
  const listRes = await fetch(`${CRM}/v1/crm/segments?search=${encodeURIComponent(name)}`, { headers: authed });
  const list = await body(listRes);
  check(listRes.status === 200 && list?.success === true, 'crm-service serves the authenticated read',
    `status=${listRes.status}`);
  check((list?.data?.items || []).some((row) => row.id === createdId),
    'the row written under that token reads back', `looking for ${createdId}`);

  // 7 — the gate is a real signature check, not a "has a Bearer header" check.
  const [h, p, sig] = token.split('.');
  const tampered = `${h}.${p}.${(sig[0] === 'A' ? 'B' : 'A')}${sig.slice(1)}`;
  const badRes = await fetch(`${CRM}/v1/crm/segments`, { headers: { Authorization: `Bearer ${tampered}` } });
  check(badRes.status === 401, 'crm-service rejects a tampered signature', `status=${badRes.status}`);
}

run()
  .catch((err) => { failed += 1; console.error(`  FAIL  unexpected error: ${err.stack || err.message}`); })
  .finally(() => {
    console.log(failed === 0 ? '\nCross-service integration: PASS' : `\nCross-service integration: ${failed} FAILED`);
    process.exit(failed === 0 ? 0 : 1);
  });

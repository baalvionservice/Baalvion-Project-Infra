#!/usr/bin/env node
'use strict';
/**
 * Security-Hardening Live Probe — Org Suspension + MFA Enforcement
 * ────────────────────────────────────────────────────────────────
 * Proves the two security controls END-TO-END through the live auth-gateway HTTP API
 * (the part vitest cannot cover: the gateway Redis kill-switch rejecting an in-flight
 * access token, and the full MFA-enrollment cookie handshake).
 *
 * REQUIRES the live stack: auth-service :3001, auth-gateway :3099, Postgres, Redis.
 * Seeds its OWN throwaway org/users via the repos and deletes them afterwards.
 *
 *   node scripts/securityHardeningLiveProbe.js
 */
const speakeasy = require('speakeasy');
const db = require('../models');
const { orgRepo } = require('../repositories');
const password = require('../utils/password');
const redis = require('../config/redis');

const GATEWAY = process.env.GATEWAY_URL || 'http://localhost:3099';
const PLATFORM_EMAIL = process.env.PLATFORM_OWNER_EMAIL || 'superadmin@baalvion.com';
const PLATFORM_PW = process.env.PLATFORM_OWNER_PASSWORD;
const STAMP = `${process.pid}${Date.now().toString(36)}`;
const PW = 'Pr0bePass!2026';

const results = [];
const ok = (l) => { results.push({ l, ok: true }); console.log(`  ✓  ${l}`); };
const bad = (l, r) => { results.push({ l, ok: false, r }); console.error(`  ✗  ${l}${r ? ` — ${r}` : ''}`); };

// ── cookie-jar fetch ─────────────────────────────────────────────────────────
function jar() { return { cookies: {}, csrf: null }; }
function absorb(j, res) {
  const list = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie()
    : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : []);
  for (const h of list) {
    const [nv] = h.split(';'); const i = nv.indexOf('=');
    if (i === -1) continue;
    const n = nv.slice(0, i).trim(); const v = nv.slice(i + 1).trim();
    j.cookies[n] = v;
    if (n === 'csrf_token') j.csrf = v;
  }
}
async function call(j, path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json', Cookie: Object.entries(j.cookies).map(([k, v]) => `${k}=${v}`).join('; ') };
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && j.csrf) headers['x-csrf-token'] = j.csrf;
  const res = await fetch(`${GATEWAY}${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  absorb(j, res);
  let json = null; try { json = await res.json(); } catch { /* none */ }
  return { status: res.status, json };
}

async function main() {
  await redis.connect().catch(() => {});
  await db.sequelize.authenticate();

  const created = { orgIds: [], userIds: [] };

  // ── Seed: a bank org + admin user (full-session), and a force-MFA user ───────
  const bank = await orgRepo.createWithProfile({ name: `Probe Bank ${STAMP}`, type: 'bank', status: 'active' });
  created.orgIds.push(bank.id);
  const pwHash = await password.hash(PW);

  const adminEmail = `probe.admin.${STAMP}@example.com`;
  const adminUser = await db.User.create({ email: adminEmail, password_hash: pwHash, full_name: 'Probe Admin', status: 'active' });
  created.userIds.push(adminUser.id);
  await db.TeamMember.create({ org_id: bank.id, user_id: adminUser.id, role: 'admin', status: 'active', joined_at: new Date() });

  const mfaEmail = `probe.mfa.${STAMP}@example.com`;
  const mfaUser = await db.User.create({ email: mfaEmail, password_hash: pwHash, full_name: 'Probe MFA', status: 'active', mfa_required: true, mfa_enabled: false });
  created.userIds.push(mfaUser.id);
  // give the mfa user their own active (non-suspended) org so login resolves an org
  const mfaOrg = await orgRepo.createWithProfile({ name: `Probe MFAOrg ${STAMP}`, type: 'buyer', status: 'active' });
  created.orgIds.push(mfaOrg.id);
  await db.TeamMember.create({ org_id: mfaOrg.id, user_id: mfaUser.id, role: 'operator', status: 'active', joined_at: new Date() });

  console.log('\n════ SCENARIO 1: Org suspension terminates live access ════');
  // 1. admin logs in → full session
  const admin = jar();
  const login = await call(admin, '/auth/login', { method: 'POST', body: { email: adminEmail, password: PW } });
  if (login.status === 200 && admin.cookies['baalvion_access']) ok('Bank admin logs in → full session + cookies');
  else bad('Bank admin logs in', `status=${login.status} body=${JSON.stringify(login.json)}`);

  // 2. protected call works BEFORE suspension
  const pre = await call(admin, '/auth/svc/me');
  if (pre.status === 200) ok('Protected API call succeeds before suspension (200)');
  else bad('Protected API call before suspension', `status=${pre.status}`);

  // 3. platform owner suspends the bank
  const plat = jar();
  const pl = await call(plat, '/auth/login', { method: 'POST', body: { email: PLATFORM_EMAIL, password: PLATFORM_PW } });
  if (pl.status !== 200) { bad('Platform owner login (needed to suspend)', `status=${pl.status}`); }
  const susp = await call(plat, `/auth/svc/platform/organizations/${bank.id}/status`, { method: 'POST', body: { status: 'suspended' } });
  if (susp.status === 200) ok('Platform owner suspends the bank org');
  else bad('Suspend bank org', `status=${susp.status} body=${JSON.stringify(susp.json)}`);

  // 4. THE KILL-SWITCH: in-flight access token now rejected at the gateway
  const post = await call(admin, '/auth/svc/me');
  if (post.status === 403) ok('In-flight access token REJECTED after suspension (403 — Redis kill-switch)');
  else bad('In-flight access token after suspension', `expected 403, got ${post.status}`);

  // 5. refresh denied
  const refreshed = await call(admin, '/auth/refresh', { method: 'POST' });
  if (refreshed.status === 401 || refreshed.status === 403) ok(`Refresh denied after suspension (${refreshed.status})`);
  else bad('Refresh after suspension', `expected 401/403, got ${refreshed.status}`);

  // 6. fresh login denied
  const reLogin = await call(jar(), '/auth/login', { method: 'POST', body: { email: adminEmail, password: PW } });
  if (reLogin.status === 403 || (reLogin.json && reLogin.json.error && reLogin.json.error.code === 'ORG_SUSPENDED')) ok('Fresh login into suspended org denied (ORG_SUSPENDED)');
  else bad('Fresh login into suspended org', `status=${reLogin.status} body=${JSON.stringify(reLogin.json)}`);

  // 7. reactivate clears the kill-switch
  await call(plat, `/auth/svc/platform/organizations/${bank.id}/status`, { method: 'POST', body: { status: 'active' } });
  const stillSuspended = await redis.isOrgSuspended(bank.id);
  if (!stillSuspended) ok('Reactivation clears the Redis kill-switch');
  else bad('Reactivation clears kill-switch', 'flag still set');

  console.log('\n════ SCENARIO 2: Force-MFA enforced at login ════');
  // 1. force-MFA user login → enrollment challenge, NO session
  const mfa = jar();
  const mlogin = await call(mfa, '/auth/login', { method: 'POST', body: { email: mfaEmail, password: PW } });
  if (mlogin.status === 200 && mlogin.json && mlogin.json.mfaEnrollmentRequired && mlogin.json.challengeToken && !mfa.cookies['baalvion_access']) {
    ok('Force-MFA login returns enrollment challenge, NO session cookie');
  } else bad('Force-MFA login', `status=${mlogin.status} body=${JSON.stringify(mlogin.json)}`);
  const challengeToken = mlogin.json && mlogin.json.challengeToken;

  // 2. protected route blocked (no session yet)
  const blocked = await call(mfa, '/auth/svc/me');
  if (blocked.status === 401) ok('Protected route blocked during partial (enrollment) state (401)');
  else bad('Protected route during enrollment', `expected 401, got ${blocked.status}`);

  // 3. enroll start → secret (gateway returns the provisioning object unwrapped)
  const start = await call(mfa, '/auth/mfa-enroll/start', { method: 'POST', body: { challengeToken } });
  const secret = start.json && (start.json.secret || (start.json.data && start.json.data.secret));
  if (start.status === 200 && secret) ok('Enrollment start returns TOTP secret + QR');
  else bad('Enrollment start', `status=${start.status} body=${JSON.stringify(start.json)}`);

  // 4. wrong code rejected
  const wrong = await call(mfa, '/auth/mfa-enroll', { method: 'POST', body: { challengeToken, code: '000000' } });
  if (wrong.status >= 400) ok(`Wrong MFA code rejected (${wrong.status})`);
  else bad('Wrong MFA code', `expected 4xx, got ${wrong.status}`);

  // 5. correct code → full session granted
  const code = speakeasy.totp({ secret, encoding: 'base32' });
  const done = await call(mfa, '/auth/mfa-enroll', { method: 'POST', body: { challengeToken, code } });
  if (done.status === 200 && mfa.cookies['baalvion_access']) ok('Correct MFA code → full session granted (cookies set)');
  else bad('Complete MFA enrollment', `status=${done.status} body=${JSON.stringify(done.json)}`);

  // 6. access now granted
  const granted = await call(mfa, '/auth/svc/me');
  if (granted.status === 200) ok('Protected route accessible after MFA completion (200)');
  else bad('Protected route after MFA', `expected 200, got ${granted.status}`);

  // 7. mfa now enabled in DB
  const reloaded = await db.User.findByPk(mfaUser.id);
  if (reloaded.mfa_enabled) ok('User mfa_enabled=true persisted');
  else bad('mfa_enabled persisted', 'still false');

  // ── Teardown ────────────────────────────────────────────────────────────────
  console.log('\n── cleanup ──');
  try {
    for (const oid of created.orgIds) {
      const sids = (await db.Session.findAll({ where: { org_id: oid }, attributes: ['id'] })).map(s => s.id);
      if (sids.length) await db.RefreshToken.destroy({ where: { session_id: sids } });
      await db.Session.destroy({ where: { org_id: oid } });
      await db.TeamMember.destroy({ where: { org_id: oid } });
      await db.Invitation.destroy({ where: { org_id: oid } });
      await redis.clearOrgSuspended(oid);
    }
    await db.Organization.destroy({ where: { id: created.orgIds } });
    await db.User.destroy({ where: { id: created.userIds } });
    console.log('  cleaned up probe orgs/users');
  } catch (e) { console.warn('  cleanup warning:', e.message); }

  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`\n════ RESULT: ${passed} passed, ${failed} failed ════\n`);
  await db.sequelize.close();
  try { const c = redis.getClient(); if (c) c.disconnect(); } catch { /* noop */ }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });

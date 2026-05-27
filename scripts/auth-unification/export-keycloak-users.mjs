#!/usr/bin/env node
/**
 * Phase 5 — Task 3: EXPORT KEYCLOAK USERS (PREPARE-ONLY; operator runs it).
 *
 *   node scripts/auth-unification/export-keycloak-users.mjs            # dry-run (counts only)
 *   node scripts/auth-unification/export-keycloak-users.mjs --execute  # writes the export JSON
 *
 * Read-only against the Keycloak Admin REST API. Exports users + realm role mappings +
 * enabled state + profile fields to migrations/keycloak-export-<ts>.json with row counts
 * and a sha256 checksum. NO passwords are exported (Keycloak pbkdf2 hashes are NOT reusable).
 *
 * Env: KEYCLOAK_URL (e.g. http://localhost:8088), KEYCLOAK_REALM (baalvion),
 *      KEYCLOAK_ADMIN_USER, KEYCLOAK_ADMIN_PASSWORD (admin-cli, master realm).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const KC = process.env.KEYCLOAK_URL || 'http://localhost:8088';
const REALM = process.env.KEYCLOAK_REALM || 'baalvion';
const ADMIN_USER = process.env.KEYCLOAK_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
const execute = process.argv.includes('--execute');

async function adminToken() {
  const res = await fetch(`${KC}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'password', client_id: 'admin-cli', username: ADMIN_USER, password: ADMIN_PASS }),
  });
  if (!res.ok) throw new Error(`Keycloak admin auth failed: HTTP ${res.status}`);
  return (await res.json()).access_token;
}

const api = (tok, path) => fetch(`${KC}/admin/realms/${REALM}${path}`, { headers: { Authorization: `Bearer ${tok}` } }).then((r) => {
  if (!r.ok) throw new Error(`GET ${path} → HTTP ${r.status}`);
  return r.json();
});

const tok = await adminToken();
const total = (await api(tok, `/users/count`));
console.log(`[kc-export] realm=${REALM} users=${total}`);
if (!execute) { console.log('[dry-run] re-run with --execute to write the export.'); process.exit(0); }

const users = [];
const pageSize = 100;
for (let first = 0; ; first += pageSize) {
  const batch = await api(tok, `/users?first=${first}&max=${pageSize}`);
  if (!batch.length) break;
  for (const u of batch) {
    const roleMap = await api(tok, `/users/${u.id}/role-mappings`).catch(() => ({}));
    const realmRoles = (roleMap.realmMappings || []).map((r) => r.name);
    users.push({
      keycloakId: u.id, username: u.username, email: u.email,
      firstName: u.firstName, lastName: u.lastName,
      enabled: u.enabled, emailVerified: u.emailVerified,
      realmRoles, attributes: u.attributes || {},
      // NOTE: password hash intentionally NOT exported (pbkdf2 — not reusable).
    });
  }
}

const enabled = users.filter((u) => u.enabled).length;
const out = { realm: REALM, exportedAt: new Date().toISOString(), counts: { total: users.length, enabled, disabled: users.length - enabled }, users };
const json = JSON.stringify(out, null, 2);
const ts = out.exportedAt.replace(/[:.]/g, '-');
const dir = 'Backend/database/migrations/auth-unification';
mkdirSync(dir, { recursive: true });
const file = `${dir}/keycloak-export-${ts}.json`;
writeFileSync(file, json);
writeFileSync(`${file}.sha256`, createHash('sha256').update(json).digest('hex'));
console.log(`[kc-export] wrote ${file}`);
console.log(`| exported users | enabled | disabled |\n| ${users.length} | ${enabled} | ${users.length - enabled} |`);

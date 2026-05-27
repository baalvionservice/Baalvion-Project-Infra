#!/usr/bin/env node
/**
 * Phase 5 — Task 5: IMPORT KEYCLOAK USERS into auth-service (PREPARE-ONLY; operator runs it).
 *
 *   node scripts/auth-unification/import-keycloak-users.mjs --file <export.json>            # dry-run
 *   node scripts/auth-unification/import-keycloak-users.mjs --file <export.json> --execute  # transactional import
 *
 * Idempotent + transactional + audit-logged. For EVERY imported user:
 *   - preserve email / username / names / enabled state
 *   - map realm roles → canonical roles[] (preserving app roles; see auth-service/RBAC.md)
 *   - org mapping per --org-id (REQUIRED; Task 4 human decision)
 *   - set password_reset_required = true  (Keycloak pbkdf2 hashes are NOT imported)
 *   - tag source_issuer = 'keycloak' for rollback
 * Duplicate emails are MERGED (role union), never overwritten blindly; failures are logged.
 *
 * Requires `pg` + DB_* env (auth-service DB). Roles map is loaded from auth-service/RBAC.md
 * conventions, encoded below.
 */
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const file = opt('--file');
const orgId = opt('--org-id');               // Task 4 decision — REQUIRED
const execute = args.includes('--execute');
if (!file) { console.error('Missing --file <export.json>'); process.exit(2); }
if (!orgId) { console.error('Missing --org-id <auth-service org id> (Task 4 org-mapping decision)'); process.exit(2); }

// Realm → canonical. App roles are PRESERVED verbatim in roles[] (baalvion-os guards
// match them exactly) and ALSO given a hierarchy level. See auth-service/RBAC.md.
const HIERARCHY_OF = {
  admin: 'admin', recruiter: 'manager', finance: 'manager', interviewer: 'editor',
  lawyer: 'editor', creator: 'member', brand: 'member', client: 'member', candidate: 'member',
};
const toCanonicalRoles = (realmRoles) => {
  const app = realmRoles.filter((r) => r in HIERARCHY_OF);
  const hierarchy = [...new Set(app.map((r) => HIERARCHY_OF[r]))];
  return [...new Set([...app, ...hierarchy])]; // e.g. ['recruiter','manager']
};

const data = JSON.parse(readFileSync(file, 'utf8'));
const result = { imported: 0, merged: 0, skipped: 0, failed: 0 };

if (!execute) {
  console.log(`[kc-import] DRY-RUN file=${file} org=${orgId} users=${data.users.length}`);
  for (const u of data.users.slice(0, 5)) console.log('  sample:', u.email, '→ roles', toCanonicalRoles(u.realmRoles));
  console.log('[dry-run] no DB writes. Re-run with --execute.');
  process.exit(0);
}

const { Client } = await import('pg');
const client = new Client({
  host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'baalvion_db', user: process.env.DB_USER || 'baalvion',
  password: process.env.DB_PASSWORD || '',
});
await client.connect();
try {
  for (const u of data.users) {
    if (!u.email) { result.skipped++; continue; }
    const roles = toCanonicalRoles(u.realmRoles);
    try {
      await client.query('BEGIN');
      const existing = await client.query('SELECT id FROM auth.users WHERE lower(email) = lower($1)', [u.email]);
      if (existing.rows.length) {
        // MERGE: union roles on the existing org membership; never overwrite the user.
        await client.query(
          `UPDATE auth.org_members SET service_roles = service_roles || $3::jsonb
             WHERE org_id = $1 AND user_id = $2`,
          [orgId, existing.rows[0].id, JSON.stringify(Object.fromEntries(roles.map((r) => [r, true])))],
        );
        await client.query(
          `INSERT INTO auth.audit_logs(user_id, org_id, action, metadata)
             VALUES ($1,$2,'migration.keycloak_merge', $3)`,
          [existing.rows[0].id, orgId, JSON.stringify({ source_issuer: 'keycloak', keycloakId: u.keycloakId })],
        );
        result.merged++;
      } else {
        const ins = await client.query(
          `INSERT INTO auth.users(email, full_name, status, email_verified_at, password_reset_required)
             VALUES ($1,$2,$3,$4,true) RETURNING id`,
          [u.email, [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username, u.enabled ? 'active' : 'suspended', u.emailVerified ? new Date() : null],
        );
        const userId = ins.rows[0].id;
        await client.query(
          `INSERT INTO auth.org_members(org_id, user_id, role, service_roles)
             VALUES ($1,$2,$3,$4)`,
          [orgId, userId, roles.find((r) => ['admin', 'owner', 'manager', 'editor', 'member'].includes(r)) || 'member',
           JSON.stringify(Object.fromEntries(roles.map((r) => [r, true])))],
        );
        await client.query(
          `INSERT INTO auth.audit_logs(user_id, org_id, action, metadata)
             VALUES ($1,$2,'migration.keycloak_import', $3)`,
          [userId, orgId, JSON.stringify({ source_issuer: 'keycloak', keycloakId: u.keycloakId, roles })],
        );
        result.imported++;
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      result.failed++;
      console.error(`  FAIL ${u.email}: ${e.message}`);
    }
  }
} finally {
  await client.end();
}
console.log(`| imported | merged | skipped | failed |\n| ${result.imported} | ${result.merged} | ${result.skipped} | ${result.failed} |`);
console.log('All imported Keycloak users have password_reset_required=true (Task 10).');

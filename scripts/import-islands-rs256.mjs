#!/usr/bin/env node
/**
 * import-islands-rs256.mjs — multi-island identity unification (Phase 3A).
 *
 * Imports trade.users + elite_circle.users + insiders.users INTO the canonical
 * auth-service store (auth.users + auth.organizations + auth.team_members), so
 * auth-service can issue RS256 tokens for island users. This is the PREREQUISITE
 * for HS256 removal — it does NOT touch HS256, jwtserver.js, or any island middleware.
 *
 * SAFETY:
 *   - DRY-RUN is DEFAULT. Pass --apply to write (single transaction, ROLLBACK on any error).
 *   - Insert-only; never updates/deletes existing auth.users. ON CONFLICT(email) DO NOTHING.
 *   - Preserves password hashes (NO rehash). password_reset_required = (bcrypt cost < 10).
 *   - Roles -> auth.team_members: role = highest-privilege (MAX hierarchy), service_roles = full mapped array (jsonb).
 *   - Cross-island email collisions: priority elite > insiders > trade; loser gets email+{source}@ alias + identity_conflict.
 *   - Stamps auth.users.imported_from = island (targeted rollback). Requires migration 000 applied (for --apply).
 *
 * Usage:  DATABASE_URL=postgres://user:pw@host:5432/db node scripts/import-islands-rs256.mjs [--apply]
 */
'use strict';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
const require = createRequire(import.meta.url);
// pg lives in service node_modules (workspace), not repo root; ESM ignores NODE_PATH, so resolve explicitly.
const { Client } = require(process.env.PG_PATH || 'd:/Baalvion Projects/Backend/services/identity/auth-service/node_modules/pg');

const HIER = ['viewer', 'member', 'editor', 'manager', 'admin', 'owner', 'super_admin'];
const maxRole = (arr) => arr.reduce((a, b) => (HIER.indexOf(b) > HIER.indexOf(a) ? b : a), arr[0]);
const aliasEmail = (email, src) => { const [l, d] = email.split('@'); return `${l}+${src}@${d}`; };

// Priority order = array order (elite > insiders > trade); auth.users always wins above all.
const ISLANDS = [
  { key: 'elite',    schema: 'elite_circle', org: { slug: 'org_elite',    name: 'Elite Circle', plan: 'free' },
    rolesFrom: 'user_roles', roleMap: { user: 'member', member: 'member', creator: 'editor', moderator: 'manager', admin: 'admin', owner: 'owner' } },
  { key: 'insiders', schema: 'insiders',     org: { slug: 'org_insiders', name: 'Insiders',     plan: 'free' },
    rolesFrom: 'user_roles', roleMap: { user: 'member', analyst: 'editor', moderator: 'manager', admin: 'admin', owner: 'owner' } },
  { key: 'trade',    schema: 'trade',        org: { slug: 'org_trade',    name: 'Trade',         plan: 'free' },
    rolesFrom: 'scalar',     roleMap: { trader: 'member', operator: 'editor', risk_manager: 'manager', admin: 'admin', owner: 'owner' } },
];

const APPLY = process.argv.includes('--apply');
const url = process.env.DATABASE_URL; // optional; falls back to discrete PG* env vars (PGHOST/PGUSER/PGPASSWORD/PGDATABASE)

function classifyHash(h) {
  const m = (h || '').match(/^\$2[aby]\$(\d{2})\$/);
  if (m) return { kind: `bcrypt(cost=${m[1]})`, keep: Number(m[1]) >= 10 };
  if ((h || '').startsWith('$argon2id')) return { kind: 'argon2id', keep: true };
  return { kind: 'unknown', keep: false };
}

(async () => {
  console.log(`\n=== import-islands-rs256 :: ${APPLY ? 'APPLY (transactional writes)' : 'DRY-RUN (no writes)'} ===`);
  const c = url ? new Client({ connectionString: url }) : new Client(); // discrete PG* env fallback
  await c.connect();

  // 1) gather island users (+roles)
  const all = [];
  for (const isl of ISLANDS) {
    let rows;
    if (isl.rolesFrom === 'scalar') {
      ({ rows } = await c.query(
        `SELECT id, email, password_hash, full_name, is_active, ARRAY[role::text] AS roles FROM ${isl.schema}.users ORDER BY id`));
    } else {
      ({ rows } = await c.query(
        `SELECT u.id, u.email, u.password_hash, NULL::text AS full_name, u.is_active,
                COALESCE(array_agg(r.role::text) FILTER (WHERE r.role IS NOT NULL), ARRAY[]::text[]) AS roles
           FROM ${isl.schema}.users u LEFT JOIN ${isl.schema}.user_roles r ON r.user_id = u.id
          GROUP BY u.id, u.email, u.password_hash, u.is_active ORDER BY u.id`));
    }
    for (const r of rows) all.push({ ...r, isl });
  }

  // 2) resolve emails + roles -> plan
  const seen = new Map();         // lower(email) -> source that claimed it
  const plan = [], rejected = [];
  let aliased = 0, forcedResets = 0;
  for (const u of all) {
    const src = u.isl.key;
    const emailLc = (u.email || '').trim().toLowerCase();
    if (!emailLc) { rejected.push({ src, email: u.email, reason: 'empty_email' }); continue; }

    const mapped = (u.roles || []).map((r) => u.isl.roleMap[r]);
    const unmapped = (u.roles || []).filter((r) => !u.isl.roleMap[r]);
    if (unmapped.length) { rejected.push({ src, email: u.email, reason: `unmapped_role:${unmapped.join(',')}` }); continue; }
    const roles = [...new Set(mapped.filter(Boolean))]; if (!roles.length) roles.push('member');
    const finalRole = maxRole(roles);

    let finalEmail = u.email; const conflicts = []; let identityConflict = false;
    const { rows: ex } = await c.query('SELECT id, password_hash FROM auth.users WHERE lower(email)=lower($1)', [u.email]);
    if (ex.length) {
      if (ex[0].password_hash === u.password_hash) { plan.push({ src, action: 'skip', email: u.email, reason: 'already_in_auth_same_hash' }); continue; }
      finalEmail = aliasEmail(u.email, src); conflicts.push('email_in_auth_diff_hash->alias'); identityConflict = true;
    }
    if (finalEmail === u.email && seen.has(emailLc)) {
      finalEmail = aliasEmail(u.email, src); conflicts.push(`collision_with_${seen.get(emailLc)}->alias`); identityConflict = true;
    }
    if (identityConflict) aliased++;
    seen.set(emailLc, src); seen.set(finalEmail.toLowerCase(), src);

    const h = classifyHash(u.password_hash);
    if (!h.keep) forcedResets++;
    plan.push({ src, action: 'insert', legacyId: u.id, email: finalEmail, fullName: u.full_name,
      passwordHash: u.password_hash, finalRole, serviceRoles: roles, org: u.isl.org,
      passwordResetRequired: !h.keep, hash: h.kind, status: u.is_active === false ? 'disabled' : 'active',
      conflicts, identityConflict });
  }

  // 3) report
  for (const p of plan) {
    if (p.action === 'skip') { console.log(`  skip   ${p.email}  (${p.reason})`); continue; }
    console.log(`  insert ${p.email.padEnd(34)} src=${p.src.padEnd(8)} role=${p.finalRole.padEnd(7)} roles=[${p.serviceRoles.join(',')}] hash=${p.hash}${p.passwordResetRequired ? ' RESET' : ''}${p.identityConflict ? '  CONFLICT:' + p.conflicts.join(';') : ''}`);
  }
  if (rejected.length) { console.log('\n  -- REJECTED --'); for (const r of rejected) console.log(`  REJECT [${r.src}] ${r.email} (${r.reason})`); }
  const inserts = plan.filter((p) => p.action === 'insert');
  console.log(`\nSUMMARY: total=${all.length} insert=${inserts.length} skip=${plan.length - inserts.length} rejected=${rejected.length} aliased=${aliased} forcedResets=${forcedResets}`);

  // 4) validation gate
  const validationOk = rejected.length === 0;
  console.log(`VALIDATION: ${validationOk ? 'PASS (0 rejects, all roles mapped, all collisions resolved)' : 'FAIL'}`);

  if (!APPLY) { console.log('\nDRY-RUN complete — NO writes. Re-run with --apply after snapshot.'); await c.end(); return; }
  if (!validationOk) { console.error('\nABORT: validation failed — refusing to --apply.'); await c.end(); process.exit(1); }

  // 5) transactional apply
  await c.query('BEGIN');
  try {
    const emailToId = new Map();
    for (const p of inserts) {
      const { rows } = await c.query(
        `INSERT INTO auth.users (email, password_hash, full_name, status, password_reset_required, imported_from, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) ON CONFLICT (email) DO NOTHING RETURNING id`,
        [p.email, p.passwordHash, p.fullName || null, p.status, p.passwordResetRequired, p.src]);
      if (rows[0]) emailToId.set(p.email.toLowerCase(), rows[0].id);
    }
    let memberships = 0;
    for (const isl of ISLANDS) {
      const islInserts = inserts.filter((p) => p.src === isl.key && emailToId.has(p.email.toLowerCase()));
      if (!islInserts.length) continue;
      const ownerId = emailToId.get((islInserts.find((p) => p.finalRole === 'owner' || p.finalRole === 'admin') || islInserts[0]).email.toLowerCase());
      let { rows: o } = await c.query('SELECT id FROM auth.organizations WHERE slug=$1', [isl.org.slug]);
      let orgId = o[0]?.id;
      if (!orgId) ({ rows: [{ id: orgId }] } = await c.query(
        'INSERT INTO auth.organizations (id, name, slug, plan, owner_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW()) RETURNING id',
        [randomUUID(), isl.org.name, isl.org.slug, isl.org.plan, ownerId]));
      for (const p of islInserts) {
        const uid = emailToId.get(p.email.toLowerCase());
        const res = await c.query(
          `INSERT INTO auth.team_members (org_id, user_id, role, service_roles, status, joined_at, created_at, updated_at)
           VALUES ($1,$2,$3,$4::jsonb,'active',NOW(),NOW(),NOW()) ON CONFLICT (org_id, user_id) DO NOTHING`,
          [orgId, uid, p.finalRole, JSON.stringify(p.serviceRoles)]);
        memberships += res.rowCount;
        console.log(`MIGRATED_USER: ${p.email} | ${p.src} | inserted (role=${p.finalRole})`);
      }
    }
    await c.query('COMMIT');
    console.log(`\nAPPLIED: usersInserted=${emailToId.size} membershipsInserted=${memberships}`);
  } catch (e) {
    await c.query('ROLLBACK');
    console.error('\nAPPLY FAILED — transaction ROLLED BACK: ' + e.message);
    await c.end(); process.exit(1);
  }
  await c.end();
})().catch((e) => { console.error('FATAL: ' + e.message); process.exit(1); });

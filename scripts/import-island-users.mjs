#!/usr/bin/env node
/**
 * import-island-users.mjs — Auth-unification island → auth-service user importer.
 *
 * Migrates users from an HS256 "island" (law / trade / elite-circle / insiders / keycloak)
 * into the canonical auth-service identity store (auth.users + auth.organizations + auth.team_members).
 *
 * SAFETY (mandatory program rules):
 *   - DRY-RUN is the DEFAULT. You must pass --apply to write anything.
 *   - Idempotent: re-running never creates duplicates (ON CONFLICT).
 *   - NEVER overwrites an existing password hash (email-exists-with-different-hash → REJECTED).
 *   - NEVER silently remaps roles (a role missing from the island's roleMap → REJECTED).
 *   - Preserves email uniqueness, password hashes, and disabled status.
 *   - APPLY runs in a single transaction and ROLLS BACK on any error.
 *   - Marks password_reset_required=TRUE for weak hashes (bcrypt cost < 12 / non-bcrypt).
 *   - Stamps auth.users.imported_from for targeted rollback.
 *
 * PREREQ: run migrations/auth-unification/000_add_password_reset_required.sql against the auth DB first.
 *
 * Usage:
 *   node scripts/import-island-users.mjs --island=law                 # dry-run (default)
 *   node scripts/import-island-users.mjs --island=law --apply         # write (transactional)
 *   SOURCE_DATABASE_URL=... AUTH_DATABASE_URL=... node ... --island=law
 *   # If island users live in the same DB as auth (different schema), DATABASE_URL covers both.
 */
'use strict';
import pg from 'pg';
import process from 'node:process';

const { Client } = pg;
const CANONICAL_ROLES = ['viewer', 'member', 'editor', 'manager', 'admin', 'owner', 'super_admin'];

// ── Island configs (add elite-circle / insiders / trade / keycloak as those islands migrate) ──
const ISLANDS = {
  law: {
    label: 'law-service (legal.users)',
    source: { schema: 'legal', table: 'users' },
    org: { slug: 'law-elite-network', name: 'Law Elite Network', plan: 'free' },
    roleMap: { admin: 'admin', lawyer: 'editor', client: 'member' },
  },
};

// ── arg parsing ──
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  return m ? [m[1], m[2] ?? true] : [a, true];
}));
const die = (msg) => { console.error('ERROR: ' + msg); process.exit(1); };

const islandKey = args.island;
if (!islandKey || !ISLANDS[islandKey]) die(`--island=<${Object.keys(ISLANDS).join('|')}> required`);
const APPLY = args.apply === true;
const cfg = ISLANDS[islandKey];
const sourceUrl = args['source-url'] || process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
const targetUrl = args['target-url'] || process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL;
if (!sourceUrl) die('source DB url required (--source-url / SOURCE_DATABASE_URL / DATABASE_URL)');
if (!targetUrl) die('target auth DB url required (--target-url / AUTH_DATABASE_URL / DATABASE_URL)');

// ── bcrypt cost / weak-hash classifier ──
function classifyHash(hash) {
  if (!hash || typeof hash !== 'string') return { kind: 'missing', weak: true };
  const bc = hash.match(/^\$2[aby]\$(\d{2})\$/);
  if (bc) { const cost = Number(bc[1]); return { kind: `bcrypt(cost=${cost})`, weak: cost < 12 }; }
  if (hash.startsWith('$argon2')) return { kind: 'argon2', weak: false };
  if (hash.startsWith('$2')) return { kind: 'bcrypt(unknown-cost)', weak: true };
  return { kind: 'unknown', weak: true }; // PBKDF2 / Keycloak / scrypt → force reset
}

(async () => {
  console.log(`\n=== import-island-users :: island=${islandKey} :: ${APPLY ? 'APPLY (writes, transactional)' : 'DRY-RUN (no writes)'} ===`);
  for (const [from, to] of Object.entries(cfg.roleMap)) {
    if (!CANONICAL_ROLES.includes(to)) die(`roleMap ${from}->${to}: '${to}' is not a canonical role`);
  }

  const src = new Client({ connectionString: sourceUrl });
  const tgt = sourceUrl === targetUrl ? src : new Client({ connectionString: targetUrl });
  await src.connect();
  if (tgt !== src) await tgt.connect();

  const { rows: users } = await src.query(
    `SELECT id, email, password_hash, full_name, role, is_active
       FROM ${cfg.source.schema}.${cfg.source.table} ORDER BY id ASC`,
  );
  console.log(`source rows (${cfg.source.schema}.${cfg.source.table}): ${users.length}`);

  const stats = { total: users.length, importable: 0, alreadyPresent: 0, rejected: 0, forcedResets: 0 };
  const rejected = [];
  const plan = [];
  const seen = new Set();

  for (const u of users) {
    const email = (u.email || '').trim();
    const key = email.toLowerCase();
    if (!email) { rejected.push({ email: u.email, reason: 'empty_email' }); continue; }
    if (seen.has(key)) { rejected.push({ email, reason: 'duplicate_in_source' }); continue; }
    seen.add(key);
    const canonicalRole = cfg.roleMap[u.role];
    if (!canonicalRole) { rejected.push({ email, reason: `unmapped_role:${u.role}` }); continue; }

    const { rows: ex } = await tgt.query('SELECT id, password_hash FROM auth.users WHERE lower(email)=lower($1)', [email]);
    if (ex.length) {
      if (ex[0].password_hash === u.password_hash) { stats.alreadyPresent++; plan.push({ email, action: 'skip_existing', role: canonicalRole }); }
      else { rejected.push({ email, reason: 'email_exists_hash_conflict (NOT overwriting)' }); }
      continue;
    }
    const h = classifyHash(u.password_hash);
    stats.importable++;
    if (h.weak) stats.forcedResets++;
    plan.push({ email, action: 'import', role: canonicalRole, hash: h.kind, reset: h.weak, status: u.is_active === false ? 'disabled' : 'active' });
  }
  stats.rejected = rejected.length;

  for (const p of plan) {
    console.log(`  ${p.action.padEnd(13)} ${p.email}  role=${p.role || ''} ${p.hash ? 'hash=' + p.hash : ''} ${p.reset ? 'FORCE_RESET' : ''} ${p.status ? '[' + p.status + ']' : ''}`);
  }
  if (rejected.length) { console.log('\n  -- REJECTED --'); for (const r of rejected) console.log(`  REJECT ${r.email}  (${r.reason})`); }
  console.log(`\nSUMMARY island=${islandKey}: total=${stats.total} importable=${stats.importable} alreadyPresent=${stats.alreadyPresent} rejected=${stats.rejected} forcedResets=${stats.forcedResets}`);

  if (!APPLY) {
    console.log('\nDRY-RUN complete — no writes performed. Re-run with --apply to import.');
    await src.end(); if (tgt !== src) await tgt.end();
    return;
  }

  await tgt.query('BEGIN');
  try {
    const emailToId = new Map();
    for (const p of plan.filter((x) => x.action === 'import')) {
      const u = users.find((x) => (x.email || '').trim().toLowerCase() === p.email.toLowerCase());
      const { rows } = await tgt.query(
        `INSERT INTO auth.users (email, password_hash, full_name, status, password_reset_required, imported_from)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO NOTHING RETURNING id`,
        [u.email, u.password_hash, u.full_name || null, p.status, p.reset, islandKey],
      );
      if (rows[0]) emailToId.set(p.email.toLowerCase(), rows[0].id);
    }
    for (const p of plan) {
      if (!emailToId.has(p.email.toLowerCase())) {
        const { rows } = await tgt.query('SELECT id FROM auth.users WHERE lower(email)=lower($1)', [p.email]);
        if (rows[0]) emailToId.set(p.email.toLowerCase(), rows[0].id);
      }
    }
    const ownerEmail = (plan.find((p) => p.role === 'admin' && emailToId.has(p.email.toLowerCase())) || plan.find((p) => emailToId.has(p.email.toLowerCase())))?.email;
    if (!ownerEmail) throw new Error('no importable users available to own the org');
    const ownerId = emailToId.get(ownerEmail.toLowerCase());

    let { rows: orgRows } = await tgt.query('SELECT id FROM auth.organizations WHERE slug=$1', [cfg.org.slug]);
    let orgId;
    if (orgRows.length) orgId = orgRows[0].id;
    else {
      ({ rows: orgRows } = await tgt.query(
        'INSERT INTO auth.organizations (name, slug, plan, owner_id) VALUES ($1,$2,$3,$4) RETURNING id',
        [cfg.org.name, cfg.org.slug, cfg.org.plan, ownerId],
      ));
      orgId = orgRows[0].id;
    }

    let memberships = 0;
    for (const p of plan) {
      const uid = emailToId.get(p.email.toLowerCase());
      if (!uid || !p.role) continue;
      const res = await tgt.query(
        `INSERT INTO auth.team_members (org_id, user_id, role, status, joined_at)
         VALUES ($1,$2,$3,'active',NOW()) ON CONFLICT (org_id,user_id) DO NOTHING`,
        [orgId, uid, p.role],
      );
      memberships += res.rowCount;
    }
    await tgt.query('COMMIT');
    console.log(`\nAPPLIED: org=${cfg.org.slug}(${orgId}) usersInserted=${stats.importable} membershipsInserted=${memberships}`);
  } catch (e) {
    await tgt.query('ROLLBACK');
    die('APPLY failed — transaction ROLLED BACK: ' + e.message);
  }
  await src.end(); if (tgt !== src) await tgt.end();
})().catch((e) => die(e.message));

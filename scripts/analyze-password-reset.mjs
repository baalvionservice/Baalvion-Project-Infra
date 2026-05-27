#!/usr/bin/env node
/**
 * analyze-password-reset.mjs — Auth-unification A5: classify imported island users' password
 * hashes and mark `password_reset_required = TRUE` for WEAK hashes ONLY.
 *
 * Weak = bcrypt cost < 12, bcrypt of unknown cost, or any non-bcrypt/unknown scheme
 *        (e.g. Keycloak PBKDF2, scrypt). Safe = argon2 / bcrypt cost >= 12.
 *
 * SAFETY: DRY-RUN is the DEFAULT (pass --apply to write). Idempotent. Hashes are NEVER modified —
 * only the boolean flag is set, so existing passwords keep working until the user voluntarily
 * resets. NEVER sends emails. Reusable across islands (law / elite-circle / insiders / keycloak).
 *
 * Usage:
 *   node scripts/analyze-password-reset.mjs --island=law            # dry-run report
 *   node scripts/analyze-password-reset.mjs --island=law --apply    # mark weak users
 */
'use strict';
import pg from 'pg';
import process from 'node:process';

const { Client } = pg;
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  return m ? [m[1], m[2] ?? true] : [a, true];
}));
const die = (m) => { console.error('ERROR: ' + m); process.exit(1); };

const island = args.island;
const APPLY = args.apply === true;
const url = args['target-url'] || process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL;
if (!island) die('--island=<law|elite-circle|insiders|keycloak> required');
if (!url) die('auth DB url required (--target-url / AUTH_DATABASE_URL / DATABASE_URL)');

function classify(hash) {
  if (!hash || typeof hash !== 'string') return { kind: 'missing', weak: true };
  const bc = hash.match(/^\$2[aby]\$(\d{2})\$/);
  if (bc) { const c = Number(bc[1]); return { kind: `bcrypt(cost=${c})`, weak: c < 12 }; }
  if (hash.startsWith('$argon2')) return { kind: 'argon2', weak: false };
  if (hash.startsWith('$2')) return { kind: 'bcrypt(unknown-cost)', weak: true };
  return { kind: 'unknown', weak: true };
}

(async () => {
  console.log(`\n=== analyze-password-reset :: island=${island} :: ${APPLY ? 'APPLY (marks weak)' : 'DRY-RUN (no writes)'} ===`);
  const c = new Client({ connectionString: url });
  await c.connect();
  const { rows } = await c.query(
    'SELECT id, email, password_hash, password_reset_required FROM auth.users WHERE imported_from = $1 ORDER BY id ASC',
    [island],
  );
  const stats = { total: rows.length, safe: 0, weak: 0, alreadyFlagged: 0, byKind: {} };
  const weakIds = [];
  for (const u of rows) {
    const k = classify(u.password_hash);
    stats.byKind[k.kind] = (stats.byKind[k.kind] || 0) + 1;
    if (k.weak) { stats.weak++; weakIds.push(u.id); } else stats.safe++;
    if (u.password_reset_required) stats.alreadyFlagged++;
  }
  console.log(`total=${stats.total}  safe=${stats.safe}  weak(forceReset)=${stats.weak}  alreadyFlagged=${stats.alreadyFlagged}`);
  console.log('by hash kind:', JSON.stringify(stats.byKind));

  if (APPLY && weakIds.length) {
    const res = await c.query(
      'UPDATE auth.users SET password_reset_required = TRUE WHERE id = ANY($1::bigint[]) AND imported_from = $2',
      [weakIds, island],
    );
    console.log(`APPLIED: password_reset_required=TRUE for ${res.rowCount} weak users (idempotent; hashes untouched).`);
  } else if (!APPLY) {
    console.log('DRY-RUN — no writes. Re-run with --apply to mark weak users.');
  }
  console.log('NOTE: NO emails sent (per policy). Existing passwords keep working until reset.');
  await c.end();
})().catch((e) => die(e.message));

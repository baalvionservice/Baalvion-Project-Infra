#!/usr/bin/env node
/**
 * Phase 4 — Task 1: DATABASE SNAPSHOT (PREPARE-ONLY tool; operator runs it).
 *
 * Exports an island's identity tables to a versioned, checksummed .sql file, records
 * row counts, and (with --verify-restore) restores into a throwaway DB and re-counts.
 *
 *   node scripts/auth-unification/snapshot-island.mjs --island elite-circle            # dry-run (prints plan)
 *   node scripts/auth-unification/snapshot-island.mjs --island elite-circle --execute  # writes the dump + manifest
 *   node scripts/auth-unification/snapshot-island.mjs --island elite-circle --verify-restore --execute
 *
 * Requires `pg_dump` / `psql` on PATH (or run inside the postgres container) and DB_*
 * env (DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD). NOTHING is written without --execute.
 * Snapshots are data dumps — keep them OUT of git (see .gitignore in the output dir).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { getIsland } from './islands.config.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : undefined; };
const islandName = opt('--island');
const execute = !!opt('--execute');
const verifyRestore = !!opt('--verify-restore');
if (!islandName) { console.error('Missing --island <name>'); process.exit(2); }

const spec = getIsland(islandName);
const db = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  name: process.env.DB_NAME || 'baalvion_db',
  user: process.env.DB_USER || 'baalvion',
  pass: process.env.DB_PASSWORD || '',
};
const env = { ...process.env, PGPASSWORD: db.pass };
const psql = (sql, dbname = db.name) =>
  execFileSync('psql', ['-h', db.host, '-p', db.port, '-U', db.user, '-d', dbname, '-tAc', sql], { env, encoding: 'utf8' }).trim();

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = opt('--out') || 'Backend/database/migrations/auth-unification';
const outFile = path.join(outDir, `${islandName}-snapshot-${ts}.sql`);
const manifestFile = path.join(outDir, `${islandName}-snapshot-${ts}.manifest.json`);
const tableArgs = spec.authTables.flatMap((t) => ['-t', `${spec.schema}.${t}`]);

console.log(`[snapshot] island=${islandName} schema=${spec.schema} tables=${spec.authTables.join(',')}`);
console.log(`[snapshot] DB=${db.user}@${db.host}:${db.port}/${db.name}`);
console.log(`[snapshot] pg_dump ${['-h', db.host, '-p', db.port, '-U', db.user, '-d', db.name, ...tableArgs, '--no-owner', '--no-privileges', '-f', outFile].join(' ')}`);

if (!execute) { console.log('\n[dry-run] no files written. Re-run with --execute.'); process.exit(0); }

mkdirSync(outDir, { recursive: true });
// keep dumps out of git
const gi = path.join(outDir, '.gitignore');
// Atomic create-if-absent (flag 'wx') avoids a TOCTOU race between checking
// existence and writing; EEXIST means an existing .gitignore is left untouched.
try {
  writeFileSync(gi, '*.sql\n*.manifest.json\n', { flag: 'wx' });
} catch (err) {
  if (err.code !== 'EEXIST') throw err;
}

// 1 — row counts (pre-dump)
const counts = {};
for (const t of spec.authTables) counts[t] = Number(psql(`SELECT count(*) FROM ${spec.schema}.${t}`));

// 2 — dump
execFileSync('pg_dump', ['-h', db.host, '-p', db.port, '-U', db.user, '-d', db.name, ...tableArgs, '--no-owner', '--no-privileges', '-f', outFile], { env, stdio: 'inherit' });
const checksum = createHash('sha256').update(readFileSync(outFile)).digest('hex');

// 3 — optional restore verification into a throwaway DB
let restore = null;
if (verifyRestore) {
  const tmp = `verify_${islandName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`;
  try {
    execFileSync('createdb', ['-h', db.host, '-p', db.port, '-U', db.user, tmp], { env, stdio: 'inherit' });
    execFileSync('psql', ['-h', db.host, '-p', db.port, '-U', db.user, '-d', tmp, '-f', outFile], { env, stdio: 'inherit' });
    const rc = {};
    for (const t of spec.authTables) rc[t] = Number(psql(`SELECT count(*) FROM ${spec.schema}.${t}`, tmp));
    restore = { db: tmp, counts: rc, matches: JSON.stringify(rc) === JSON.stringify(counts) };
  } finally {
    try { execFileSync('dropdb', ['-h', db.host, '-p', db.port, '-U', db.user, tmp], { env, stdio: 'inherit' }); } catch { /* leave for inspection */ }
  }
}

const manifest = { island: islandName, schema: spec.schema, createdAt: ts, file: outFile, sha256: checksum, rowCounts: counts, restoreVerify: restore };
writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
console.log('\n[snapshot] manifest:\n' + JSON.stringify(manifest, null, 2));
if (verifyRestore && restore && !restore.matches) { console.error('\n[snapshot] ✗ RESTORE ROW COUNTS DO NOT MATCH — do not continue.'); process.exit(1); }
console.log('\n[snapshot] ✓ done.' + (verifyRestore ? ' Restore verified.' : ' Run --verify-restore before continuing.'));

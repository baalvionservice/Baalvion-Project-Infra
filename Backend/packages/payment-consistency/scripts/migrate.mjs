#!/usr/bin/env node
/**
 * PCL migration runner.
 *
 * PCL is a package, not a service, so it owns no database of its own — the `pcl` schema is
 * created inside whichever service's database consumes it. That keeps the platform's "one
 * service = one DB" rule intact: each service holds its own local payment truth, and the
 * cross-estate view is assembled from `payment.recorded` events, never by reading another
 * service's tables.
 *
 * Consuming services append this to their own migrate script:
 *
 *   "migrate": "<their own migrations> && node ../../../packages/payment-consistency/scripts/migrate.mjs"
 *
 * Applied files are tracked in pcl.schema_migrations, so re-running is a no-op. Each file runs
 * inside a transaction: a failure rolls the whole file back rather than leaving half a schema.
 *
 * Usage:
 *   node scripts/migrate.mjs                 # apply pending migrations
 *   node scripts/migrate.mjs --dry-run       # list what would be applied, touch nothing
 *   node scripts/migrate.mjs --status        # show applied vs pending
 *
 * Connection comes from DATABASE_URL, or the usual PG* / DB_* variables the fleet already sets.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const STATUS_ONLY = args.has('--status');

function log(msg) { console.log(`[pcl-migrate] ${msg}`); }
function fail(msg) { console.error(`[pcl-migrate] ${msg}`); process.exit(1); }

function connectionConfig() {
  const url = process.env.PCL_DATABASE_URL || process.env.DATABASE_URL;
  if (url) return { connectionString: url };
  const host = process.env.PGHOST || process.env.DB_HOST;
  const database = process.env.PGDATABASE || process.env.DB_NAME;
  const user = process.env.PGUSER || process.env.DB_USER;
  if (!host || !database || !user) {
    fail('No database connection configured. Set DATABASE_URL, or PGHOST/PGDATABASE/PGUSER (or DB_HOST/DB_NAME/DB_USER).');
  }
  return {
    host,
    database,
    user,
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
    port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
  };
}

function migrationFiles() {
  // Lexical order is the apply order, which is why files are numbered.
  return readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
}

// `pg` belongs to the consuming service, not to this package, so resolve it from the caller's
// working directory first and only then from here.
let pg;
try {
  const requireFromCaller = createRequire(join(process.cwd(), 'package.json'));
  pg = requireFromCaller('pg');
} catch {
  try {
    pg = (await import('pg')).default;
  } catch {
    fail('Could not resolve `pg`. Run this from a service that depends on pg (its own directory as cwd).');
  }
}

const client = new pg.Client(connectionConfig());
try {
  await client.connect();
} catch (err) {
  fail(`Could not connect: ${err.message}`);
}

try {
  // The ledger of what has run. Created outside the per-file transactions so a failed
  // migration still leaves the ledger intact.
  await client.query('CREATE SCHEMA IF NOT EXISTS pcl');
  await client.query(`
    CREATE TABLE IF NOT EXISTS pcl.schema_migrations (
      filename    varchar(255) PRIMARY KEY,
      checksum    char(64)     NOT NULL,
      applied_at  timestamptz  NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await client.query('SELECT filename, checksum FROM pcl.schema_migrations');
  const applied = new Map(rows.map((r) => [r.filename, r.checksum]));
  const files = migrationFiles();

  if (files.length === 0) fail(`No .sql files found in ${migrationsDir}`);

  const pending = [];
  for (const filename of files) {
    const sql = readFileSync(join(migrationsDir, filename), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const prior = applied.get(filename);
    if (prior === undefined) {
      pending.push({ filename, sql, checksum });
    } else if (prior !== checksum) {
      // An edited migration would silently diverge environments — refuse rather than guess.
      fail(`${filename} has changed since it was applied. Add a new migration instead of editing one that has run.`);
    }
  }

  if (STATUS_ONLY) {
    for (const f of files) log(`${applied.has(f) ? 'applied' : 'PENDING'}  ${f}`);
    log(`${applied.size} applied, ${pending.length} pending`);
    process.exit(0);
  }

  if (pending.length === 0) {
    log(`up to date (${applied.size} migration${applied.size === 1 ? '' : 's'} applied)`);
    process.exit(0);
  }

  if (DRY_RUN) {
    for (const p of pending) log(`would apply  ${p.filename}`);
    log(`${pending.length} pending, nothing written (--dry-run)`);
    process.exit(0);
  }

  for (const { filename, sql, checksum } of pending) {
    // One transaction per file. The SQL runs as a single batch, so DO $$ ... $$ blocks and
    // multi-statement files work without any fragile splitting on semicolons.
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO pcl.schema_migrations (filename, checksum) VALUES ($1, $2)',
        [filename, checksum],
      );
      await client.query('COMMIT');
      log(`applied  ${filename}`);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      fail(`${filename} failed and was rolled back: ${err.message}`);
    }
  }
  log(`done — ${pending.length} migration${pending.length === 1 ? '' : 's'} applied`);
} finally {
  await client.end().catch(() => {});
}

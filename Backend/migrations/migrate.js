#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'baalvion_db',
  user: process.env.DB_USER || 'baalvion',
  password: process.env.DB_PASSWORD || 'baalvion_dev_pass',
};

const MIGRATIONS_DIR = __dirname;
const TRACKING_TABLE = 'public.schema_migrations';

async function connect() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  return client;
}

async function ensureTrackingTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
      id            SERIAL PRIMARY KEY,
      filename      VARCHAR(500) NOT NULL UNIQUE,
      applied_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
      checksum      VARCHAR(64),
      execution_ms  INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename
      ON ${TRACKING_TABLE} (filename);
  `);
}

async function getApplied(client) {
  const { rows } = await client.query(
    `SELECT filename FROM ${TRACKING_TABLE} ORDER BY filename`
  );
  return new Set(rows.map((r) => r.filename));
}

function getMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.match(/^\d{3}_.*\.sql$/) && !f.endsWith('.down.sql'))
    .sort();
}

function getDownFile(upFile) {
  return upFile.replace(/\.sql$/, '.down.sql');
}

function checksum(content) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 64);
}

async function runMigration(client, filename, dryRun) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filepath, 'utf8');
  const hash = checksum(sql);

  if (dryRun) {
    console.log(`[DRY-RUN] Would apply: ${filename}`);
    return;
  }

  console.log(`Applying: ${filename}`);
  const start = Date.now();

  await client.query('BEGIN');
  try {
    await client.query(sql);
    const ms = Date.now() - start;
    await client.query(
      `INSERT INTO ${TRACKING_TABLE} (filename, checksum, execution_ms)
       VALUES ($1, $2, $3)
       ON CONFLICT (filename) DO UPDATE
         SET applied_at = now(), checksum = $2, execution_ms = $3`,
      [filename, hash, ms]
    );
    await client.query('COMMIT');
    console.log(`  ✓ Applied in ${ms}ms`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw new Error(`Migration ${filename} failed: ${err.message}`);
  }
}

async function rollback(client, count, dryRun) {
  const { rows } = await client.query(
    `SELECT filename FROM ${TRACKING_TABLE} ORDER BY filename DESC LIMIT $1`,
    [count]
  );

  if (rows.length === 0) {
    console.log('No applied migrations to roll back.');
    return;
  }

  for (const { filename } of rows) {
    const downFile = getDownFile(filename);
    const downPath = path.join(MIGRATIONS_DIR, downFile);

    if (!fs.existsSync(downPath)) {
      console.warn(`  ⚠  No rollback file for ${filename} (${downFile} missing) — skipping`);
      continue;
    }

    const sql = fs.readFileSync(downPath, 'utf8');

    if (dryRun) {
      console.log(`[DRY-RUN] Would rollback: ${filename}`);
      continue;
    }

    console.log(`Rolling back: ${filename}`);
    const start = Date.now();
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(`DELETE FROM ${TRACKING_TABLE} WHERE filename = $1`, [filename]);
      await client.query('COMMIT');
      console.log(`  ✓ Rolled back in ${Date.now() - start}ms`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Rollback of ${filename} failed: ${err.message}`);
    }
  }
}

async function status(client) {
  const applied = await getApplied(client);
  const files = getMigrationFiles();

  console.log('\nMigration Status:');
  console.log('─'.repeat(60));
  for (const f of files) {
    const state = applied.has(f) ? '✓ applied' : '○ pending';
    console.log(`  ${state}  ${f}`);
  }
  const pending = files.filter((f) => !applied.has(f));
  console.log('─'.repeat(60));
  console.log(`  ${applied.size} applied, ${pending.length} pending\n`);
}

async function validate(client) {
  const { rows } = await client.query(
    `SELECT filename, checksum FROM ${TRACKING_TABLE} ORDER BY filename`
  );

  let allValid = true;
  for (const { filename, checksum: stored } of rows) {
    const filepath = path.join(MIGRATIONS_DIR, filename);
    if (!fs.existsSync(filepath)) {
      console.warn(`  ⚠  Applied migration file missing on disk: ${filename}`);
      allValid = false;
      continue;
    }
    const current = checksum(fs.readFileSync(filepath, 'utf8'));
    if (stored && current !== stored) {
      console.error(`  ✗  Checksum mismatch: ${filename} (file was modified after application)`);
      allValid = false;
    } else {
      console.log(`  ✓  ${filename}`);
    }
  }
  if (allValid) console.log('\n  All applied migrations are valid.\n');
  else process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'up';
  const dryRun = args.includes('--dry-run');
  const rollbackCount = command === 'rollback' ? parseInt(args[1] || '1', 10) : 0;

  const client = await connect();

  try {
    await ensureTrackingTable(client);

    if (command === 'status') {
      await status(client);
      return;
    }

    if (command === 'validate') {
      await validate(client);
      return;
    }

    if (command === 'rollback') {
      await rollback(client, rollbackCount, dryRun);
      return;
    }

    // Default: up — apply all pending migrations
    const applied = await getApplied(client);
    const files = getMigrationFiles();
    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log('All migrations are already applied.');
      return;
    }

    console.log(`\nApplying ${pending.length} pending migration(s)...\n`);
    for (const f of pending) {
      await runMigration(client, f, dryRun);
    }
    console.log('\nDone.\n');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});

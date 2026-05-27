#!/usr/bin/env node
/**
 * Phase 4 — Task 2: PASSWORD HASH ANALYSIS (PREPARE-ONLY, read-only; operator runs it).
 *
 *   node scripts/auth-unification/analyze-island-hashes.mjs --island elite-circle
 *
 * Read-only SELECT of the island's password hashes; classifies each and flags WEAK ones
 * (bcrypt < 12, unknown, malformed) for forced password reset. Requires `pg` and DB_* env.
 * Hashes are NEVER printed or upgraded — only their format is inspected.
 *
 * Classification (Task 2):
 *   SAFE: argon2id, bcrypt cost >= 12
 *   WEAK: bcrypt cost < 12, unknown format, malformed
 */
import { getIsland } from './islands.config.mjs';

const args = process.argv.slice(2);
const islandName = args[args.indexOf('--island') + 1];
if (!islandName || islandName.startsWith('--')) { console.error('Missing --island <name>'); process.exit(2); }
const spec = getIsland(islandName);

function classify(hash) {
  if (!hash || typeof hash !== 'string') return { type: 'malformed', safe: false };
  if (hash.startsWith('$argon2id$')) return { type: 'argon2id', safe: true };
  if (hash.startsWith('$argon2')) return { type: 'argon2(other)', safe: true };
  const m = /^\$2[aby]\$(\d{2})\$/.exec(hash);
  if (m) { const cost = Number(m[1]); return { type: `bcrypt-${cost}`, safe: cost >= 12 }; }
  return { type: 'unknown', safe: false };
}

const { Client } = await import('pg');
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'baalvion_db',
  user: process.env.DB_USER || 'baalvion',
  password: process.env.DB_PASSWORD || '',
});

await client.connect();
try {
  const { rows } = await client.query(
    `SELECT id, ${spec.emailColumn} AS email, ${spec.hashColumn} AS hash FROM ${spec.schema}.${spec.userTable}`,
  );
  const buckets = {};
  const weakUsers = [];
  for (const r of rows) {
    const c = classify(r.hash);
    buckets[c.type] = (buckets[c.type] || 0) + 1;
    if (!c.safe) weakUsers.push({ id: r.id, email: r.email, type: c.type });
  }
  console.log(`\n[hash-analysis] island=${islandName} schema=${spec.schema} users=${rows.length}\n`);
  console.log('| count | hash type | action |');
  console.log('|------:|-----------|--------|');
  for (const [type, n] of Object.entries(buckets).sort((a, b) => b[1] - a[1])) {
    const safe = classify(type.startsWith('bcrypt') ? `$2b$${type.split('-')[1]}$x` : (type === 'argon2id' ? '$argon2id$x' : 'x')).safe;
    console.log(`| ${n} | ${type} | ${safe ? 'keep' : 'FORCE RESET'} |`);
  }
  console.log(`\nWeak/forced-reset users: ${weakUsers.length} of ${rows.length}`);
  if (weakUsers.length) {
    const out = `Backend/database/migrations/auth-unification/${islandName}-weak-hashes.json`;
    const { writeFileSync, mkdirSync } = await import('node:fs');
    mkdirSync('Backend/database/migrations/auth-unification', { recursive: true });
    writeFileSync(out, JSON.stringify(weakUsers, null, 2));
    console.log(`Wrote forced-reset list → ${out} (emails only; NO hashes).`);
  }
} finally {
  await client.end();
}

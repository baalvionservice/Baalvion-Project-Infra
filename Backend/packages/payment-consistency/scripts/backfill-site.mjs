#!/usr/bin/env node
/**
 * Backfill `site_id` (and optionally `rail`) on historical payment rows.
 *
 * Migration 002 added these columns as nullable on purpose: making them NOT NULL before the
 * data existed would have made every legacy writer start failing captures. This fills the gap
 * so the constraint can eventually be added — and so historical payments appear on the
 * cross-estate panel instead of being invisible.
 *
 * Each service's `pcl` schema belongs to exactly one property, which is what makes this safe:
 * the site is not being inferred per row, it is being stated once by the operator running it
 * against that service's own database.
 *
 * Usage, from the service directory whose database is being filled:
 *   node <pcl>/scripts/backfill-site.mjs --site-id=amarise --dry-run
 *   node <pcl>/scripts/backfill-site.mjs --site-id=amarise --rail=razorpay
 *
 * Always reports before it writes, and never overwrites a value already present — the first
 * writer to attribute a payment wins, and a backfill is not a writer.
 */
import { createRequire } from 'node:module';
import { join } from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const has = (name) => args.includes(`--${name}`);

const SITE_ID = flag('site-id');
const RAIL = flag('rail');
const SCHEMA = flag('schema') || 'pcl';
const DRY_RUN = has('dry-run');

function log(m) { console.log(`[pcl-backfill] ${m}`); }
function fail(m) { console.error(`[pcl-backfill] ${m}`); process.exit(1); }

if (!SITE_ID) {
  fail('--site-id is required. Run this from the service whose database you are filling, and state its property explicitly — it is never inferred per row.');
}

let pg;
try {
  pg = createRequire(join(process.cwd(), 'package.json'))('pg');
} catch {
  fail('Could not resolve `pg`. Run this from a service directory that depends on it.');
}

const url = process.env.PCL_DATABASE_URL || process.env.DATABASE_URL;
const client = new pg.Client(url ? { connectionString: url } : {
  host: process.env.PGHOST || process.env.DB_HOST,
  database: process.env.PGDATABASE || process.env.DB_NAME,
  user: process.env.PGUSER || process.env.DB_USER,
  password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
  port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
});

try {
  await client.connect();
} catch (err) {
  fail(`Could not connect: ${err.message}`);
}

try {
  const q = (sql, params) => client.query(sql, params);

  const { rows: [before] } = await q(`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE site_id IS NULL)::int AS no_site,
           COUNT(*) FILTER (WHERE rail IS NULL)::int    AS no_rail,
           COUNT(DISTINCT site_id) FILTER (WHERE site_id IS NOT NULL)::int AS sites
      FROM ${SCHEMA}.payment_state`);

  log(`${before.total} payment rows · ${before.no_site} without a site · ${before.no_rail} without a rail`);

  if (before.sites > 1) {
    // Two different sites in one service's schema breaks the assumption this script rests on.
    const { rows } = await q(`SELECT site_id, COUNT(*)::int AS n FROM ${SCHEMA}.payment_state WHERE site_id IS NOT NULL GROUP BY site_id`);
    fail(`This schema already holds ${before.sites} sites (${rows.map((r) => `${r.site_id}=${r.n}`).join(', ')}). A blanket backfill would mislabel some of them — fill them individually instead.`);
  }
  if (before.sites === 1) {
    const { rows: [existing] } = await q(`SELECT DISTINCT site_id FROM ${SCHEMA}.payment_state WHERE site_id IS NOT NULL LIMIT 1`);
    if (existing.site_id !== SITE_ID) {
      fail(`Rows here are already attributed to "${existing.site_id}", but --site-id says "${SITE_ID}". Refusing rather than relabelling real payments.`);
    }
  }
  if (before.no_site === 0 && (!RAIL || before.no_rail === 0)) {
    log('nothing to backfill');
    process.exit(0);
  }

  if (DRY_RUN) {
    log(`would set site_id='${SITE_ID}' on ${before.no_site} row(s)`);
    if (RAIL) log(`would set rail='${RAIL}' on ${before.no_rail} row(s)`);
    log('nothing written (--dry-run)');
    process.exit(0);
  }

  await q('BEGIN');
  // COALESCE, not a blanket SET: a row that already carries an attribution keeps it.
  const site = await q(
    `UPDATE ${SCHEMA}.payment_state SET site_id = $1, updated_at = now() WHERE site_id IS NULL`, [SITE_ID]);
  const outbox = await q(
    `UPDATE ${SCHEMA}.payment_outbox SET site_id = $1 WHERE site_id IS NULL`, [SITE_ID]);
  let rail = { rowCount: 0 };
  if (RAIL) {
    rail = await q(`UPDATE ${SCHEMA}.payment_state SET rail = $1, updated_at = now() WHERE rail IS NULL`, [RAIL]);
  }
  await q('COMMIT');

  log(`site_id set on ${site.rowCount} payment row(s) and ${outbox.rowCount} outbox row(s)`);
  if (RAIL) log(`rail set on ${rail.rowCount} row(s)`);

  const { rows: [after] } = await q(`
    SELECT COUNT(*) FILTER (WHERE site_id IS NULL)::int AS no_site,
           COUNT(*) FILTER (WHERE rail IS NULL)::int    AS no_rail
      FROM ${SCHEMA}.payment_state`);
  log(`remaining: ${after.no_site} without a site, ${after.no_rail} without a rail`);
  if (after.no_site === 0 && after.no_rail === 0) {
    log('this schema is now fully attributed — a later migration may set these NOT NULL');
  }
} catch (err) {
  await client.query('ROLLBACK').catch(() => {});
  fail(`backfill failed and was rolled back: ${err.message}`);
} finally {
  await client.end().catch(() => {});
}

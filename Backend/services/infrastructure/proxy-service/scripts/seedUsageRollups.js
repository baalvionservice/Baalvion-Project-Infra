'use strict';

/**
 * Creates and backfills the daily/hourly usage rollup tables that the analytics,
 * forecasting, finance and intelligence engines query but which are not Sequelize
 * models (so `sync()` never creates them):
 *   - org_usage_daily      (per-org daily bandwidth/requests/failures/latency)
 *   - provider_usage_daily (per-org/provider daily bandwidth/requests)
 *   - geo_usage_hourly     (per-org/country bucketed requests/bytes)
 *
 * In production these are maintained by a rollup worker; for dev/staging this script
 * stands in for that pipeline. Idempotent: creates IF NOT EXISTS and only backfills
 * when a table is empty. Run: `node scripts/seedUsageRollups.js`.
 */

const db = require('../models');

const GB = 1_000_000_000;
const PROVIDERS = ['Bright Data', 'Oxylabs', 'Smartproxy'];
const COUNTRIES = ['US', 'GB', 'DE', 'BR', 'IN', 'JP', 'SG', 'CA', 'FR', 'AU'];
const DAYS = 30;

// Deterministic pseudo-random so reruns/backfills are stable per (seed).
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

async function createTables() {
  await db.sequelize.query(`
    CREATE TABLE IF NOT EXISTS org_usage_daily (
      org_id UUID NOT NULL,
      bucket TIMESTAMPTZ NOT NULL,
      bytes_total BIGINT NOT NULL DEFAULT 0,
      requests BIGINT NOT NULL DEFAULT 0,
      failures BIGINT NOT NULL DEFAULT 0,
      avg_latency NUMERIC NOT NULL DEFAULT 0,
      PRIMARY KEY (org_id, bucket)
    );
    CREATE INDEX IF NOT EXISTS idx_org_usage_daily_org_bucket ON org_usage_daily(org_id, bucket);

    CREATE TABLE IF NOT EXISTS provider_usage_daily (
      org_id UUID NOT NULL,
      provider TEXT NOT NULL,
      bucket TIMESTAMPTZ NOT NULL,
      bytes_total BIGINT NOT NULL DEFAULT 0,
      requests BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (org_id, provider, bucket)
    );
    CREATE INDEX IF NOT EXISTS idx_provider_usage_daily_org_bucket ON provider_usage_daily(org_id, bucket);
    CREATE INDEX IF NOT EXISTS idx_provider_usage_daily_provider ON provider_usage_daily(provider, bucket);

    CREATE TABLE IF NOT EXISTS geo_usage_hourly (
      org_id UUID NOT NULL,
      bucket TIMESTAMPTZ NOT NULL,
      country TEXT NOT NULL,
      requests BIGINT NOT NULL DEFAULT 0,
      bytes_total BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (org_id, bucket, country)
    );
    CREATE INDEX IF NOT EXISTS idx_geo_usage_hourly_org_bucket ON geo_usage_hourly(org_id, bucket);

    CREATE TABLE IF NOT EXISTS org_usage_hourly (
      org_id UUID NOT NULL,
      bucket TIMESTAMPTZ NOT NULL,
      bytes_total BIGINT NOT NULL DEFAULT 0,
      requests BIGINT NOT NULL DEFAULT 0,
      failures BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (org_id, bucket)
    );
    CREATE INDEX IF NOT EXISTS idx_org_usage_hourly_org_bucket ON org_usage_hourly(org_id, bucket);

    -- Raw per-request telemetry (TimescaleDB hypertable in prod; plain table for dev).
    CREATE TABLE IF NOT EXISTS usage_events (
      id BIGSERIAL PRIMARY KEY,
      org_id UUID NOT NULL,
      ts TIMESTAMPTZ NOT NULL DEFAULT now(),
      provider TEXT,
      country TEXT,
      dest_host TEXT,
      target_class TEXT,
      status INTEGER,
      success BOOLEAN NOT NULL DEFAULT TRUE,
      latency_ms INTEGER NOT NULL DEFAULT 0,
      bytes_in BIGINT NOT NULL DEFAULT 0,
      bytes_out BIGINT NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_usage_events_org_ts ON usage_events(org_id, ts);
    CREATE INDEX IF NOT EXISTS idx_usage_events_ts ON usage_events(ts);
  `);
}

async function isEmpty(table) {
  const [[{ n }]] = await db.sequelize.query(`SELECT COUNT(*)::int AS n FROM ${table}`);
  return n === 0;
}

async function backfill() {
  const [orgs] = await db.sequelize.query('SELECT id FROM organizations ORDER BY id');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orgRows = [];
  const provRows = [];
  const geoRows = [];

  orgs.forEach((o, oi) => {
    const rand = rng(0x1234 + oi * 97);
    const base = 40 + Math.floor(rand() * 160); // base daily GB per org
    for (let d = DAYS - 1; d >= 0; d--) {
      const day = new Date(today.getTime() - d * 86_400_000);
      const wave = 1 + 0.35 * Math.sin((DAYS - d) / 4) + (rand() - 0.5) * 0.3;
      const gb = Math.max(1, base * wave);
      const bytes = Math.round(gb * GB);
      const requests = Math.round(gb * (1500 + rand() * 800));
      const failures = Math.round(requests * (0.005 + rand() * 0.02));
      const avgLatency = Math.round(45 + rand() * 90);
      orgRows.push(`('${o.id}','${day.toISOString()}',${bytes},${requests},${failures},${avgLatency})`);

      // split across providers
      const weights = PROVIDERS.map(() => 0.5 + rand());
      const wsum = weights.reduce((a, b) => a + b, 0);
      PROVIDERS.forEach((p, pi) => {
        const share = weights[pi] / wsum;
        provRows.push(`('${o.id}','${p.replace(/'/g, "''")}','${day.toISOString()}',${Math.round(bytes * share)},${Math.round(requests * share)})`);
      });

      // geo buckets: last 7 days only, top countries
      if (d < 7) {
        const gw = COUNTRIES.map(() => rand());
        const gsum = gw.reduce((a, b) => a + b, 0);
        COUNTRIES.slice(0, 6).forEach((c, ci) => {
          const share = gw[ci] / gsum;
          geoRows.push(`('${o.id}','${day.toISOString()}','${c}',${Math.round(requests * share)},${Math.round(bytes * share)})`);
        });
      }
    }
  });

  if (orgRows.length) {
    await db.sequelize.query(
      `INSERT INTO org_usage_daily (org_id,bucket,bytes_total,requests,failures,avg_latency) VALUES ${orgRows.join(',')}
       ON CONFLICT (org_id,bucket) DO NOTHING`);
  }
  if (provRows.length) {
    await db.sequelize.query(
      `INSERT INTO provider_usage_daily (org_id,provider,bucket,bytes_total,requests) VALUES ${provRows.join(',')}
       ON CONFLICT (org_id,provider,bucket) DO NOTHING`);
  }
  if (geoRows.length) {
    await db.sequelize.query(
      `INSERT INTO geo_usage_hourly (org_id,bucket,country,requests,bytes_total) VALUES ${geoRows.join(',')}
       ON CONFLICT (org_id,bucket,country) DO NOTHING`);
  }
  return { orgRows: orgRows.length, provRows: provRows.length, geoRows: geoRows.length };
}

// Recent raw events (last 48h) + hourly org rollups (last 7d) for sla-risk,
// anomaly detection and ML feature engineering.
async function backfillEventsAndHourly() {
  const [orgs] = await db.sequelize.query('SELECT id FROM organizations ORDER BY id');
  const now = Date.now();
  const evRows = [];
  const hourRows = [];

  orgs.forEach((o, oi) => {
    const rand = rng(0xBEEF + oi * 31);
    // 250 events per org across the last 48h
    for (let i = 0; i < 250; i++) {
      const ts = new Date(now - Math.floor(rand() * 48 * 3_600_000)).toISOString();
      const provider = PROVIDERS[Math.floor(rand() * PROVIDERS.length)].replace(/'/g, "''");
      const country = COUNTRIES[Math.floor(rand() * COUNTRIES.length)];
      const roll = rand();
      const status = roll > 0.97 ? 500 : roll > 0.93 ? 429 : roll > 0.9 ? 403 : 200;
      const success = status < 400;
      const latency = Math.round(40 + rand() * 260);
      const bin = Math.round(2000 + rand() * 80_000);
      const bout = Math.round(500 + rand() * 20_000);
      const host = ['example.com', 'shop.example.io', 'api.target.dev', 'serp.search.co'][Math.floor(rand() * 4)];
      evRows.push(`('${o.id}','${ts}','${provider}','${country}','${host}','${provider}|${country}|${host}',${status},${success},${latency},${bin},${bout})`);
    }
    // hourly rollups for last 7 days
    const base = 1 + Math.floor(rand() * 4); // GB/hour base
    for (let h = 7 * 24 - 1; h >= 0; h--) {
      const bucket = new Date(now - h * 3_600_000);
      bucket.setMinutes(0, 0, 0);
      const gb = Math.max(0.1, base * (0.6 + rand() * 0.9));
      const bytes = Math.round(gb * GB);
      const requests = Math.round(gb * (1200 + rand() * 600));
      const failures = Math.round(requests * (0.005 + rand() * 0.02));
      hourRows.push(`('${o.id}','${bucket.toISOString()}',${bytes},${requests},${failures})`);
    }
  });

  if (evRows.length) {
    await db.sequelize.query(
      `INSERT INTO usage_events (org_id,ts,provider,country,dest_host,target_class,status,success,latency_ms,bytes_in,bytes_out) VALUES ${evRows.join(',')}`);
  }
  if (hourRows.length) {
    await db.sequelize.query(
      `INSERT INTO org_usage_hourly (org_id,bucket,bytes_total,requests,failures) VALUES ${hourRows.join(',')}
       ON CONFLICT (org_id,bucket) DO NOTHING`);
  }
  return { events: evRows.length, hourly: hourRows.length };
}

async function main() {
  try {
    await db.sequelize.authenticate();
    console.log('DB connected. Creating rollup tables...');
    await createTables();
    const empties = {
      org_usage_daily: await isEmpty('org_usage_daily'),
      provider_usage_daily: await isEmpty('provider_usage_daily'),
      geo_usage_hourly: await isEmpty('geo_usage_hourly'),
    };
    if (Object.values(empties).some(Boolean)) {
      console.log('Backfilling 30 days of rollups...');
      const counts = await backfill();
      console.log('Inserted:', counts);
    } else {
      console.log('Daily rollup tables already populated, skipping backfill.');
    }
    if (await isEmpty('usage_events') || await isEmpty('org_usage_hourly')) {
      console.log('Backfilling raw events + hourly rollups...');
      const c2 = await backfillEventsAndHourly();
      console.log('Inserted:', c2);
    } else {
      console.log('Event/hourly tables already populated, skipping.');
    }
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();

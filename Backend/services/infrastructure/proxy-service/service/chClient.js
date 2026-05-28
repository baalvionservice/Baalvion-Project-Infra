'use strict';

/**
 * ClickHouse client over the native HTTP interface (no extra dependency — uses
 * core http/https). REAL and OPTIONAL: when CLICKHOUSE_URL is unset, isEnabled()
 * is false and the intelligence layer falls back to TimescaleDB aggregates.
 * This is what finally FEEDS the previously-unfed ClickHouse schemas: the feature
 * pipeline batch-inserts routing telemetry here, and trainers read the MVs.
 *
 * CLICKHOUSE_URL e.g. http://user:pass@clickhouse:8123/baalvion
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const logger = require('./logger');

const RAW = process.env.CLICKHOUSE_URL || '';
let parsed = null;
if (RAW) {
  try { parsed = new URL(RAW); } catch (err) { logger.error('[clickhouse] invalid CLICKHOUSE_URL:', err.message); }
}
const DB = (parsed && parsed.pathname && parsed.pathname.replace(/^\//, '')) || process.env.CLICKHOUSE_DB || 'baalvion';

function isEnabled() {
  return Boolean(parsed);
}

function request(sql, { readJson = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!parsed) return reject(new Error('clickhouse disabled'));
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;
    const params = new URLSearchParams({ database: DB });
    if (readJson) params.set('default_format', 'JSON');
    const options = {
      method: 'POST',
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 8123),
      path: `/?${params.toString()}`,
      headers: { 'Content-Type': 'text/plain' },
      timeout: Number(process.env.CLICKHOUSE_TIMEOUT_MS || 15000),
    };
    if (parsed.username) options.headers['X-ClickHouse-User'] = decodeURIComponent(parsed.username);
    if (parsed.password) options.headers['X-ClickHouse-Key'] = decodeURIComponent(parsed.password);

    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (!readJson) return resolve(body);
          try { resolve(JSON.parse(body || '{}')); } catch (e) { reject(new Error('clickhouse json parse: ' + e.message)); }
        } else {
          reject(new Error(`clickhouse ${res.statusCode}: ${body.slice(0, 500)}`));
        }
      });
    });
    req.on('timeout', () => req.destroy(new Error('clickhouse timeout')));
    req.on('error', reject);
    req.end(sql);
  });
}

/** Run a SELECT and return rows as objects (FORMAT JSON). */
async function query(sql) {
  const out = await request(sql, { readJson: true });
  return out.data || [];
}

/** Execute DDL/INSERT-from-SELECT etc. (no result rows). */
async function exec(sql) {
  return request(sql, { readJson: false });
}

/**
 * Batch-insert rows into a table using JSONEachRow. `rows` is an array of plain
 * objects whose keys match the table columns. Returns count inserted.
 */
async function insert(table, rows) {
  if (!parsed || !rows || !rows.length) return 0;
  const payload = `INSERT INTO ${DB}.${table} FORMAT JSONEachRow\n` +
    rows.map((r) => JSON.stringify(r)).join('\n');
  await request(payload, { readJson: false });
  return rows.length;
}

/** Convenience: insert routing telemetry rows. */
async function insertTelemetry(rows) {
  return insert('routing_telemetry', rows);
}

async function ping() {
  if (!parsed) return false;
  try { await exec('SELECT 1'); return true; } catch (_) { return false; }
}

module.exports = { isEnabled, query, exec, insert, insertTelemetry, ping };

'use strict';

/**
 * Enterprise audit export: CSV / JSON download + push to SIEM sinks
 * (Splunk HEC, Datadog Logs, generic webhook). Sink config is encrypted.
 */

const db = require('../models');
const cryptoVault = require('./cryptoVault');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

// Map logical source → table + projection.
const SOURCES = {
  auth: `SELECT created_at, auth_type, outcome, reason, ip_address, org_id FROM auth_audit_logs WHERE org_id = :org AND created_at >= :since ORDER BY created_at DESC LIMIT :limit`,
  admin: `SELECT created_at, action, entity_type, actor_user_id, ip_address, org_id FROM audit_logs WHERE org_id = :org AND created_at >= :since ORDER BY created_at DESC LIMIT :limit`,
  abuse: `SELECT created_at, event_type, severity, reason, org_id FROM abuse_logs WHERE org_id = :org AND created_at >= :since ORDER BY created_at DESC LIMIT :limit`,
  billing: `SELECT created_at, action, invoice_id, org_id FROM billing_audit_logs WHERE org_id = :org AND created_at >= :since ORDER BY created_at DESC LIMIT :limit`,
  compliance: `SELECT created_at, domain, action, actor_id, org_id FROM compliance_audit_logs WHERE org_id = :org AND created_at >= :since ORDER BY created_at DESC LIMIT :limit`,
};

async function fetchEvents(orgId, source, sinceDays = 30, limit = 10000) {
  const sql = SOURCES[source];
  if (!sql) return [];
  const since = new Date(Date.now() - sinceDays * 86400000);
  return db.sequelize.query(sql, { replacements: { org: orgId, since, limit }, type: Q.SELECT }).catch(() => []);
}

/** Pure CSV serializer (unit-tested). */
function toCsv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v == null ? '' : (v instanceof Date ? v.toISOString() : String(v));
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

async function exportData(orgId, source, format = 'json', sinceDays = 30) {
  const rows = await fetchEvents(orgId, source, sinceDays);
  if (format === 'csv') return { contentType: 'text/csv', filename: `${source}-audit.csv`, body: toCsv(rows) };
  return { contentType: 'application/json', filename: `${source}-audit.json`, body: JSON.stringify(rows, null, 2) };
}

// ── SIEM push ─────────────────────────────────────────────────────────────────
async function pushToSiem(orgId) {
  const sinks = await db.sequelize.query(`SELECT id, type, config_enc, sources FROM audit_export_destinations WHERE org_id = :org AND enabled = true`, { replacements: { org: orgId }, type: Q.SELECT });
  let pushed = 0;
  for (const sink of sinks) {
    let cfg; try { cfg = JSON.parse(cryptoVault.decrypt(sink.config_enc)); } catch { continue; }
    const events = [];
    for (const src of (sink.sources || ['auth', 'admin'])) {
      for (const e of await fetchEvents(orgId, src, 1, 5000)) events.push({ source: src, ...e });
    }
    if (!events.length) continue;
    try {
      await deliver(sink.type, cfg, events, orgId);
      pushed += events.length;
    } catch (err) { logger.error(`[audit-export] ${sink.type} failed:`, err.message); }
  }
  return { pushed };
}

async function deliver(type, cfg, events, orgId) {
  if (type === 'splunk_hec') {
    await fetch(cfg.url, {
      method: 'POST',
      headers: { Authorization: `Splunk ${cfg.token}`, 'Content-Type': 'application/json' },
      body: events.map((e) => JSON.stringify({ event: e, source: 'baalvion', sourcetype: 'baalvion:audit' })).join('\n'),
    });
  } else if (type === 'datadog') {
    await fetch(`https://http-intake.logs.${cfg.site || 'datadoghq.com'}/api/v2/logs`, {
      method: 'POST',
      headers: { 'DD-API-KEY': cfg.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(events.map((e) => ({ ddsource: 'baalvion', service: 'baalvion', ddtags: `org:${orgId}`, ...e }))),
    });
  } else { // generic webhook
    await fetch(cfg.url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cfg.headers || {}) }, body: JSON.stringify({ org: orgId, events }) });
  }
}

module.exports = { toCsv, fetchEvents, exportData, pushToSiem };

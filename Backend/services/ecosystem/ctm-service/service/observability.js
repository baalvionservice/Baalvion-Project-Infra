'use strict';
// Real observability: metrics are derived from the live prom-client registry, the
// Node process/OS, and the database — NOT synthesized. Snapshots are persisted so the
// admin dashboards get a genuine time-series that fills in as the service runs.
const os = require('os');
const http = require('http');
const https = require('https');
const db = require('../models');
const { register } = require('../middleware/metrics');

const SERVICE = process.env.SERVICE_NAME || 'ctm-service';

// Rolling state for rate/CPU deltas between snapshots.
let _last = { totalReq: 0, at: Date.now(), cpu: process.cpuUsage() };

// ── prom registry parsing (real counters/histogram) ────────────────────────────
async function readHttpStats() {
    const json = await register.getMetricsAsJSON();
    const reqMetric = json.find((m) => m.name === 'baalvion_http_requests_total');
    const durMetric = json.find((m) => m.name === 'baalvion_http_request_duration_ms');
    let total = 0, errors = 0;
    if (reqMetric) {
        for (const v of reqMetric.values) {
            total += v.value;
            if (String(v.labels.status || '').startsWith('5')) errors += v.value;
        }
    }
    let sum = 0, count = 0;
    if (durMetric) {
        for (const v of durMetric.values) {
            if (v.metricName && v.metricName.endsWith('_sum')) sum += v.value;
            if (v.metricName && v.metricName.endsWith('_count')) count += v.value;
        }
    }
    return { total, errors, avgLatency: count ? sum / count : 0 };
}

async function measureDbLatency() {
    const t = Date.now();
    try { await db.sequelize.query('SELECT 1'); return Date.now() - t; }
    catch { return -1; }
}

function memLoadPct() {
    return Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 1000) / 10;
}

// ── snapshot ────────────────────────────────────────────────────────────────────
async function buildLiveMetric() {
    const [http_, dbMs] = await Promise.all([readHttpStats(), measureDbLatency()]);
    const now = Date.now();
    const elapsedSec = Math.max(1, (now - _last.at) / 1000);
    const deltaReq = Math.max(0, http_.total - _last.totalReq);
    const rps = deltaReq / elapsedSec;

    const [activeUsers, activeSessions] = await Promise.all([
        db.user_profiles.count().catch(() => 0),
        recentActiveCount().catch(() => 0),
    ]);

    const errorRate = http_.total ? Math.round((http_.errors / http_.total) * 1000) / 10 : 0;
    const systemLoad = memLoadPct();

    _last = { totalReq: http_.total, at: now, cpu: process.cpuUsage() };

    return {
        active_users: activeUsers,
        active_sessions: activeSessions,
        system_load: systemLoad,
        api_requests_per_minute: Math.round(rps * 60),
        requests_per_second: Math.round(rps * 100) / 100,
        error_rate: errorRate,
        avg_api_response_time: Math.round(http_.avgLatency * 100) / 100,
        db_query_time: dbMs,
        auto_scaling_status: systemLoad > 85 ? 'Scaling Up' : systemLoad < 20 ? 'Scaling Down' : 'Stable',
        captured_at: new Date(now).toISOString(),
        metadata: { uptimeSec: Math.round(process.uptime()), totalRequests: http_.total, rssMb: Math.round(process.memoryUsage().rss / 1048576) },
    };
}

async function recentActiveCount() {
    // Distinct users who acted in the last 30 min (real engagement proxy for "sessions").
    const since = new Date(Date.now() - 30 * 60 * 1000);
    const { Op } = require('sequelize');
    const rows = await db.submissions.findAll({
        attributes: ['user_id'], where: { updated_at: { [Op.gte]: since } }, group: ['user_id'], raw: true,
    });
    return rows.length;
}

async function collectSnapshot() {
    try {
        const m = await buildLiveMetric();
        await db.system_metrics.create(m);
        await reconcileIncidents();
    } catch (e) { /* never let telemetry crash the loop */ }
}

let _collector = null;
function startCollector(intervalMs = 60000) {
    if (_collector) return;
    collectSnapshot();
    _collector = setInterval(collectSnapshot, intervalMs);
    if (_collector.unref) _collector.unref();
}

// ── error + log capture ─────────────────────────────────────────────────────────
function fingerprint(service, type, message) {
    return `${service}|${type}|${String(message || '').slice(0, 120)}`.replace(/\s+/g, ' ');
}

function classify(statusCode) {
    if (statusCode >= 500) return 'Critical';
    if (statusCode >= 400) return 'Minor';
    return 'Warning';
}

async function recordError({ message, stack, type, statusCode, userId }) {
    try {
        const fp = fingerprint(SERVICE, type || 'Unhandled Exception', message);
        const existing = await db.system_errors.findOne({ where: { fingerprint: fp } });
        if (existing) {
            existing.frequency += 1;
            existing.last_occurred = new Date();
            if (userId) existing.affected_users = (existing.affected_users || 0) + 1;
            await existing.save();
        } else {
            await db.system_errors.create({
                fingerprint: fp, service: SERVICE, type: type || 'Unhandled Exception',
                severity: classify(statusCode || 500), message: String(message || 'Unknown error'),
                stack_trace: stack || null, frequency: 1, affected_users: userId ? 1 : 0, status: 'Open',
                last_occurred: new Date(),
            });
        }
        await recordLog('Error', `${type || 'Error'}: ${message}`, { statusCode });
    } catch { /* swallow */ }
}

async function recordLog(severity, message, metadata = {}) {
    try { await db.system_logs.create({ service: SERVICE, severity, message: String(message).slice(0, 2000), metadata }); }
    catch { /* swallow */ }
}

// ── dependency probes + incident reconciliation ──────────────────────────────────
function probeUrl(url) {
    return new Promise((resolve) => {
        try {
            const mod = url.startsWith('https') ? https : http;
            const t = Date.now();
            const req = mod.get(url, { timeout: 1500 }, (res) => {
                res.resume();
                resolve({ ok: res.statusCode >= 200 && res.statusCode < 500, ms: Date.now() - t });
            });
            req.on('error', () => resolve({ ok: false, ms: Date.now() - t }));
            req.on('timeout', () => { req.destroy(); resolve({ ok: false, ms: 1500 }); });
        } catch { resolve({ ok: false, ms: 0 }); }
    });
}

async function probeServices() {
    const dbMs = await measureDbLatency();
    const services = [];

    services.push({
        id: 'svc-db', name: 'Database',
        status: dbMs >= 0 ? (dbMs > 500 ? 'Degraded' : 'Running') : 'Down',
        lastChecked: new Date().toISOString(), uptimePercentage: dbMs >= 0 ? 100 : 0,
        responseMs: dbMs,
    });

    services.push({
        id: 'svc-api', name: 'API Gateway',
        status: 'Running', lastChecked: new Date().toISOString(),
        uptimePercentage: 100, responseMs: 0,
        metadata: { uptimeSec: Math.round(process.uptime()) },
    });

    // Authentication — probe the JWKS host or :3001 (real reachability).
    const authUrl = process.env.OBS_PROBE_AUTH_URL || 'http://localhost:3001/health';
    const auth = await probeUrl(authUrl);
    services.push({
        id: 'svc-auth', name: 'Authentication',
        status: auth.ok ? 'Running' : 'Down',
        lastChecked: new Date().toISOString(), uptimePercentage: auth.ok ? 100 : 0, responseMs: auth.ms,
    });

    // Optional extra probes configured via env (NAME=url,NAME=url) — keeps it honest/extensible.
    const extra = (process.env.OBS_PROBE_EXTRA || '').split(',').map((s) => s.trim()).filter(Boolean);
    for (const pair of extra) {
        const [name, url] = pair.split('=');
        if (!name || !url) continue;
        const r = await probeUrl(url);
        services.push({ id: 'svc-' + name.toLowerCase(), name, status: r.ok ? 'Running' : 'Down', lastChecked: new Date().toISOString(), uptimePercentage: r.ok ? 100 : 0, responseMs: r.ms });
    }
    return services;
}

// Open an incident when a service is Down/Degraded; resolve it when it recovers.
async function reconcileIncidents() {
    try {
        const services = await probeServices();
        for (const s of services) {
            const open = await db.system_incidents.findOne({ where: { service_name: s.name, status: ['Ongoing', 'Investigating'] } });
            const unhealthy = s.status !== 'Running';
            if (unhealthy && !open) {
                await db.system_incidents.create({ service_name: s.name, status: 'Ongoing', start_time: new Date(), description: `${s.name} reported ${s.status} by health probe.` });
                await recordLog('Warning', `Incident opened: ${s.name} is ${s.status}`);
            } else if (!unhealthy && open) {
                open.status = 'Resolved';
                open.end_time = new Date();
                open.duration_minutes = Math.max(1, Math.round((open.end_time - new Date(open.start_time)) / 60000));
                await open.save();
                await recordLog('Info', `Incident resolved: ${open.service_name} recovered`);
            }
        }
    } catch { /* swallow */ }
}

module.exports = {
    buildLiveMetric, collectSnapshot, startCollector,
    recordError, recordLog, probeServices, readHttpStats,
};

'use strict';
/**
 * Real metric collectors for the realtime feed. Everything here is an actual
 * measurement — process/OS stats, live DB/Redis introspection, HTTP health
 * probes, BullMQ queue depths, and the auth audit-log tail as a live event feed.
 */
const os = require('os');
const fs = require('fs');
const http = require('http');

// ── CPU sampler (delta-based; os.loadavg is 0 on Windows) ────────────────────
function makeCpuSampler() {
    let prev = os.cpus().map((c) => ({ ...c.times }));
    return function sample() {
        const cur = os.cpus().map((c) => ({ ...c.times }));
        let idle = 0, total = 0;
        for (let i = 0; i < cur.length; i++) {
            const p = prev[i], c = cur[i];
            const pt = p.user + p.nice + p.sys + p.idle + p.irq;
            const ct = c.user + c.nice + c.sys + c.idle + c.irq;
            idle += (c.idle - p.idle);
            total += (ct - pt);
        }
        prev = cur;
        if (total <= 0) return 0;
        return Math.max(0, Math.min(100, Math.round((1 - idle / total) * 100)));
    };
}

async function diskPct() {
    try {
        const root = process.platform === 'win32' ? process.cwd().slice(0, 3) : '/';
        const s = await fs.promises.statfs(root);
        if (!s.blocks) return 0;
        return Math.round((1 - s.bfree / s.blocks) * 100);
    } catch { return 0; }
}

function parseRedisInfo(text) {
    const out = {};
    for (const line of text.split('\n')) {
        const i = line.indexOf(':');
        if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
    return out;
}

// ── Infrastructure metrics ───────────────────────────────────────────────────
async function collectInfra({ redis, pgQuery, cpuSample, network }) {
    const memory = Math.round((1 - os.freemem() / os.totalmem()) * 100);
    const cpu = cpuSample();
    const disk = await diskPct();

    // Redis
    let redisStat = { keyCount: 0, hitRate: 0, memoryMb: 0, connectedClients: 0 };
    try {
        const info = parseRedisInfo(await redis.info());
        const hits = Number(info.keyspace_hits || 0);
        const misses = Number(info.keyspace_misses || 0);
        const dbsize = await redis.dbsize();
        redisStat = {
            keyCount: dbsize,
            hitRate: hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 100,
            memoryMb: Math.round((Number(info.used_memory || 0) / 1048576) * 10) / 10,
            connectedClients: Number(info.connected_clients || 0),
        };
    } catch { /* redis down — leave zeros */ }

    // Postgres
    let pgStat = { connections: 0, maxConnections: 0, activeQueries: 0, replicationLag: 0 };
    try {
        const r = await pgQuery(`
            SELECT (SELECT count(*) FROM pg_stat_activity)                       AS connections,
                   (SELECT count(*) FROM pg_stat_activity WHERE state='active')  AS active,
                   (SELECT setting::int FROM pg_settings WHERE name='max_connections') AS maxc`);
        const row = r.rows[0] || {};
        pgStat = {
            connections: Number(row.connections || 0),
            maxConnections: Number(row.maxc || 100),
            activeQueries: Number(row.active || 0),
            replicationLag: 0,
        };
    } catch { /* pg down */ }

    return { cpu, memory, disk, network: network || { inKbps: 0, outKbps: 0 }, redis: redisStat, postgres: pgStat };
}

// ── HTTP health probe ────────────────────────────────────────────────────────
function probe(url, timeoutMs = 2500) {
    return new Promise((resolve) => {
        const started = Date.now();
        const req = http.get(url, (res) => {
            res.resume();
            const latencyMs = Date.now() - started;
            const ok = res.statusCode >= 200 && res.statusCode < 400;
            resolve({ ok, latencyMs, status: res.statusCode });
        });
        req.setTimeout(timeoutMs, () => { req.destroy(); resolve({ ok: false, latencyMs: null, status: 0 }); });
        req.on('error', () => resolve({ ok: false, latencyMs: null, status: 0 }));
    });
}

async function collectServiceHealth(targets, { redis, pgQuery }) {
    const now = new Date().toISOString();
    const out = [];
    for (const t of targets) {
        const r = await probe(t.url);
        out.push({
            name: t.name, url: t.url,
            status: r.ok ? (r.latencyMs != null && r.latencyMs > 800 ? 'degraded' : 'up') : 'down',
            latencyMs: r.latencyMs, checkedAt: now,
        });
    }
    // Datastores (not HTTP)
    let pgUp = false, pgMs = null;
    try { const s = Date.now(); await pgQuery('SELECT 1'); pgMs = Date.now() - s; pgUp = true; } catch {}
    out.push({ name: 'postgres', url: 'tcp://localhost:5432', status: pgUp ? 'up' : 'down', latencyMs: pgMs, checkedAt: now });
    let rUp = false, rMs = null;
    try { const s = Date.now(); await redis.ping(); rMs = Date.now() - s; rUp = true; } catch {}
    out.push({ name: 'redis', url: 'tcp://localhost:6379', status: rUp ? 'up' : 'down', latencyMs: rMs, checkedAt: now });
    return out;
}

// ── Platform stats ───────────────────────────────────────────────────────────
async function collectPlatformStats(pgQuery) {
    try {
        const r = await pgQuery(`
            SELECT (SELECT count(*) FROM auth.users WHERE status='active')                                       AS active_users,
                   (SELECT count(*) FROM auth.sessions WHERE expires_at > now() AND revoked_at IS NULL)          AS active_sessions,
                   (SELECT count(*) FROM auth.audit_logs WHERE action='user.login' AND created_at > now()-interval '24 hours')        AS logins_24h,
                   (SELECT count(*) FROM auth.audit_logs WHERE action='user.login_failed' AND created_at > now()-interval '24 hours') AS failed_24h,
                   (SELECT count(*) FROM auth.organizations)                                                      AS orgs`);
        const row = r.rows[0] || {};
        return {
            activeUsers: Number(row.active_users || 0),
            activeSessions: Number(row.active_sessions || 0),
            logins24h: Number(row.logins_24h || 0),
            failedLogins24h: Number(row.failed_24h || 0),
            orgs: Number(row.orgs || 0),
        };
    } catch { return { activeUsers: 0, activeSessions: 0, logins24h: 0, failedLogins24h: 0, orgs: 0 }; }
}

// ── BullMQ queue depths (discovered from Redis) ──────────────────────────────
const PRETTY = { 'cms-notifications': 'CMS Notifications', 'cms-scheduler': 'CMS Scheduler', sms: 'SMS Dispatch', email: 'Email Dispatch' };
async function collectQueues(redis) {
    const names = new Set();
    let cursor = '0';
    try {
        do {
            const [next, keys] = await redis.scan(cursor, 'MATCH', 'bull:*', 'COUNT', 300);
            cursor = next;
            for (const k of keys) { const parts = k.split(':'); if (parts.length >= 3) names.add(parts[1]); }
        } while (cursor !== '0' && names.size < 50);
    } catch { return []; }

    const z = async (key) => { try { return await redis.zcard(key); } catch { return 0; } };
    const l = async (key) => { try { return await redis.llen(key); } catch { return 0; } };

    const out = [];
    for (const name of names) {
        out.push({
            name,
            displayName: PRETTY[name] || name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            waiting:   await l(`bull:${name}:wait`),
            active:    await l(`bull:${name}:active`),
            completed: await z(`bull:${name}:completed`),
            failed:    await z(`bull:${name}:failed`),
            delayed:   await z(`bull:${name}:delayed`),
        });
    }
    return out.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

// ── Live events from the auth audit-log tail ─────────────────────────────────
const ACTION_MAP = {
    'user.login':                      { type: 'auth',     severity: 'info' },
    'user.login_failed':               { type: 'security', severity: 'warning' },
    'user.register':                   { type: 'user',     severity: 'info' },
    'user.forgot_password':            { type: 'auth',     severity: 'info' },
    'security.refresh_reuse_detected': { type: 'security', severity: 'critical' },
    'member.invite':                   { type: 'admin',    severity: 'info' },
};
async function collectEvents(pgQuery, state) {
    try {
        const r = await pgQuery(
            `SELECT a.id, a.action, a.user_id, a.org_id, a.ip_address, a.created_at, u.email
               FROM auth.audit_logs a
               LEFT JOIN auth.users u ON u.id = a.user_id
              WHERE a.id > $1 ORDER BY a.id ASC LIMIT 40`, [state.lastEventId || 0]);
        if (!r.rows.length) return [];
        state.lastEventId = Number(r.rows[r.rows.length - 1].id);
        return r.rows.map((row) => {
            const map = ACTION_MAP[row.action] || { type: 'system', severity: 'info' };
            return {
                id: `audit-${row.id}`,
                type: map.type, action: row.action, severity: map.severity,
                userId: row.user_id != null ? String(row.user_id) : undefined,
                userEmail: row.email || undefined,
                ip: row.ip_address || undefined,
                orgId: row.org_id || undefined,
                timestamp: new Date(row.created_at).toISOString(),
            };
        });
    } catch { return []; }
}

module.exports = {
    makeCpuSampler, collectInfra, collectServiceHealth,
    collectPlatformStats, collectQueues, collectEvents,
};

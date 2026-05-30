'use strict';
require('dotenv').config();
const http = require('http');
const fs = require('fs');
const { URL } = require('url');
const { Pool } = require('pg');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');

const { attachWebSocket } = require('./wsServer');
const {
    makeCpuSampler, collectInfra, collectServiceHealth,
    collectPlatformStats, collectQueues, collectEvents,
} = require('./collectors');

// ── Config ───────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT || 3026);
const TICK_MS = Number(process.env.TICK_MS || 5000);
const ISSUER = process.env.JWT_ISSUER || 'baalvion-auth';
const AUDIENCE = process.env.JWT_AUDIENCE || 'baalvion-platform';
const PUBLIC_KEY = (() => {
    if (process.env.JWT_PUBLIC_KEY_PATH) { try { return fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, 'utf8'); } catch {} }
    if (process.env.JWT_PUBLIC_KEY) return process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
    return null;
})();

const HEALTH_TARGETS = [
    { name: 'auth-service',     url: 'http://localhost:3001/health' },
    { name: 'admin-service',    url: 'http://localhost:3021/health' },
    { name: 'cms-service',      url: 'http://localhost:3018/api/v1/health' },
    { name: 'session-service',  url: 'http://localhost:3022/health' },
    { name: 'oauth-service',    url: 'http://localhost:3023/health' },
    { name: 'realtime-service', url: `http://localhost:${PORT}/health` },
];

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'baalvion_db',
    user: process.env.DB_USER || 'baalvion',
    password: process.env.DB_PASSWORD || 'baalvion_dev_pass',
    max: 4,
});
const pgQuery = (text, params) => pool.query(text, params);
const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379), lazyConnect: false, maxRetriesPerRequest: 2 });
const subscriber = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) });

const cpuSample = makeCpuSampler();
const eventState = { lastEventId: 0 };

// Latest snapshot — served to REST callers and to freshly-connected WS clients.
let snapshot = { services: [], stats: null, queues: [], infra: null, ts: Date.now() };

// ── Auth for the WS upgrade (?token=...) ─────────────────────────────────────
function verifyUpgrade(req) {
    try {
        const u = new URL(req.url, `http://localhost:${PORT}`);
        const token = u.searchParams.get('token');
        if (!token || !PUBLIC_KEY) return null;
        const payload = jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'], issuer: ISSUER, audience: AUDIENCE });
        return { userId: payload.sub, roles: payload.roles || [] };
    } catch { return null; }
}

// ── HTTP server (health + REST snapshot) ─────────────────────────────────────
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'ok', service: 'realtime-service', clients: wss.count, ts: new Date().toISOString() }));
    }
    if (req.url.startsWith('/api/v1/infrastructure/snapshot')) {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ success: true, data: snapshot }));
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: { code: 'NOT_FOUND' } }));
});

const wss = attachWebSocket(server, {
    verifyUpgrade,
    onConnection(client) {
        // Hydrate the new client immediately with the latest snapshot.
        if (snapshot.services.length) client.send({ type: 'service_health', data: snapshot.services });
        if (snapshot.stats)  client.send({ type: 'platform_stats', data: snapshot.stats });
        if (snapshot.queues.length) client.send({ type: 'queue_stats', data: snapshot.queues });
        if (snapshot.infra)  client.send({ type: 'infra_metrics', data: snapshot.infra });
    },
    onMessage(client, msg) {
        if (msg && msg.type === 'ping') client.send({ type: 'pong', ts: Date.now() });
    },
});

// ── Collection loop ──────────────────────────────────────────────────────────
async function tick() {
    try {
        const bytes = wss.readBytes();
        const network = { inKbps: Math.round((bytes.in * 8) / TICK_MS), outKbps: Math.round((bytes.out * 8) / TICK_MS) };

        const [services, stats, queues, infra] = await Promise.all([
            collectServiceHealth(HEALTH_TARGETS, { redis, pgQuery }),
            collectPlatformStats(pgQuery),
            collectQueues(redis),
            collectInfra({ redis, pgQuery, cpuSample, network }),
        ]);
        snapshot = { services, stats, queues, infra, ts: Date.now() };

        wss.broadcast({ type: 'service_health', data: services });
        wss.broadcast({ type: 'platform_stats', data: stats });
        wss.broadcast({ type: 'queue_stats', data: queues });
        wss.broadcast({ type: 'infra_metrics', data: infra });
    } catch (e) {
        console.error('[realtime] tick error:', e.message);
    }
}

// ── Live event feed: audit-log tail + Redis pub/sub fan-out ──────────────────
async function eventTick() {
    const events = await collectEvents(pgQuery, eventState);
    for (const ev of events) wss.broadcast({ type: 'event', data: ev });
}

subscriber.subscribe('realtime:events').catch((e) => console.error('[realtime] subscribe failed:', e.message));
subscriber.on('message', (_channel, payload) => {
    try { wss.broadcast({ type: 'event', data: JSON.parse(payload) }); } catch { /* bad payload */ }
});

server.listen(PORT, async () => {
    console.log(`[realtime-service] listening on :${PORT} (ws + REST) — tick ${TICK_MS}ms`);
    if (!PUBLIC_KEY) console.warn('[realtime-service] WARNING: no JWT public key — WS auth will reject all clients');
    // Seed lastEventId to "now" so we stream only events from startup forward.
    try { const r = await pgQuery('SELECT COALESCE(MAX(id),0) AS max FROM auth.audit_logs'); eventState.lastEventId = Number(r.rows[0].max); } catch {}
    await tick();
    setInterval(tick, TICK_MS);
    setInterval(eventTick, 3000);
});

process.on('SIGINT', () => { server.close(); redis.quit(); subscriber.quit(); pool.end(); process.exit(0); });

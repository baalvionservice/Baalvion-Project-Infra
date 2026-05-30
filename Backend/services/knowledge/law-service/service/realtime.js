'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Real-time WebSocket hub for chat. Replaces 30s polling with instant delivery.
//
//   • Client connects to  ws(s)://<host>/ws?token=<access-token>
//   • Token is the same canonical RS256 access token (verified here), mapped to
//     the local legal.users id by email — exactly like the REST authMiddleware,
//     so socket identity == req.user.id used on message rows.
//   • messageController.sendMessage() calls pushToUser(receiverId, msg) after a
//     message is persisted; we deliver to every live socket for that user (and
//     echo to the sender's other tabs).
//
// Best-effort + self-healing: heartbeat ping/pong drops dead sockets; a missing
// hub (WS disabled) makes pushToUser a no-op so REST still works.
// ─────────────────────────────────────────────────────────────────────────────
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server; // ws v7 exposes .Server (v8 adds the named export)
const { URL } = require('url');
const { createJwksVerifier } = require('@baalvion/auth-node');
const config = require('../config/appConfig');
const db = require('../models');

const verifier = createJwksVerifier({
    jwksUri: config.jwt.jwksUri || undefined,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    staticPublicKey: config.jwt.publicKey,
    rejectHs256: true,
    requiredClaims: ['sub', 'org_id', 'sid', 'jti'],
    validateRolesPermissions: true,
});

// userId (string) -> Set<WebSocket>
const clients = new Map();
let wss = null;

function register(userId, ws) {
    const key = String(userId);
    if (!clients.has(key)) clients.set(key, new Set());
    clients.get(key).add(ws);
    ws._lawUserId = key;
}

function unregister(ws) {
    const key = ws._lawUserId;
    if (!key) return;
    const set = clients.get(key);
    if (set) { set.delete(ws); if (!set.size) clients.delete(key); }
}

/** Deliver a JSON payload to every live socket of a user. Safe no-op if none. */
function pushToUser(userId, payload) {
    const set = clients.get(String(userId));
    if (!set || !set.size) return 0;
    const data = JSON.stringify(payload);
    let n = 0;
    for (const ws of set) {
        if (ws.readyState === WebSocket.OPEN) { try { ws.send(data); n++; } catch (_) { /* ignore */ } }
    }
    return n;
}

async function resolveUserId(token) {
    const claims = await verifier.verify(token);
    if (!claims.email) return null;
    const user = await db.User.findOne({ where: { email: claims.email }, attributes: ['id'] });
    return user ? String(user.id) : null;
}

/** Attach the WS server to the shared HTTP server (path: /ws). */
function attach(server) {
    wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', async (req, socket, head) => {
        let pathname;
        try { pathname = new URL(req.url, 'http://localhost').pathname; } catch { pathname = req.url; }
        if (pathname !== '/ws' && pathname !== '/v1/ws') return; // let other upgrade handlers run

        let token = null;
        try { token = new URL(req.url, 'http://localhost').searchParams.get('token'); } catch { /* noop */ }
        const bearer = req.headers['authorization'];
        if (!token && bearer && bearer.startsWith('Bearer ')) token = bearer.slice(7);

        let userId = null;
        try { userId = token ? await resolveUserId(token) : null; } catch { userId = null; }
        if (!userId) { socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); socket.destroy(); return; }

        wss.handleUpgrade(req, socket, head, (ws) => {
            register(userId, ws);
            ws.isAlive = true;
            ws.on('pong', () => { ws.isAlive = true; });
            ws.on('message', (raw) => {
                // Lightweight client→server protocol: ping + typing indicators.
                try {
                    const msg = JSON.parse(raw.toString());
                    if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
                    else if (msg.type === 'typing' && msg.to) {
                        pushToUser(msg.to, { type: 'typing', from: userId, threadKey: msg.threadKey });
                    }
                } catch (_) { /* ignore malformed */ }
            });
            ws.on('close', () => unregister(ws));
            ws.on('error', () => unregister(ws));
            ws.send(JSON.stringify({ type: 'connected', userId }));
        });
    });

    // Heartbeat: terminate sockets that stopped responding.
    const interval = setInterval(() => {
        if (!wss) return;
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) { unregister(ws); return ws.terminate(); }
            ws.isAlive = false;
            try { ws.ping(); } catch (_) { /* noop */ }
        });
    }, 30_000);
    if (interval.unref) interval.unref();

    // eslint-disable-next-line no-console
    console.log('[realtime] WebSocket hub attached at /ws');
    return wss;
}

module.exports = { attach, pushToUser };

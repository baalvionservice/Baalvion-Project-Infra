'use strict';
/**
 * Realtime feed for the admin console (Infrastructure panel, service health, platform stats).
 *
 * The console has always shipped a WebSocket client (Frontend/admin-platform/src/lib/websocket/
 * wsClient.ts) pointed at .../infrastructure/realtime, but no server ever answered it, so those
 * panels sat on "Waiting for realtime metrics…" permanently. This is that server.
 *
 * Wire protocol, taken from the existing client — it is the contract, not a new one:
 *   connect  wss://<host>/<path>?token=<RS256 access token>
 *   c -> s   {"type":"ping"}
 *   s -> c   {"type":"infra_metrics"|"service_health"|"platform_stats"|"pong", "data":…, "ts":…}
 *
 * Auth is the same RS256 verification the HTTP routes use. A browser cannot set headers on a
 * WebSocket handshake, hence the query-string token; it is verified before the upgrade completes,
 * so an unauthenticated socket is never established.
 */
const { WebSocketServer } = require('ws');
const { createJwksVerifier } = require('@baalvion/auth-node');
const fs = require('fs');
const config = require('../config/appConfig');
const logger = require('../utils/logger');
const redis = require('../config/redis');
const { collect } = require('./metrics');

const PATH = process.env.REALTIME_WS_PATH || '/realtime';
const PUSH_MS = Number(process.env.REALTIME_PUSH_MS || 5000);
const HEARTBEAT_MS = 30000;

function resolveStaticPublicKey() {
  if (config.jwt.publicKeyPath) {
    try { return fs.readFileSync(config.jwt.publicKeyPath, 'utf8'); } catch { /* fall through */ }
  }
  if (config.jwt.publicKey) return config.jwt.publicKey.replace(/\\n/g, '\n');
  return undefined;
}

const verifier = createJwksVerifier({
  jwksUri:            config.jwt.jwksUri || undefined,
  issuer:             config.jwt.issuer,
  audience:           config.jwt.audience,
  staticPublicKey:    resolveStaticPublicKey(),
  staticPublicKeyB64: config.jwt.publicKeyB64 || undefined,
  isBlacklisted: async (jti) => {
    if (!(redis.isAvailable && redis.isAvailable())) return false;
    const bl = await redis.getClient()?.get(`auth:blacklist:${jti}`);
    return !!bl;
  },
  logger,
});

let wss = null;
let pushTimer = null;
let beatTimer = null;

const send = (ws, type, data) => {
  if (ws.readyState !== ws.OPEN) return;
  try { ws.send(JSON.stringify({ type, data, ts: Date.now() })); } catch { /* client went away */ }
};

function broadcast(type, data) {
  if (!wss) return;
  for (const ws of wss.clients) send(ws, type, data);
}

/** Reuse the HTTP server admin-service already listens on — no second port to expose or route. */
function startRealtime(server, { sequelize } = {}) {
  if (wss) return wss;
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (req, socket, head) => {
    const reject = (code, why) => {
      socket.write(`HTTP/1.1 ${code}\r\nConnection: close\r\n\r\n`);
      socket.destroy();
      logger.debug({ why }, '[realtime] upgrade rejected');
    };

    let pathname;
    try { pathname = new URL(req.url, 'http://localhost').pathname; } catch { pathname = null; }
    // Attaching an 'upgrade' listener disables Node's default, which is to destroy sockets nobody
    // handles. This is the only upgrade handler on this server, so an unmatched path must be closed
    // here — returning early instead leaves the socket open forever, which is an unauthenticated
    // way to exhaust the service's file descriptors.
    if (pathname !== PATH) return reject('404 Not Found', 'no handler for upgrade path');

    const token = new URL(req.url, 'http://localhost').searchParams.get('token');
    if (!token) return reject('401 Unauthorized', 'no token');
    let claims;
    try {
      claims = await verifier.verify(token);
    } catch (err) {
      return reject('401 Unauthorized', err.message);
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.isAlive = true;
      ws.userId = claims.sub || claims.userId;
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', async (ws) => {
    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('message', (raw) => {
      let msg; try { msg = JSON.parse(raw); } catch { return; }
      if (msg && msg.type === 'ping') send(ws, 'pong', null);
    });
    ws.on('error', (err) => logger.debug({ err: err.message }, '[realtime] socket error'));
    // Don't make a new client wait a full interval for its first paint.
    try {
      send(ws, 'infra_metrics', await collect({ redisClient: redis.getClient && redis.getClient(), sequelize }));
    } catch (err) { logger.warn({ err: err.message }, '[realtime] initial metrics failed'); }
  });

  pushTimer = setInterval(async () => {
    if (!wss.clients.size) return;   // nobody watching; don't query the DB on a timer for nothing
    try {
      broadcast('infra_metrics', await collect({ redisClient: redis.getClient && redis.getClient(), sequelize }));
    } catch (err) { logger.warn({ err: err.message }, '[realtime] metrics collection failed'); }
  }, PUSH_MS);
  pushTimer.unref();

  beatTimer = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) { ws.terminate(); continue; }
      ws.isAlive = false;
      try { ws.ping(); } catch { /* terminated between checks */ }
    }
  }, HEARTBEAT_MS);
  beatTimer.unref();

  logger.info({ path: PATH, pushMs: PUSH_MS }, '[realtime] websocket server attached');
  return wss;
}

async function stopRealtime() {
  if (pushTimer) clearInterval(pushTimer);
  if (beatTimer) clearInterval(beatTimer);
  pushTimer = beatTimer = null;
  if (wss) { await new Promise((r) => wss.close(r)); wss = null; }
}

module.exports = { startRealtime, stopRealtime, broadcast };

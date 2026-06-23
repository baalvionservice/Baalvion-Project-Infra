'use strict';
require('@baalvion/telemetry/bootstrap');
const http                           = require('http');
const https                          = require('https');
const crypto                         = require('crypto');
const express                        = require('express');
const { Server }                     = require('socket.io');
const { createClient }               = require('redis');
const { createJwksVerifier }         = require('@baalvion/auth-node');
const config                         = require('./config/appConfig');
const { collectServiceHealth, collectPlatformStats } = require('./metrics/collector');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');

const PORT = config.port;

// WebSocket JWT verification delegates to the canonical authority (packages/auth-node).
// Canonical Batch C: RS256-ONLY (JWKS cached → static RSA key). HS256 fallback REMOVED;
// non-canonical/legacy claim shapes are rejected. See catalog/enforce.mjs C3.
const _jwksVerifier = createJwksVerifier({
  jwksUri:                  config.jwt.jwksUri,
  jwksTtlMs:                config.jwt.jwksTtlMs,
  issuer:                   config.jwt.issuer,
  audience:                 config.jwt.audience,
  staticPublicKey:          config.jwt.publicKey,
  staticPublicKeyB64:       config.jwt.publicKeyB64,
  rejectHs256:              true,
  requiredClaims:           ['sub', 'org_id', 'sid', 'jti'],
  validateRolesPermissions: true,
});

/** Verify a WS JWT — delegates to the canonical authority's JWKS verifier
 *  (RS256 via JWKS → static RSA key → HS256 shared secret). */
async function verifyWsToken(token) {
  return _jwksVerifier.verify(token);
}

// ── Express app + HTTP server ─────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:      config.allowedOrigins,
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  transports:           ['websocket', 'polling'],
  pingTimeout:          60_000,
  pingInterval:         25_000,
  connectTimeout:       10_000,
});

// ── Namespaces ────────────────────────────────────────────────────────────────
const NS_DASHBOARD = io.of('/dashboard');
const NS_IR        = io.of('/ir');
const NS_JOBS      = io.of('/jobs');
const NS_ADMIN     = io.of('/admin');
const NS_CTM       = io.of('/ctm');

// ── Presence tracking ─────────────────────────────────────────────────────────
// orgId -> Set<userId>
const presence = new Map();

function presenceAdd(orgId, userId) {
  if (!orgId) return;
  if (!presence.has(orgId)) presence.set(orgId, new Set());
  presence.get(orgId).add(userId);
}

function presenceRemove(orgId, userId) {
  if (!orgId) return;
  presence.get(orgId)?.delete(userId);
}

function emitPresence(status, { userId, orgId }) {
  if (!orgId) return;
  NS_ADMIN.to(`org:${orgId}`).emit('presence', { userId, status, orgId, ts: Date.now() });
}

// ── Redis clients ─────────────────────────────────────────────────────────────
let publisher      = null;   // general commands + publish
let subscriber     = null;   // subscribe-only client
let redisAvailable = false;

function makeRedisClient() {
  if (config.redis.url) {
    return createClient({
      url: config.redis.url,
      socket: { reconnectStrategy: (n) => Math.min(n * 500, 5000) },
    });
  }
  return createClient({
    socket: {
      host: config.redis.host || 'localhost',
      port: config.redis.port,
      reconnectStrategy: (n) => Math.min(n * 500, 5000),
    },
    password: config.redis.password || undefined,
  });
}

async function connectRedis() {
  try {
    publisher  = makeRedisClient();
    subscriber = makeRedisClient();

    publisher.on('error',   () => { redisAvailable = false; });
    publisher.on('connect', () => { redisAvailable = true; console.log('[Redis] publisher connected'); });
    subscriber.on('error',  () => {});

    await publisher.connect();
    await subscriber.connect();

    // ── Redis pub/sub — route events to correct namespace + room ──────────────
    // Channel: baalvion:events (canonical) and legacy baalvion:events:pubsub
    await subscriber.subscribe('baalvion:events', (message) => {
      try {
        const event = JSON.parse(message);
        const ns    = event.namespace || '/dashboard';
        const room  = event.room;
        const type  = event.type;
        const data  = event.data;
        if (room) {
          io.of(ns).to(room).emit(type, data);
        } else {
          io.of(ns).emit(type, data);
        }
      } catch (err) {
        console.error('[Redis] Dropping malformed event on baalvion:events:', err.message);
      }
    });

    // Keep backward-compat with old channel name
    await subscriber.subscribe('baalvion:events:pubsub', (message) => {
      try {
        const event = JSON.parse(message);
        broadcastToAll('event', event);
      } catch (err) {
        console.error('[Redis] Dropping malformed event on baalvion:events:pubsub:', err.message);
      }
    });

    console.log('[Redis] pub/sub subscribed to baalvion:events');
  } catch (err) {
    console.warn('[Redis] Unavailable — events will be polling only:', err.message);
  }
}

// ── Redis event replay buffer (reconnect: last 5 minutes per user) ────────────
const REPLAY_TTL     = config.replay.ttlSeconds;       // 300s = 5 min
const REPLAY_MAX     = config.replay.maxEvents;        // 100 events
const REPLAY_WINDOW  = config.replay.windowMs;         // 300_000 ms

function replayKey(userId) {
  return `realtime:replay:${userId}`;
}

async function pushReplayEvent(userId, event) {
  if (!redisAvailable || !publisher) return;
  try {
    const key     = replayKey(userId);
    const payload = JSON.stringify({ ...event, _ts: Date.now() });
    await publisher.lPush(key, payload);
    await publisher.lTrim(key, 0, REPLAY_MAX - 1);
    await publisher.expire(key, REPLAY_TTL);
  } catch (err) {
    console.error(`[Redis] Failed to buffer replay event for user=${userId}:`, err.message);
  }
}

async function fetchReplayEvents(userId) {
  if (!redisAvailable || !publisher) return [];
  try {
    const key    = replayKey(userId);
    const items  = await publisher.lRange(key, 0, REPLAY_MAX - 1);
    const cutoff = Date.now() - REPLAY_WINDOW;
    return items
      .map((raw) => { try { return JSON.parse(raw); } catch { return null; } })
      .filter((e) => e && e._ts >= cutoff);
  } catch {
    return [];
  }
}

// ── Per-socket rate limiter (60 events / minute) ──────────────────────────────
function makeRateLimiter() {
  const maxPerMinute = config.rateLimit.maxPerMinute;
  let count    = 0;
  let windowMs = Date.now();
  return function allow() {
    const now = Date.now();
    if (now - windowMs >= 60_000) { count = 0; windowMs = now; }
    if (count >= maxPerMinute) return false;
    count++;
    return true;
  };
}

// ── Cached broadcast state (service health + platform stats) ──────────────────
let lastHealth = [];
let lastStats  = null;

function broadcastToAll(type, data) {
  const payload = JSON.stringify({ type, data, ts: Date.now() });
  [NS_DASHBOARD, NS_IR, NS_JOBS, NS_ADMIN, NS_CTM].forEach((ns) => {
    ns.emit(type, data);
  });
  // Legacy raw-WS broadcast no longer needed; socket.io handles all clients
  void payload;
}

// ── JWT auth middleware for socket.io namespaces ──────────────────────────────
function createAuthMiddleware(namespacePath) {
  const allowedRoles = config.namespaceRoles[namespacePath] || [];

  return async (socket, next) => {
    if (config.jwt.bypassAuth) {
      socket.data.userId  = 'dev-bypass';
      socket.data.orgId   = null;
      socket.data.roles   = ['super_admin'];
      socket.data.permissions = [];
      socket.data.sessionId   = null;
      socket.data.jti     = null;
      console.log(`[WS] DEV BYPASS — unauthenticated connection on ${namespacePath}`);
      return next();
    }

    // Extract token from query param 'auth' or 'token', or Authorization header
    const token =
      socket.handshake.auth?.token                          ||
      socket.handshake.query?.auth                          ||
      socket.handshake.query?.token                         ||
      (socket.handshake.headers?.authorization || '').replace(/^Bearer\s+/i, '') ||
      null;

    if (!token) {
      return next(Object.assign(new Error('Authentication required'), { code: 4001 }));
    }

    try {
      const payload = await verifyWsToken(token);

      socket.data.userId      = payload.sub;
      socket.data.orgId       = payload.org_id ?? null;
      socket.data.roles       = Array.isArray(payload.roles) ? payload.roles : (payload.role != null ? [payload.role] : []);
      socket.data.permissions = Array.isArray(payload.permissions) ? payload.permissions : [];
      socket.data.sessionId   = payload.sid ?? null;
      socket.data.jti         = payload.jti ?? null;

      // Namespace role check (roles[]-aware — any held role in the namespace allow-list)
      if (allowedRoles.length && !socket.data.roles.some((r) => allowedRoles.includes(r))) {
        return next(Object.assign(new Error('Insufficient role for this namespace'), { code: 4003 }));
      }

      next();
    } catch (err) {
      const ip = socket.handshake.address;
      console.warn(`[WS] Rejected connection on ${namespacePath} from ${ip}: ${err.message}`);
      return next(Object.assign(new Error('Invalid or expired token'), { code: 4001 }));
    }
  };
}

// ── Room authorization helpers ────────────────────────────────────────────────
async function joinAuthorizedRooms(socket) {
  const { userId, orgId, roles } = socket.data;

  // Always join personal room
  await socket.join(`user:${userId}`);

  // Join org room if orgId is present
  if (orgId) {
    await socket.join(`org:${orgId}`);
  }

  // Admins get global room
  if (roles.includes('admin') || roles.includes('super_admin')) {
    await socket.join('admin:global');
  }
}

// Prevent room-hopping: only allow joining rooms that belong to the user's org
function guardRoomJoin(socket, room) {
  const { userId, orgId, roles } = socket.data;

  // Always allow personal room
  if (room === `user:${userId}`) return true;

  // Org rooms — only own org
  if (room.startsWith('org:')) {
    const roomOrg = room.slice(4);
    return roomOrg === String(orgId);
  }

  // Admin global — admins only
  if (room === 'admin:global') {
    return roles.includes('admin') || roles.includes('super_admin');
  }

  // Deny unknown patterns
  return false;
}

// ── Connection handler factory ────────────────────────────────────────────────
function attachConnectionHandler(namespace, namespacePath) {
  namespace.use(createAuthMiddleware(namespacePath));

  namespace.on('connection', async (socket) => {
    const { userId, orgId, roles } = socket.data;
    const ip = socket.handshake.address;
    console.log(`[WS] Connected — ns=${namespacePath} user=${userId} roles=${roles.join(',')} ip=${ip}`);

    // ── Room setup ────────────────────────────────────────────────────────────
    await joinAuthorizedRooms(socket);

    // ── Presence ──────────────────────────────────────────────────────────────
    presenceAdd(orgId, userId);
    emitPresence('online', { userId, orgId });

    // ── Rate limiter ──────────────────────────────────────────────────────────
    const rateLimiter = makeRateLimiter();

    // ── Replay pending events (last 5 minutes) ────────────────────────────────
    const pending = await fetchReplayEvents(userId);
    if (pending.length) {
      socket.emit('replay', { events: pending, count: pending.length });
    }

    // ── Send current cached state ─────────────────────────────────────────────
    if (lastHealth.length) {
      socket.emit('service_health', { data: lastHealth, ts: Date.now() });
    }
    if (lastStats) {
      socket.emit('platform_stats', { data: lastStats, ts: Date.now() });
    }

    // ── Message handling ──────────────────────────────────────────────────────
    socket.on('message', (msg) => {
      if (!rateLimiter()) {
        socket.emit('error', { code: 'RATE_LIMITED', message: 'Too many events', ts: Date.now() });
        socket.disconnect(true);  // code 4029 — rate limit breach
        return;
      }
    });

    // ── Explicit room join requests (guarded) ─────────────────────────────────
    socket.on('join:room', async (room) => {
      if (!rateLimiter()) {
        socket.emit('error', { code: 'RATE_LIMITED', ts: Date.now() });
        socket.disconnect(true);
        return;
      }
      if (typeof room !== 'string' || !guardRoomJoin(socket, room)) {
        socket.emit('error', { code: 'ROOM_FORBIDDEN', room, ts: Date.now() });
        return;
      }
      await socket.join(room);
      socket.emit('room:joined', { room, ts: Date.now() });
    });

    // ── Pong handler (client responds to server heartbeat pings) ─────────────
    socket.on('pong', (data) => {
      socket.data.lastPong = Date.now();
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[WS] Disconnected — ns=${namespacePath} user=${userId} ip=${ip} reason=${reason}`);
      presenceRemove(orgId, userId);
      emitPresence('offline', { userId, orgId });
    });

    socket.on('error', (err) => {
      console.warn(`[WS] Socket error — ns=${namespacePath} user=${userId}:`, err.message);
    });
  });
}

// ── Attach handlers to all namespaces ────────────────────────────────────────
attachConnectionHandler(NS_DASHBOARD, '/dashboard');
attachConnectionHandler(NS_IR,        '/ir');
attachConnectionHandler(NS_JOBS,      '/jobs');
attachConnectionHandler(NS_ADMIN,     '/admin');
attachConnectionHandler(NS_CTM,       '/ctm');

// ── Heartbeat pump (server -> all clients every 30s) ─────────────────────────
setInterval(() => {
  io.emit('ping', { ts: Date.now() });
}, config.heartbeat.intervalMs);

// ── Metrics pump ──────────────────────────────────────────────────────────────
setInterval(async () => {
  const health = await collectServiceHealth();
  lastHealth   = health;
  broadcastToAll('service_health', health);
}, config.intervals.health);

setInterval(async () => {
  const stats = await collectPlatformStats();
  if (stats) {
    lastStats = stats;
    broadcastToAll('platform_stats', stats);
  }
}, config.intervals.metrics);

// ── HTTP routes ───────────────────────────────────────────────────────────────

// Health check (used by docker-compose healthcheck) — intentionally public
app.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    service:   'realtime-service',
    uptime:    process.uptime(),
    redis:     redisAvailable,
    ts:        new Date().toISOString(),
  });
});

// ── Internal metrics guard ────────────────────────────────────────────────────
// /metrics exposes tenant presence data (orgId enumeration) and socket topology.
// Gate: localhost/private-network source IP  OR  valid INTERNAL_SERVICE_SECRET
// bearer token.  Public callers receive 403.
const INTERNAL_SECRET = config.internalServiceSecret || null;

// RFC-1918 + loopback ranges (IPv4 and IPv4-mapped-IPv6)
const PRIVATE_IP_RE = /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1$|::ffff:127\.|::ffff:10\.|::ffff:172\.(1[6-9]|2\d|3[01])\.|::ffff:192\.168\.)/;

function isInternalRequest(req) {
  // Express places the real remote address in req.socket.remoteAddress;
  // req.ip honours trust-proxy but we do NOT enable trust-proxy here to
  // prevent IP spoofing via X-Forwarded-For.
  const addr = req.socket.remoteAddress || '';
  if (PRIVATE_IP_RE.test(addr)) return true;

  // Bearer token path (for same-network internal services on non-localhost IPs).
  // Use timing-safe comparison to prevent timing-oracle attacks on the secret.
  if (INTERNAL_SECRET) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (token && token.length === INTERNAL_SECRET.length) {
      const tokenBuf  = Buffer.from(token);
      const secretBuf = Buffer.from(INTERNAL_SECRET);
      if (crypto.timingSafeEqual(tokenBuf, secretBuf)) return true;
    }
  }

  return false;
}

// Metrics endpoint — internal/IP-gated (contains tenant presence data)
app.get('/metrics', (req, res) => {
  if (!isInternalRequest(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const namespaceCounts = {};
  ['/dashboard', '/ir', '/jobs', '/admin', '/ctm'].forEach((ns) => {
    namespaceCounts[ns] = io.of(ns).sockets.size;
  });

  const presenceSnapshot = {};
  presence.forEach((users, orgId) => {
    presenceSnapshot[orgId] = users.size;
  });

  res.json({
    connected:       io.engine.clientsCount,
    namespaces:      namespaceCounts,
    presence:        presenceSnapshot,
    uptime:          process.uptime(),
    redisAvailable,
    ts:              new Date().toISOString(),
  });
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
// HTTP draining (incl. the socket.io server bound to it) is handled by
// initGracefulShutdown(server) below. Registered handlers run after the drain:
// notify connected clients to reconnect, then quit the Redis pub/sub clients.
registerShutdown('socket.io', async () => {
  io.emit('server:shutdown', { reconnectIn: 5000 });
  await new Promise((r) => setTimeout(r, 500));
  await new Promise((resolve) => io.close(() => resolve()));
});
registerShutdown('redis', async () => {
  if (publisher)  await publisher.quit().catch(() => {});
  if (subscriber) await subscriber.quit().catch(() => {});
});

// ── Startup ───────────────────────────────────────────────────────────────────
connectRedis().catch(() => {});

// Warm up JWKS cache at startup so first connection is fast
if (!config.jwt.bypassAuth) {
  _jwksVerifier.fetchJwks()
    .then((keys) => console.log(`[JWT] JWKS loaded — ${keys.length} key(s) cached`))
    .catch((err)  => console.warn('[JWT] JWKS prefetch failed (will retry per-connection):', err.message));
}

(async () => {
  lastHealth = await collectServiceHealth();
  lastStats  = await collectPlatformStats();
})();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[realtime-service] HTTP + WebSocket server listening on http://0.0.0.0:${PORT}`);
  console.log(`[realtime-service] Namespaces: /dashboard /ir /jobs /admin /ctm`);
  if (config.jwt.bypassAuth) {
    console.warn('[realtime-service] WARNING: JWT_BYPASS_AUTH=true — all connections accepted without verification');
  }
});

initGracefulShutdown(server);

// ── Publisher helper (for other services to import or call via HTTP) ──────────
// Other services publish events via Redis:
//
//   redis.publish('baalvion:events', JSON.stringify({
//     namespace: '/dashboard',
//     room:      `org:${orgId}`,
//     type:      'kpi_update',
//     data:      payload,
//   }));
//
// The subscriber above routes them to the correct namespace + room.

module.exports = { server, io, pushReplayEvent };

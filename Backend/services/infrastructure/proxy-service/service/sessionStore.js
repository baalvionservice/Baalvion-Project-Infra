'use strict';

/**
 * Server-side session + refresh-token management.
 *
 * Sessions are persisted in the `sessions` table and mirrored in Redis for
 * O(1) revocation checks on the hot auth path. Refresh tokens are opaque,
 * high-entropy strings; only their SHA-256 hash is stored. Each refresh
 * rotates the token. Access tokens carry `sessionId` + `tokenVersion`, which
 * are checked on every request so that logout / "log out everywhere" /
 * password change take effect immediately.
 *
 * Security posture: if Redis is unavailable we fall back to the database and
 * FAIL CLOSED (an unverifiable session is treated as invalid).
 */

const crypto = require('crypto');
const db = require('../models');
const { getRedis } = require('./redisClient');
const config = require('../config/appConfig');
const logger = require('./logger');

const REFRESH_PREFIX = 'bnr_';
const SESSION_KEY = (id) => `sess:active:${id}`;
const USER_TV_KEY = (id) => `user:tv:${id}`;
const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT_SESSIONS || 10);

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

function durationToMs(d, fallback) {
  if (typeof d === 'number') return d;
  const m = /^(\d+)\s*([smhd])$/.exec(String(d || '').trim());
  if (!m) return fallback;
  const n = Number(m[1]);
  return { s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[m[2]] * n;
}

const REFRESH_TTL_MS = durationToMs(config.jwt.refreshExpiresIn, 7 * 864e5);

function newRefreshToken() {
  return REFRESH_PREFIX + crypto.randomBytes(48).toString('hex');
}

// ── Create a session at login ─────────────────────────────────────────────────
async function createSession({ userId, orgId, tokenVersion = 0, ipAddress, userAgent }) {
  const sessionId = crypto.randomUUID();
  const refreshToken = newRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await db.sessions.create({
    id: sessionId,
    org_id: orgId,
    user_id: userId,
    refresh_token_hash: sha256(refreshToken),
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    token_version: tokenVersion,
    expires_at: expiresAt,
    last_seen_at: new Date(),
  });

  const redis = getRedis();
  if (redis) {
    await redis.set(SESSION_KEY(sessionId), String(tokenVersion), 'PX', REFRESH_TTL_MS);
    await redis.set(USER_TV_KEY(userId), String(tokenVersion), 'EX', 3600);
  }

  await enforceConcurrencyLimit(userId);
  return { sessionId, refreshToken, expiresAt };
}

// ── Validate an access token's session on every request ───────────────────────
async function isSessionActive(sessionId, claimTokenVersion, userId) {
  if (!sessionId) return false;
  const redis = getRedis();

  if (redis) {
    try {
      const exists = await redis.exists(SESSION_KEY(sessionId));
      if (!exists) {
        // Cold cache (e.g. after restart): confirm against DB before rejecting.
        const ok = await dbSessionActive(sessionId);
        if (!ok) return false;
      }
      const currentTv = await currentTokenVersion(userId);
      return Number(claimTokenVersion) === Number(currentTv);
    } catch (err) {
      logger.error('[session] redis check failed, falling back to DB:', err.message);
    }
  }

  // DB fallback — fail closed
  const active = await dbSessionActive(sessionId);
  if (!active) return false;
  const user = await db.users.findByPk(userId);
  const currentTv = user ? Number(user.token_version || 0) : null;
  return currentTv !== null && Number(claimTokenVersion) === currentTv;
}

async function dbSessionActive(sessionId) {
  const s = await db.sessions.findByPk(sessionId);
  if (!s) return false;
  if (s.revoked_at) return false;
  if (s.expires_at && new Date(s.expires_at).getTime() < Date.now()) return false;
  return true;
}

async function currentTokenVersion(userId) {
  const redis = getRedis();
  if (redis) {
    const cached = await redis.get(USER_TV_KEY(userId));
    if (cached !== null) return Number(cached);
  }
  const user = await db.users.findByPk(userId);
  const tv = user ? Number(user.token_version || 0) : 0;
  if (redis) await redis.set(USER_TV_KEY(userId), String(tv), 'EX', 3600);
  return tv;
}

// ── Rotate refresh token ──────────────────────────────────────────────────────
async function rotateRefresh(refreshToken) {
  if (!refreshToken) return null;
  const hash = sha256(refreshToken);
  const session = await db.sessions.findOne({ where: { refresh_token_hash: hash } });

  if (!session || session.revoked_at) return null;
  if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
    await revokeSession(session.id);
    return null;
  }

  const newToken = newRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  await session.update({
    refresh_token_hash: sha256(newToken),
    expires_at: expiresAt,
    last_seen_at: new Date(),
  });

  const redis = getRedis();
  if (redis) await redis.set(SESSION_KEY(session.id), String(session.token_version || 0), 'PX', REFRESH_TTL_MS);

  return {
    sessionId: session.id,
    userId: session.user_id,
    orgId: session.org_id,
    refreshToken: newToken,
    expiresAt,
  };
}

// ── Revocation ────────────────────────────────────────────────────────────────
async function revokeSession(sessionId) {
  await db.sessions.update({ revoked_at: new Date() }, { where: { id: sessionId, revoked_at: null } });
  const redis = getRedis();
  if (redis) await redis.del(SESSION_KEY(sessionId));
}

async function revokeSessionByRefresh(refreshToken) {
  if (!refreshToken) return;
  const session = await db.sessions.findOne({ where: { refresh_token_hash: sha256(refreshToken) } });
  if (session) await revokeSession(session.id);
}

/** Log a user out of every device + invalidate all outstanding access tokens. */
async function revokeAllForUser(userId) {
  await db.sessions.update({ revoked_at: new Date() }, { where: { user_id: userId, revoked_at: null } });
  const user = await db.users.findByPk(userId);
  const nextTv = (user ? Number(user.token_version || 0) : 0) + 1;
  await db.users.update({ token_version: nextTv }, { where: { id: userId } });

  const redis = getRedis();
  if (redis) await redis.set(USER_TV_KEY(userId), String(nextTv), 'EX', 3600);
  return nextTv;
}

async function enforceConcurrencyLimit(userId) {
  const active = await db.sessions.findAll({
    where: { user_id: userId, revoked_at: null },
    order: [['created_at', 'DESC']],
  });
  if (active.length > MAX_CONCURRENT) {
    for (const stale of active.slice(MAX_CONCURRENT)) await revokeSession(stale.id);
  }
}

/** Revoke a session only if it belongs to the given org (prevents cross-tenant revocation). */
async function revokeSessionForOrg(sessionId, orgId) {
  const session = await db.sessions.findByPk(sessionId);
  if (!session || session.org_id !== orgId) return false;
  await revokeSession(sessionId);
  return true;
}

async function listSessions(userId) {
  const rows = await db.sessions.findAll({
    where: { user_id: userId, revoked_at: null },
    order: [['last_seen_at', 'DESC']],
  });
  return rows.map((s) => ({
    id: s.id,
    ipAddress: s.ip_address,
    userAgent: s.user_agent,
    createdAt: s.created_at,
    lastSeenAt: s.last_seen_at,
    expiresAt: s.expires_at,
  }));
}

module.exports = {
  createSession,
  isSessionActive,
  rotateRefresh,
  revokeSession,
  revokeSessionByRefresh,
  revokeSessionForOrg,
  revokeAllForUser,
  listSessions,
  currentTokenVersion,
};

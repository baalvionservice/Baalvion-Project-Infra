'use strict';
// Server-side session (keyed by JWT `sid`). Now also binds CSRF token + UA/IP fingerprint.
//   key:   bff:session:<sid>
//   value: { sessionId, userId, orgId, roles[], source, csrfToken, uaHash, ipHash, createdAt, expiresAt }
const redis = require('./redis');
const { revokeJti, ttlFromExp } = require('@baalvion/auth-node');

const KEY = (sid) => `bff:session:${sid}`;

async function createSession({ sid, userId, orgId, roles, exp, csrfToken, uaHash, ipHash, geo }) {
  const now = Math.floor(Date.now() / 1000);
  const session = {
    sessionId: sid,
    userId:    String(userId),
    orgId:     orgId ?? null,
    roles:     Array.isArray(roles) ? roles : [],
    source:    'auth-service',
    csrfToken: csrfToken || null,
    uaHash:    uaHash || null,
    ipHash:    ipHash || null,
    geo:       geo    || null,   // Phase 7 — { country, source } from CDN headers at login time
    createdAt: now,
    expiresAt: exp ?? null,
  };
  const ttl = exp ? Math.max(60, exp - now) : 7 * 24 * 3600;
  await redis.set(KEY(sid), JSON.stringify(session), 'EX', ttl);
  return session;
}

// Merge updates into an existing session. Returns the updated session, or null if session not found.
async function updateSession(sid, updates) {
  if (!sid) return null;
  const key = KEY(sid);
  const raw = await redis.get(key);
  if (!raw) return null;
  const session = { ...JSON.parse(raw), ...updates };
  const now = Math.floor(Date.now() / 1000);
  const ttl = session.expiresAt ? Math.max(60, session.expiresAt - now) : 7 * 24 * 3600;
  await redis.set(key, JSON.stringify(session), 'EX', ttl);
  return session;
}

async function getSession(sid) {
  if (!sid) return null;
  const s = await redis.get(KEY(sid));
  return s ? JSON.parse(s) : null;
}

async function destroySession(sid) { if (sid) await redis.del(KEY(sid)); }

// Revoke = blacklist the access jti (rejected everywhere) + delete the session.
async function revoke(sid, jti, exp) {
  if (jti) await revokeJti(redis, jti, ttlFromExp(exp));
  await destroySession(sid);
}

module.exports = { createSession, getSession, destroySession, revoke, updateSession, KEY };

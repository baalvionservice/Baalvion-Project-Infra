'use strict';
const { AppError }            = require('../utils/errors');
const { lookupIp, distanceKm } = require('../utils/geo');
const { parseDevice, deviceFingerprint } = require('../utils/deviceParser');
const redis                    = require('../config/redis');
const logger                   = require('../utils/logger');
const config                   = require('../config/appConfig');

let _db;
function getDb() {
    if (!_db) _db = require('../models');
    return _db;
}

// ── Risk scoring ──────────────────────────────────────────────────────────────
// Returns a score 0-100 and a list of triggered signals

async function computeRiskScore(session, previousSessions) {
    const signals = [];
    let score = 0;

    const geo = lookupIp(session.ip_address);

    // New country never seen before
    const knownCountries = new Set(previousSessions.map(s => s.geo_country).filter(Boolean));
    if (geo.country && knownCountries.size > 0 && !knownCountries.has(geo.country)) {
        signals.push({ type: 'new_country', country: geo.country, weight: 20 });
        score += 20;
    }

    // Impossible travel check — compare against the most recent prior session
    const lastSession = previousSessions[0];
    if (lastSession && geo.lat && geo.lon && lastSession.geo_lat && lastSession.geo_lon) {
        const dist = distanceKm(lastSession.geo_lat, lastSession.geo_lon, geo.lat, geo.lon);
        const timeDiffH = (new Date(session.created_at) - new Date(lastSession.last_seen_at)) / 3_600_000;
        if (dist !== null && timeDiffH > 0) {
            const requiredSpeedKmh = dist / timeDiffH;
            if (requiredSpeedKmh > config.risk.impossibleTravelKmh) {
                signals.push({ type: 'impossible_travel', requiredSpeedKmh: Math.round(requiredSpeedKmh), dist: Math.round(dist), weight: 40 });
                score += 40;
            }
        }
    }

    // TOR / anonymous proxy exit node (placeholder — in production integrate with IPinfo or similar)
    // Uncomment and wire up an IP reputation API to enable:
    // if (await checkTorExit(session.ip_address)) { signals.push({ type: 'tor_exit', weight: 30 }); score += 30; }

    // Device fingerprint mismatch (session was created with a known device that changed drastically)
    const device = parseDevice(session.user_agent);
    const fp     = deviceFingerprint(session.user_agent);
    const knownFps = new Set(previousSessions.map(s => s.device_fingerprint).filter(Boolean));
    if (knownFps.size > 0 && !knownFps.has(fp)) {
        signals.push({ type: 'new_device', fingerprint: fp, weight: 15 });
        score += 15;
    }

    // Many active sessions from different IPs simultaneously
    const activeIps = new Set(previousSessions.filter(s => !s.revoked_at).map(s => s.ip_address));
    if (activeIps.size >= 5) {
        signals.push({ type: 'many_active_ips', count: activeIps.size, weight: 10 });
        score += 10;
    }

    const riskLevel = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';

    return { score: Math.min(100, score), level: riskLevel, signals, geo, device, fingerprint: fp };
}

// ── Session enrichment & storage ──────────────────────────────────────────────

async function enrichAndUpdateSession(sessionId, ipAddress, userAgent) {
    const db     = getDb();
    const geo    = lookupIp(ipAddress);
    const device = parseDevice(userAgent);
    const fp     = deviceFingerprint(userAgent);

    await db.sequelize.query(
        `UPDATE auth.sessions
         SET geo_country = $1, geo_region = $2, geo_city = $3, geo_lat = $4, geo_lon = $5,
             geo_timezone = $6, device_browser = $7, device_os = $8, device_type = $9,
             device_fingerprint = $10, last_seen_at = NOW()
         WHERE id = $11`,
        { bind: [geo.country, geo.region, geo.city, geo.lat, geo.lon,
                 geo.timezone, device.browser, device.os, device.type, fp, sessionId] }
    );
}

// ── List sessions for a user ──────────────────────────────────────────────────

async function listUserSessions(userId, { page = 1, limit = 20, includeRevoked = false } = {}) {
    const db     = getDb();
    const offset = (page - 1) * limit;
    const revFilter = includeRevoked ? '' : 'AND s.revoked_at IS NULL AND s.expires_at > NOW()';

    const [sessions, [{ count }]] = await Promise.all([
        db.sequelize.query(
            `SELECT s.id, s.user_id, s.org_id, s.ip_address, s.user_agent,
                    s.geo_country, s.geo_region, s.geo_city, s.geo_timezone,
                    s.device_browser, s.device_os, s.device_type,
                    s.risk_score, s.risk_level, s.risk_signals,
                    s.created_at, s.last_seen_at, s.expires_at, s.revoked_at
             FROM auth.sessions s
             WHERE s.user_id = $1 ${revFilter}
             ORDER BY s.last_seen_at DESC
             LIMIT $2 OFFSET $3`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [userId, limit, offset] }
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS count FROM auth.sessions s WHERE s.user_id = $1 ${revFilter}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [userId] }
        ),
    ]);

    return { items: sessions, total: count, page, limit, hasMore: offset + limit < count };
}

// ── Get single session detail ─────────────────────────────────────────────────

async function getSessionDetail(sessionId, userId) {
    const db = getDb();
    const [session] = await db.sequelize.query(
        `SELECT s.*, u.email, u.full_name
         FROM auth.sessions s
         JOIN auth.users u ON u.id = s.user_id
         WHERE s.id = $1`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [sessionId] }
    );
    if (!session) throw new AppError('NOT_FOUND', 'Session not found', 404);
    // Non-admins can only view their own sessions
    if (userId && session.user_id !== userId) throw new AppError('FORBIDDEN', 'Access denied', 403);
    return session;
}

// ── Revoke a session ──────────────────────────────────────────────────────────

async function revokeSession(sessionId, requestingUserId, isAdmin = false) {
    const db = getDb();
    const [session] = await db.sequelize.query(
        'SELECT id, user_id FROM auth.sessions WHERE id = $1',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [sessionId] }
    );
    if (!session) throw new AppError('NOT_FOUND', 'Session not found', 404);
    if (!isAdmin && String(session.user_id) !== String(requestingUserId)) {
        throw new AppError('FORBIDDEN', 'Cannot revoke another user\'s session', 403);
    }

    await db.sequelize.query('UPDATE auth.sessions SET revoked_at = NOW() WHERE id = $1', { bind: [sessionId] });
    await db.sequelize.query(
        'UPDATE auth.refresh_tokens SET revoked_at = NOW() WHERE session_id = $1 AND revoked_at IS NULL',
        { bind: [sessionId] }
    );

    // Publish revocation event so auth-service can blacklist related JTIs
    const r = redis.getClient();
    if (r && redis.isAvailable()) {
        await r.publish('auth:events', JSON.stringify({
            type: 'session.revoked', sessionId, userId: session.user_id, revokedBy: requestingUserId,
        }));
    }

    logger.info({ sessionId, requestingUserId, isAdmin }, 'Session revoked');
}

// ── Revoke all sessions except the current one ────────────────────────────────

async function revokeAllSessions(userId, exceptSessionId) {
    const db = getDb();
    await db.sequelize.query(
        `UPDATE auth.sessions SET revoked_at = NOW()
         WHERE user_id = $1 AND revoked_at IS NULL AND id != $2`,
        { bind: [userId, exceptSessionId] }
    );
    await db.sequelize.query(
        `UPDATE auth.refresh_tokens rt SET revoked_at = NOW()
         FROM auth.sessions s
         WHERE rt.session_id = s.id AND s.user_id = $1 AND s.id != $2 AND rt.revoked_at IS NULL`,
        { bind: [userId, exceptSessionId] }
    );

    const r = redis.getClient();
    if (r && redis.isAvailable()) {
        await r.publish('auth:events', JSON.stringify({
            type: 'session.revoke_all', userId, exceptSessionId,
        }));
    }

    logger.info({ userId, exceptSessionId }, 'All other sessions revoked');
}

// ── Analyse login event — called by auth-service via internal API ─────────────

async function analyseLoginEvent({ sessionId, userId, ipAddress, userAgent }) {
    const db = getDb();

    // Fetch last 10 sessions for context
    const previousSessions = await db.sequelize.query(
        `SELECT ip_address, geo_country, geo_lat, geo_lon, device_fingerprint,
                last_seen_at, revoked_at, created_at
         FROM auth.sessions
         WHERE user_id = $1 AND id != $2
         ORDER BY last_seen_at DESC
         LIMIT 10`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [userId, sessionId] }
    );

    const sessionStub = { id: sessionId, ip_address: ipAddress, user_agent: userAgent, created_at: new Date() };
    const risk = await computeRiskScore(sessionStub, previousSessions);

    // Persist geo + device info + risk onto the session row
    await db.sequelize.query(
        `UPDATE auth.sessions
         SET geo_country = $1, geo_region = $2, geo_city = $3, geo_lat = $4, geo_lon = $5,
             geo_timezone = $6, device_browser = $7, device_os = $8, device_type = $9,
             device_fingerprint = $10, risk_score = $11, risk_level = $12, risk_signals = $13
         WHERE id = $14`,
        {
            bind: [
                risk.geo.country, risk.geo.region, risk.geo.city, risk.geo.lat, risk.geo.lon,
                risk.geo.timezone, risk.device.browser, risk.device.os, risk.device.type,
                risk.fingerprint, risk.score, risk.level, JSON.stringify(risk.signals),
                sessionId,
            ],
        }
    );

    if (risk.level === 'high') {
        logger.warn({ userId, sessionId, risk }, 'High-risk login detected');
        // Publish alert for notification service
        const r = redis.getClient();
        if (r && redis.isAvailable()) {
            await r.publish('auth:events', JSON.stringify({
                type: 'session.high_risk', userId, sessionId,
                riskScore: risk.score, signals: risk.signals,
            }));
        }
    }

    return risk;
}

// ── Admin: list all active sessions across platform ───────────────────────────

async function listAllSessions({ page = 1, limit = 50, userId, orgId, riskLevel } = {}) {
    const db     = getDb();
    const offset = (page - 1) * limit;
    const where  = ['s.revoked_at IS NULL', 's.expires_at > NOW()'];
    const bind   = [];

    if (userId)    { where.push(`s.user_id = $${bind.length + 1}`);    bind.push(userId); }
    if (orgId)     { where.push(`s.org_id  = $${bind.length + 1}`);    bind.push(orgId); }
    if (riskLevel) { where.push(`s.risk_level = $${bind.length + 1}`); bind.push(riskLevel); }

    const [sessions, [{ count }]] = await Promise.all([
        db.sequelize.query(
            `SELECT s.id, s.user_id, s.org_id, s.ip_address, s.user_agent,
                    s.geo_country, s.geo_city, s.device_browser, s.device_type,
                    s.risk_score, s.risk_level, s.created_at, s.last_seen_at, s.expires_at,
                    u.email, u.full_name
             FROM auth.sessions s
             JOIN auth.users u ON u.id = s.user_id
             WHERE ${where.join(' AND ')}
             ORDER BY s.risk_score DESC, s.last_seen_at DESC
             LIMIT $${bind.length + 1} OFFSET $${bind.length + 2}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [...bind, limit, offset] }
        ),
        db.sequelize.query(
            `SELECT COUNT(*)::int AS count FROM auth.sessions s WHERE ${where.join(' AND ')}`,
            { type: db.Sequelize.QueryTypes.SELECT, bind }
        ),
    ]);

    return { items: sessions, total: count, page, limit, hasMore: offset + limit < count };
}

// ── Session statistics for a user ─────────────────────────────────────────────

async function getUserSessionStats(userId) {
    const db = getDb();
    const [stats] = await db.sequelize.query(
        `SELECT
            COUNT(*) FILTER (WHERE revoked_at IS NULL AND expires_at > NOW())::int AS active_count,
            COUNT(*)::int AS total_count,
            COUNT(DISTINCT geo_country) FILTER (WHERE geo_country IS NOT NULL)::int AS countries,
            COUNT(DISTINCT device_fingerprint) FILTER (WHERE device_fingerprint IS NOT NULL)::int AS devices,
            MAX(last_seen_at) AS last_active,
            AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) AS avg_risk_score
         FROM auth.sessions WHERE user_id = $1`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [userId] }
    );
    return stats;
}

module.exports = {
    enrichAndUpdateSession,
    listUserSessions,
    getSessionDetail,
    revokeSession,
    revokeAllSessions,
    analyseLoginEvent,
    listAllSessions,
    getUserSessionStats,
};

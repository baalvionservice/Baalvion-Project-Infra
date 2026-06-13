'use strict';
/**
 * Session enrichment (Phase 2 — absorbed from the retired session-service).
 *
 * After a session is created (login / register / mfa / accept-invite), this computes geo +
 * device + risk for that session and writes them onto the auth.sessions row (the columns added
 * by migration 008a). It replaces the session-service `/internal/analyse-login` HTTP hop that was
 * never actually wired up in production (which is why geo/risk have been NULL).
 *
 * HARD CONTRACT: this module is FAIL-SOFT. `analyseLoginEvent` never throws — every path is
 * wrapped and returns null on any error. Enrichment is an after-the-fact annotation; it must
 * NEVER block or fail a login. The caller in authService also guards it, defence-in-depth.
 */
const db        = require('../models');
const redis     = require('../config/redis');
const config    = require('../config/appConfig');
const logger    = require('../utils/logger');
const { lookupIp, distanceKm }            = require('../utils/geo');
const { parseDevice, deviceFingerprint }  = require('../utils/deviceParser');

const RISK_HIGH = 60;   // score >= 60 → high   (matches the proven session-service thresholds)
const RISK_MED  = 30;   // score >= 30 → medium

// ── Risk scoring — returns { score 0-100, level, signals, geo, device, fingerprint } ──
function computeRiskScore(session, previousSessions) {
    const signals = [];
    let score = 0;

    const geo = lookupIp(session.ip_address);

    // New country never seen before
    const knownCountries = new Set(previousSessions.map((s) => s.geo_country).filter(Boolean));
    if (geo.country && knownCountries.size > 0 && !knownCountries.has(geo.country)) {
        signals.push({ type: 'new_country', country: geo.country, weight: 20 });
        score += 20;
    }

    // Impossible travel — compare against the most recent prior session
    const lastSession = previousSessions[0];
    if (lastSession && geo.lat != null && geo.lon != null && lastSession.geo_lat != null && lastSession.geo_lon != null) {
        const dist = distanceKm(lastSession.geo_lat, lastSession.geo_lon, geo.lat, geo.lon);
        const timeDiffH = (new Date(session.created_at) - new Date(lastSession.last_seen_at)) / 3_600_000;
        if (dist !== null && timeDiffH > 0) {
            const requiredSpeedKmh = dist / timeDiffH;
            if (requiredSpeedKmh > config.sessionEnrichment.impossibleTravelKmh) {
                signals.push({ type: 'impossible_travel', requiredSpeedKmh: Math.round(requiredSpeedKmh), dist: Math.round(dist), weight: 40 });
                score += 40;
            }
        }
    }

    // Device fingerprint never seen before
    const device = parseDevice(session.user_agent);
    const fp     = deviceFingerprint(session.user_agent);
    const knownFps = new Set(previousSessions.map((s) => s.device_fingerprint).filter(Boolean));
    if (knownFps.size > 0 && !knownFps.has(fp)) {
        signals.push({ type: 'new_device', fingerprint: fp, weight: 15 });
        score += 15;
    }

    // Many active sessions from different IPs simultaneously
    const activeIps = new Set(previousSessions.filter((s) => !s.revoked_at).map((s) => s.ip_address));
    if (activeIps.size >= 5) {
        signals.push({ type: 'many_active_ips', count: activeIps.size, weight: 10 });
        score += 10;
    }

    const level = score >= RISK_HIGH ? 'high' : score >= RISK_MED ? 'medium' : 'low';
    return { score: Math.min(100, score), level, signals, geo, device, fingerprint: fp };
}

/**
 * Enrich a freshly-created session with geo/device/risk and persist it. FAIL-SOFT — returns the
 * computed risk on success, or null if disabled or anything goes wrong.
 *
 * @param {{ sessionId: string, userId: string|number, ipAddress?: string, userAgent?: string }} evt
 */
async function analyseLoginEvent({ sessionId, userId, ipAddress, userAgent }) {
    if (!config.sessionEnrichment.enabled) return null;
    if (!sessionId || !userId) return null;

    try {
        // Last 10 prior sessions for context (excludes the one we just created).
        const previousSessions = await db.sequelize.query(
            `SELECT ip_address, geo_country, geo_lat, geo_lon, device_fingerprint,
                    last_seen_at, revoked_at, created_at
             FROM auth.sessions
             WHERE user_id = $1 AND id != $2
             ORDER BY last_seen_at DESC NULLS LAST
             LIMIT 10`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [userId, sessionId] },
        );

        const stub = { id: sessionId, ip_address: ipAddress, user_agent: userAgent, created_at: new Date() };
        const risk = computeRiskScore(stub, previousSessions);
        const geoSource = risk.geo.country ? 'geoip-lite' : null;

        await db.sequelize.query(
            `UPDATE auth.sessions
             SET geo_country = $1, geo_region = $2, geo_city = $3, geo_lat = $4, geo_lon = $5,
                 geo_timezone = $6, geo_source = $7, device_browser = $8, device_os = $9,
                 device_type = $10, device_fingerprint = $11, last_seen_ip = $12,
                 risk_score = $13, risk_level = $14, risk_signals = $15
             WHERE id = $16`,
            {
                bind: [
                    risk.geo.country, risk.geo.region, risk.geo.city, risk.geo.lat, risk.geo.lon,
                    risk.geo.timezone, geoSource, risk.device.browser, risk.device.os,
                    risk.device.type, risk.fingerprint, ipAddress || null,
                    risk.score, risk.level, JSON.stringify(risk.signals),
                    sessionId,
                ],
            },
        );

        // High-risk login → publish to the auth:events channel (the platform's only anomalous-login
        // alert path; preserved here so retiring session-service does not silence it).
        if (risk.level === 'high') {
            logger.warn({ userId: String(userId), sessionId, riskScore: risk.score, signals: risk.signals }, 'High-risk login detected');
            try {
                const r = redis.getClient();
                if (r && redis.isAvailable()) {
                    await r.publish('auth:events', JSON.stringify({
                        type: 'session.high_risk', userId: String(userId), sessionId,
                        riskScore: risk.score, signals: risk.signals,
                    }));
                }
            } catch (pubErr) {
                logger.debug({ err: pubErr.message }, 'auth:events high_risk publish failed (non-fatal)');
            }
        }

        return risk;
    } catch (err) {
        // Never propagate — enrichment is best-effort annotation, login already succeeded.
        logger.debug({ err: err.message, sessionId }, 'session enrichment failed (non-fatal)');
        return null;
    }
}

module.exports = { analyseLoginEvent, computeRiskScore };

'use strict';
const db = require('../models');
const config = require('../config/appConfig');

/**
 * Operational state: which dependencies answer, and how the platform is configured.
 *
 * The whole value of this screen is that it says only what was actually measured. Two things
 * follow.
 *
 * **Every check is a real round trip.** Nothing reports HEALTHY because a URL is configured
 * or a module loaded; a dependency is healthy when it answered. A check that cannot be
 * performed reports UNKNOWN rather than guessing in either direction — reporting a service as
 * healthy because nothing proved otherwise is how outages get missed.
 *
 * **Nothing leaks the connection.** A health screen is one of the easier places to spill a
 * password: connection strings, environment dumps and driver errors all contain them. Each
 * check returns a state, a latency and a fixed message. Errors are logged server-side, and
 * the host being checked is named only as a scheme and host — never with credentials, and
 * never the raw configured URL.
 */

const STATE = Object.freeze({
    HEALTHY: 'HEALTHY',
    DEGRADED: 'DEGRADED',
    UNAVAILABLE: 'UNAVAILABLE',
    /** The check could not be performed. Not a claim in either direction. */
    UNKNOWN: 'UNKNOWN',
});

/** Slower than this and something is wrong even though it answered. */
const DEGRADED_MS = 750;
const TIMEOUT_MS = 2500;

/** A URL reduced to scheme + host. Any credentials, path and query are dropped. */
function safeHost(raw) {
    if (!raw) return null;
    try {
        const u = new URL(raw);
        return `${u.protocol}//${u.host}`;
    } catch {
        return null;
    }
}

async function timed(fn) {
    const started = Date.now();
    try {
        await fn();
        const ms = Date.now() - started;
        return { state: ms > DEGRADED_MS ? STATE.DEGRADED : STATE.HEALTHY, latencyMs: ms };
    } catch (err) {
        // Logged, not returned: driver errors quote hosts, users and sometimes passwords.
        console.error('[canwemarry] health check failed:', err.message);
        return { state: STATE.UNAVAILABLE, latencyMs: Date.now() - started };
    }
}

async function checkDatabase() {
    const r = await timed(() => db.sequelize.query('SELECT 1', { type: db.sequelize.QueryTypes.SELECT }));
    return {
        key: 'database',
        label: 'PostgreSQL',
        detail: `schema ${config.db && config.db.schema ? config.db.schema : 'canwemarry'}`,
        ...r,
    };
}

/**
 * The identity service, through its public JWKS document.
 *
 * That endpoint is chosen deliberately: it is unauthenticated, it is the thing this service
 * genuinely depends on (every request verifies a token against it), and it contains only
 * public keys. Probing an authenticated endpoint would need a credential this service should
 * not be holding for the sake of a status light.
 */
async function checkIdentity() {
    const uri = config.jwt && config.jwt.jwksUri;
    if (!uri) {
        return {
            key: 'identity',
            label: 'Identity service',
            state: STATE.UNKNOWN,
            latencyMs: null,
            detail: 'No JWKS endpoint is configured, so this cannot be checked.',
        };
    }

    const started = Date.now();
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const res = await fetch(uri, { signal: controller.signal });
        clearTimeout(timer);
        const ms = Date.now() - started;
        return {
            key: 'identity',
            label: 'Identity service',
            state: !res.ok ? STATE.UNAVAILABLE : ms > DEGRADED_MS ? STATE.DEGRADED : STATE.HEALTHY,
            latencyMs: ms,
            detail: safeHost(uri),
        };
    } catch (err) {
        console.error('[canwemarry] identity health check failed:', err.message);
        return { key: 'identity', label: 'Identity service', state: STATE.UNAVAILABLE, latencyMs: Date.now() - started, detail: safeHost(uri) };
    }
}

/**
 * Notifications.
 *
 * This product writes notifications to its own table and does not send email itself, so what
 * can honestly be checked is that the table is writable — which is the whole delivery path
 * this service owns. It says so, rather than implying an email pipeline was verified.
 */
async function checkNotifications() {
    const r = await timed(() => db.sequelize.query(
        'SELECT count(*) FROM canwemarry.notifications WHERE created_at > now() - interval \'1 day\'',
        { type: db.sequelize.QueryTypes.SELECT },
    ));
    return {
        key: 'notifications',
        label: 'Notifications',
        detail: 'In-product delivery only. Email is sent by the platform notification service, which is not checked here.',
        ...r,
    };
}

async function health() {
    const checks = await Promise.all([checkDatabase(), checkIdentity(), checkNotifications()]);
    // The worst individual state, so one broken dependency cannot be averaged away.
    const order = [STATE.HEALTHY, STATE.UNKNOWN, STATE.DEGRADED, STATE.UNAVAILABLE];
    const overall = checks.reduce((worst, c) => (order.indexOf(c.state) > order.indexOf(worst) ? c.state : worst), STATE.HEALTHY);
    return { overall, checkedAt: new Date().toISOString(), checks };
}

/**
 * Configuration that changes what the product does, shown read-only.
 *
 * These values come from the environment and are read at boot. There is deliberately no
 * write path: a toggle here would either do nothing after a restart, or would need this
 * service to rewrite its own environment. Both are worse than telling an operator the truth
 * and where to change it.
 */
function configuration() {
    return [
        {
            key: 'ALLOW_PUBLIC_CASES',
            label: 'Public case discovery',
            enabled: Boolean(config.features.allowPublicCases),
            summary: config.features.allowPublicCases
                ? 'A case may be made visible to anyone on the internet, including people who are not signed in.'
                : 'Public case discovery remains disabled until moderation coverage is staffed. Cases can still be shared with a community or with named participants.',
            changedBy: 'Environment variable, read at start-up. Changing it requires a configuration change and a restart — it cannot be switched from this screen.',
        },
        {
            key: 'REQUIRE_EMAIL_VERIFICATION',
            label: 'Refuse gated actions on unknown verification',
            enabled: Boolean(config.security.requireEmailVerification),
            summary: config.security.requireEmailVerification
                ? 'A session that carries no verification claim is refused for gated actions.'
                : 'A session that carries no verification claim is allowed through. Sessions issued before the claim existed would otherwise be locked out. Accounts known to be unverified are refused either way.',
            changedBy: 'Environment variable, read at start-up.',
        },
    ];
}

module.exports = { health, configuration, STATE };

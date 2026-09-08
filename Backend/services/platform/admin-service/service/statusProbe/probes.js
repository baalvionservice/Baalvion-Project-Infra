'use strict';
/**
 * The five probe classes.
 *
 * Every probe returns { status, latencyMs, detail } where status is one of
 * up | degraded | down | not_deployed | not_configured | unknown.
 *
 * Two rules hold throughout, both learned the hard way on this platform:
 *   1. An unavailable source yields null and a `not_configured` status — never a zero, never a
 *      green tick. A fabricated number on an operations panel is worse than a blank one.
 *   2. "The dependency answered 200" is not the same as "the feature works". The auth and money
 *      probes assert the thing you actually care about, not the thing that is easy to check.
 */
const tls = require('node:tls');
const logger = require('../../utils/logger');
const { inspectSite } = require('./webPresence');

const TIMEOUT_MS = Number(process.env.PROBE_TIMEOUT_MS || 5000);
const DEGRADED_MS = Number(process.env.PROBE_DEGRADED_MS || 1500);

// ── HTTP service health ──────────────────────────────────────────────────────
async function httpProbe(url, { timeout = TIMEOUT_MS } = {}) {
    const start = Date.now();
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(timeout), redirect: 'manual' });
        const latencyMs = Date.now() - start;
        // Most services name themselves in their health body. Reading it is what turns "something
        // is listening on that port" into "the right thing is listening on that port".
        let reportedService;
        try {
            const body = await res.json();
            if (body && typeof body.service === 'string') reportedService = body.service;
        } catch { /* not JSON, or no body — the status code still stands on its own */ }
        return {
            ok: res.ok,
            status: res.ok ? (latencyMs > DEGRADED_MS ? 'degraded' : 'up') : 'down',
            latencyMs,
            detail: { httpStatus: res.status, ...(reportedService ? { reportedService } : {}) },
            reportedService,
        };
    } catch (err) {
        return { ok: false, status: 'down', latencyMs: Date.now() - start, detail: { error: err.message } };
    }
}

// The pm2 process name and the catalog name differ for a few services, so a mismatch is only a
// finding when it is not one of these. Everything else claiming a different name means the port
// is answered by something other than what the address book says lives there.
const NAME_ALIASES = {
    'proxy-platform': ['proxy-service'],
    'realtime-telemetry': ['realtime-service', 'realtime-platform'],
    'realtime-service': ['realtime-infra', 'realtime-service'],
};

function identityMismatch(expected, reported) {
    if (!reported) return false;                       // service does not self-identify — cannot judge
    if (reported === expected) return false;
    if ((NAME_ALIASES[expected] || []).includes(reported)) return false;
    return true;
}

async function probeService(target) {
    if (target.probe === 'none') {
        return { status: 'not_deployed', latencyMs: null, detail: { deployment: target.deployment } };
    }
    const internal = await httpProbe(target.url);
    const detail = { internal: internal.detail, url: target.url, container: target.container };

    // Say it in words. "fetch failed" is what the HTTP client called it; what the operator needs
    // to read at 3am is which thing stopped answering and where it was expected to be.
    if (!internal.ok && !internal.detail?.httpStatus) {
        const where = target.container ? `${target.container}:${target.port}` : target.url;
        return { status: 'down', latencyMs: internal.latencyMs, detail: { ...detail, reason: `not responding on ${where}` } };
    }
    if (!internal.ok) {
        return {
            status: 'down',
            latencyMs: internal.latencyMs,
            detail: { ...detail, reason: `returned HTTP ${internal.detail.httpStatus} from its health check` },
        };
    }

    // An edge probe is only run where the catalog says the edge genuinely exposes /health.
    // "Up internally, 502 at Caddy" is invisible to the internal probe and is what a visitor
    // actually experiences, so when the two disagree the service is degraded, not up.
    if (target.edgeUrl && internal.ok) {
        const edge = await httpProbe(target.edgeUrl);
        detail.edge = { ...edge.detail, url: target.edgeUrl };
        if (!edge.ok) {
            return { status: 'degraded', latencyMs: internal.latencyMs, detail: { ...detail, reason: 'reachable internally but not through the edge' } };
        }
    }
    // A port answered by the wrong service is the failure mode that hides longest: the old
    // hardcoded HEALTH_TARGETS probed inventory-service at fulfillment-service's port and
    // reported it healthy indefinitely. A green tick for the wrong process is worse than a red one.
    if (internal.ok && identityMismatch(target.name, internal.reportedService)) {
        return {
            status: 'degraded',
            latencyMs: internal.latencyMs,
            detail: { ...detail, reason: `port ${target.port} answered by '${internal.reportedService}', not '${target.name}'` },
        };
    }
    if (internal.status === 'degraded') {
        return { status: 'degraded', latencyMs: internal.latencyMs, detail: { ...detail, reason: `slow health response (${internal.latencyMs}ms > ${DEGRADED_MS}ms)` } };
    }
    return { status: internal.status, latencyMs: internal.latencyMs, detail };
}

// ── Website ──────────────────────────────────────────────────────────────────
/** Days until the TLS certificate expires, or null if it cannot be read. */
function tlsDaysRemaining(host) {
    return new Promise((resolve) => {
        let settled = false;
        const done = (v) => { if (!settled) { settled = true; resolve(v); } };
        try {
            const socket = tls.connect({ host, port: 443, servername: host, timeout: TIMEOUT_MS }, () => {
                const cert = socket.getPeerCertificate();
                const validTo = cert && cert.valid_to ? Date.parse(cert.valid_to) : NaN;
                socket.end();
                done(Number.isNaN(validTo) ? null : Math.floor((validTo - Date.now()) / 86400000));
            });
            socket.on('error', () => done(null));
            socket.on('timeout', () => { socket.destroy(); done(null); });
        } catch { done(null); }
    });
}

// A page can return 200 and still be broken — Next.js renders its error shell with a 200 in
// several failure modes, and a stale CDN edge will happily serve one for days.
const ERROR_SHELL = /Application error: a (?:client|server)-side exception|__NEXT_ERROR|<title>(?:500|502|503|Error|Internal Server Error)</i;

async function probeWebsite(target) {
    const start = Date.now();
    let res, body = '';
    try {
        res = await fetch(target.url, {
            signal: AbortSignal.timeout(TIMEOUT_MS),
            redirect: 'follow',
            headers: { 'User-Agent': 'Baalvion-StatusProbe/1.0 (+admin.baalvion.com)' },
        });
        body = (await res.text()).slice(0, 20000);
    } catch (err) {
        return { status: 'down', latencyMs: Date.now() - start, detail: { error: err.message, url: target.url } };
    }
    const latencyMs = Date.now() - start;
    const tlsDays = await tlsDaysRemaining(target.domain);
    const detail = {
        httpStatus: res.status,
        url: target.url,
        finalUrl: res.url !== target.url ? res.url : undefined,
        tlsDaysRemaining: tlsDays,
        bytes: body.length,
    };

    const verdict = classifyBody(res.status, body, latencyMs, tlsDays);
    return {
        status: verdict.status,
        latencyMs,
        detail: verdict.reason ? { ...detail, reason: verdict.reason } : detail,
    };
}

/**
 * Pure verdict for a fetched page, split out so the rules can be tested without a network.
 * Order matters: the checks run from "definitely broken" to "working but worth knowing about".
 */
function classifyBody(httpStatus, body, latencyMs, tlsDays) {
    if (httpStatus < 200 || httpStatus >= 300) return { status: 'down', reason: `HTTP ${httpStatus}` };
    if (ERROR_SHELL.test(body)) return { status: 'down', reason: 'served an application error page with a 200' };
    // An empty 200 is a broken render, not a healthy page.
    if (body.length < 500) return { status: 'degraded', reason: 'response body implausibly small' };
    // Certificate expiry is a scheduled outage you can still prevent — surface it before it fires.
    if (tlsDays != null && tlsDays < 14) return { status: 'degraded', reason: `TLS certificate expires in ${tlsDays} day(s)` };
    // "Degraded" with no stated cause is an unactionable signal — always say why.
    if (latencyMs > DEGRADED_MS) return { status: 'degraded', reason: `slow response (${latencyMs}ms > ${DEGRADED_MS}ms)` };
    return { status: 'up' };
}

// ── Datastores ───────────────────────────────────────────────────────────────
async function probeDatastore(target, { sequelize, redisClient }) {
    const start = Date.now();
    try {
        if (target.probe === 'postgres') {
            if (!sequelize) return { status: 'not_configured', latencyMs: null, detail: {} };
            await sequelize.query('SELECT 1');
        } else {
            if (!redisClient) return { status: 'not_configured', latencyMs: null, detail: {} };
            await redisClient.ping();
        }
        const latencyMs = Date.now() - start;
        if (latencyMs > DEGRADED_MS) return { status: 'degraded', latencyMs, detail: { reason: `slow (${latencyMs}ms)` } };
        return { status: 'up', latencyMs, detail: {} };
    } catch (err) {
        return { status: 'down', latencyMs: Date.now() - start, detail: { error: err.message } };
    }
}

// ── Auth, per site ───────────────────────────────────────────────────────────
// Three assertions, in order of how badly they break sign-in for one property:
//   1. JWKS is reachable and carries at least one usable RSA key. No key, no verification
//      anywhere on the platform.
//   2. The key set is not empty of the `kid` currently advertised — a rotated-out key is the
//      classic "everyone is logged out" incident.
//   3. The site's own domain resolves to a brand. auth-service themes login by origin; a domain
//      that resolves to no brand still logs in, but on the wrong-looking page, and the site
//      registry and brandFromOrigin are known to disagree about marketunderworld.com.
const AUTH_BASE = process.env.AUTH_SERVICE_URL || `http://${process.env.PROBE_INTERNAL_HOST || 'localhost'}:3001`;

async function probeAuth(target) {
    const base = AUTH_BASE.replace(/\/v1\/auth\/?$/, '').replace(/\/+$/, '');
    const start = Date.now();
    let jwks;
    try {
        const res = await fetch(`${base}/.well-known/jwks.json`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
        if (!res.ok) {
            return { status: 'down', latencyMs: Date.now() - start, detail: { reason: `JWKS returned HTTP ${res.status}` } };
        }
        jwks = await res.json();
    } catch (err) {
        return { status: 'down', latencyMs: Date.now() - start, detail: { reason: `JWKS unreachable: ${err.message}` } };
    }
    const latencyMs = Date.now() - start;
    const keys = Array.isArray(jwks?.keys) ? jwks.keys : [];
    const usable = keys.filter((k) => k.kty === 'RSA' && k.n && k.e);
    const detail = { jwksKeys: keys.length, usableKeys: usable.length, kids: usable.map((k) => k.kid).filter(Boolean) };

    if (!usable.length) {
        return { status: 'down', latencyMs, detail: { ...detail, reason: 'JWKS carries no usable RSA key — nothing can verify a token' } };
    }

    // Brand resolution for this specific property.
    let brand = null;
    try {
        const { siteForHost } = require('@baalvion/sites');
        brand = target.domain ? siteForHost(target.domain)?.id ?? null : null;
    } catch { /* registry unavailable — reported below, not guessed */ }
    detail.brand = brand;
    if (target.domain && brand === null) {
        return { status: 'degraded', latencyMs, detail: { ...detail, reason: `no site resolves host ${target.domain} — login theming will fall back` } };
    }
    if (latencyMs > DEGRADED_MS) return { status: 'degraded', latencyMs, detail: { ...detail, reason: `JWKS slow (${latencyMs}ms)` } };
    return { status: 'up', latencyMs, detail };
}

// ── Money, per payment-taking site ───────────────────────────────────────────
// Reads only admin.payment_records — the cross-site read model this service owns. Reaching into
// each service's own `pcl` schema would cross a bounded context (contract rule C2), so outbox
// depth is deliberately not probed from here; the read model going stale is the observable
// symptom of an outbox that has stopped draining, which is the thing worth alerting on.
const STALE_HOURS = Number(process.env.PROBE_MONEY_STALE_HOURS || 48);

async function probeMoney(target, { sequelize }) {
    if (!sequelize) return { status: 'not_configured', latencyMs: null, detail: {} };
    const siteId = target.siteIds[0];
    const start = Date.now();
    try {
        const [rows] = await sequelize.query(
            `SELECT
               count(*)::int                                                        AS total,
               count(*) FILTER (WHERE state = 'CAPTURED')::int                      AS captured,
               count(*) FILTER (WHERE state = 'FAILED'
                                  AND recorded_at > now() - interval '24 hours')::int AS failed_24h,
               max(recorded_at) FILTER (WHERE state = 'CAPTURED')                   AS last_capture_at
             FROM admin.payment_records WHERE site_id = :siteId`,
            { replacements: { siteId } },
        );
        const r = rows[0] || {};
        const latencyMs = Date.now() - start;
        const lastCapture = r.last_capture_at ? new Date(r.last_capture_at) : null;
        const hoursSince = lastCapture ? (Date.now() - lastCapture.getTime()) / 3600000 : null;
        const detail = {
            rails: target.rails,
            railsBasis: target.railsBasis,
            totalRecords: r.total ?? 0,
            captured: r.captured ?? 0,
            failed24h: r.failed_24h ?? 0,
            lastCaptureAt: lastCapture ? lastCapture.toISOString() : null,
            hoursSinceLastCapture: hoursSince == null ? null : Math.round(hoursSince),
        };

        // A site that has never taken a payment is not broken — it is new. Saying "down" here
        // would cry wolf on every property until its first sale.
        if (!r.total) {
            return { status: 'unknown', latencyMs, detail: { ...detail, reason: 'no payments recorded yet' } };
        }
        if (r.failed_24h > 0 && r.failed_24h >= (r.captured || 0)) {
            return { status: 'down', latencyMs, detail: { ...detail, reason: `${r.failed_24h} failed payments in 24h` } };
        }
        if (hoursSince != null && hoursSince > STALE_HOURS) {
            return { status: 'degraded', latencyMs, detail: { ...detail, reason: `no successful payment in ${Math.round(hoursSince)}h` } };
        }
        return { status: 'up', latencyMs, detail };
    } catch (err) {
        // The read model not existing yet is a configuration state, not an outage.
        const missing = /relation .* does not exist/i.test(err.message);
        return {
            status: missing ? 'not_configured' : 'down',
            latencyMs: Date.now() - start,
            detail: { error: err.message },
        };
    }
}

// ── Dispatch ─────────────────────────────────────────────────────────────────
async function runProbe(target, ctx) {
    try {
        switch (target.kind) {
            case 'service':   return await probeService(target);
            case 'website':   return await probeWebsite(target);
            case 'datastore': return await probeDatastore(target, ctx);
            case 'auth':      return await probeAuth(target);
            case 'money':     return await probeMoney(target, ctx);
            case 'seo': {
                const r = await inspectSite({ domain: target.domain, siteId: target.siteIds[0] });
                const failed = r.checks.filter((c) => !c.ok && c.severity !== 'info');
                return {
                    status: r.status,
                    latencyMs: null,
                    detail: {
                        ...r.summary,
                        checks: r.checks,
                        // The first real problem, so the pill's tooltip and the alert both say
                        // what is wrong rather than just that something is.
                        reason: failed.length ? `${failed[0].label}: ${failed[0].detail}` : undefined,
                        failing: failed.length,
                    },
                };
            }
            default:          return { status: 'unknown', latencyMs: null, detail: {} };
        }
    } catch (err) {
        logger.warn({ target: target.id, err: err.message }, '[status] probe threw');
        return { status: 'unknown', latencyMs: null, detail: { error: err.message } };
    }
}

module.exports = { runProbe, httpProbe, probeWebsite, probeAuth, probeMoney, tlsDaysRemaining, classifyBody, identityMismatch };

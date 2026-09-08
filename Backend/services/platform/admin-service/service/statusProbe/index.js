'use strict';
/**
 * The status prober: probe -> persist -> detect edges -> alert -> broadcast.
 *
 * Runs inside admin-service because that is where the pieces already are — the cross-site
 * payment read model the money probe needs, the RS256-authenticated API the console calls, and
 * the WebSocket server whose protocol already declares a service_health frame nothing ever sent.
 *
 * The obvious objection to hosting it here is real: if this process dies, so does the thing that
 * would have told you it died. That is what the dead-man's-switch heartbeat is for — an external
 * monitor watching for silence covers the one failure this design cannot see itself.
 *
 * Off by default. Set STATUS_PROBER=true to enable.
 */
const logger = require('../../utils/logger');
const { buildTargets, loadSites } = require('./targets');
const { runProbe } = require('./probes');
const { applyResult, recordAlertOutcome } = require('./state');
const { sendNtfy, sendHeartbeat, isConfigured } = require('@baalvion/notify-ntfy');

const INTERVAL_MS = Number(process.env.STATUS_PROBE_INTERVAL_MS || 60000);
const CONCURRENCY = Number(process.env.STATUS_PROBE_CONCURRENCY || 8);
const CONSOLE_URL = process.env.ADMIN_CONSOLE_URL || 'https://admin.baalvion.com/status';
const RETAIN_DAYS = Number(process.env.STATUS_PROBE_RETAIN_DAYS || 30);
// Above this many transitions in one sweep the failure is correlated, not independent, and is
// reported as a single digest instead of one push per target.
const DIGEST_THRESHOLD = Number(process.env.STATUS_DIGEST_THRESHOLD || 3);

let timer = null;
let running = false;
let lastRunAt = null;
let broadcastFn = null;
// target id -> epoch ms of its last run, for the slower-cadence probe classes.
const lastCheckedAt = new Map();

/** Bounded parallelism: 44 targets sequentially would take longer than the tick interval. */
async function mapLimit(items, limit, fn) {
    const out = new Array(items.length);
    let i = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (i < items.length) {
            const idx = i++;
            out[idx] = await fn(items[idx], idx);
        }
    });
    await Promise.all(workers);
    return out;
}

function alertFor(transition) {
    const { type, target, severity, cause, downMs, result } = transition;
    const site = target.siteIds[0] ? `[${target.siteIds[0]}] ` : '';
    if (type === 'opened') {
        // The headline states what the probe actually found; severity only sets how loudly it
        // arrives. Titling a down service "Degraded" because its severity is warning describes
        // the alert's importance instead of the fault, which is the wrong thing to read at 3am.
        const headline = result?.status === 'degraded' ? 'Degraded' : 'DOWN';
        return {
            title: `${headline}: ${site}${target.name}`,
            body: `${target.kind} · ${cause}`,
            severity,
            tags: [severity === 'critical' ? 'rotating_light' : 'warning'],
            clickUrl: CONSOLE_URL,
        };
    }
    const mins = downMs != null ? Math.max(1, Math.round(downMs / 60000)) : null;
    return {
        title: `Recovered: ${site}${target.name}`,
        body: mins ? `Back up after ${mins} minute(s).` : 'Back up.',
        severity: 'info',
        tags: ['white_check_mark'],
        clickUrl: CONSOLE_URL,
    };
}

/**
 * One push for a correlated failure. Names the affected properties first — in a wide outage the
 * question is "which of my businesses are down", not "which of 70 processes exited".
 */
async function sendDigest(sequelize, transitions) {
    const opened = transitions.filter((t) => t.type === 'opened');
    const resolved = transitions.filter((t) => t.type === 'resolved');
    const critical = opened.filter((t) => t.severity === 'critical');
    const severity = critical.length ? 'critical' : opened.length ? 'warning' : 'info';

    const sites = [...new Set(opened.flatMap((t) => t.target.siteIds))];
    const kinds = opened.reduce((acc, t) => { acc[t.target.kind] = (acc[t.target.kind] || 0) + 1; return acc; }, {});

    const lines = [];
    if (opened.length) {
        lines.push(Object.entries(kinds).map(([k, n]) => `${n} ${k}${n > 1 ? 's' : ''}`).join(', ') + ' failing');
        if (sites.length) lines.push(`Properties: ${sites.slice(0, 8).join(', ')}${sites.length > 8 ? ` +${sites.length - 8}` : ''}`);
        // A handful of names makes the digest actionable without turning it into a wall of text.
        lines.push(...opened.slice(0, 5).map((t) => `· ${t.target.name}`));
        if (opened.length > 5) lines.push(`· …and ${opened.length - 5} more`);
    }
    if (resolved.length) lines.push(`${resolved.length} recovered`);

    const outcome = await sendNtfy({
        title: `${opened.length} failing across the estate`,
        body: lines.join('\n'),
        severity,
        tags: [severity === 'critical' ? 'rotating_light' : 'warning'],
        clickUrl: CONSOLE_URL,
    });

    if (outcome.sent) logger.warn({ opened: opened.length, resolved: resolved.length, sites }, '[status] digest alert sent');
    else logger.error({ reason: outcome.error || outcome.skipped }, '[status] digest alert NOT delivered');

    // Every incident in the digest is marked with the same outcome — they were all covered by
    // the one push, so none of them is silently unreported.
    for (const t of transitions) {
        try { await recordAlertOutcome(sequelize, t.incidentId, outcome.sent ? null : (outcome.error || outcome.skipped)); }
        catch (err) { logger.warn({ err: err.message }, '[status] recording alert outcome failed'); }
    }
}

async function tick({ sequelize, redisClient }) {
    if (running) { logger.warn('[status] previous sweep still running — skipping this tick'); return; }
    running = true;
    const started = Date.now();
    try {
        const targets = buildTargets();
        const siteById = new Map(loadSites().map((s) => [s.id, s]));

        // Targets that declare their own minimum interval (the web-presence checks) are skipped
        // until it has elapsed. Their last verdict stays on the board rather than blanking —
        // "checked 40 minutes ago and fine" is still an answer.
        const due = [];
        for (const t of targets) {
            if (!t.minIntervalMs) { due.push(t); continue; }
            const last = lastCheckedAt.get(t.id);
            if (!last || Date.now() - last >= t.minIntervalMs) due.push(t);
        }

        const results = await mapLimit(due, CONCURRENCY, async (target) => {
            const result = await runProbe(target, { sequelize, redisClient });
            if (target.minIntervalMs) lastCheckedAt.set(target.id, Date.now());
            let transition = null;
            try {
                transition = await applyResult({ sequelize, target, result, siteById });
            } catch (err) {
                // A persistence failure must not stop the sweep — the remaining targets still
                // need probing, and the in-memory result is still worth broadcasting.
                logger.error({ target: target.id, err: err.message }, '[status] persisting probe result failed');
            }
            return { target, result, transition };
        });

        // Alerts are sent after the sweep so one slow notification cannot delay probing.
        //
        // Correlated failures are digested. When the box, the database or the network goes, every
        // target fails in the SAME sweep — sending one push each turns a single outage into forty
        // notifications, which is how a person learns to ignore the channel entirely. Flap
        // suppression handles repetition over time; this handles breadth at one instant.
        const transitions = results.map((r) => r.transition).filter(Boolean);
        if (transitions.length > DIGEST_THRESHOLD) {
            await sendDigest(sequelize, transitions);
        } else {
            for (const transition of transitions) {
                const outcome = await sendNtfy(alertFor(transition));
                if (outcome.sent) {
                    logger.info({ target: transition.target.id, type: transition.type }, '[status] alert sent');
                } else {
                    logger.error({ target: transition.target.id, reason: outcome.error || outcome.skipped }, '[status] alert NOT delivered');
                }
                try {
                    await recordAlertOutcome(sequelize, transition.incidentId, outcome.sent ? null : (outcome.error || outcome.skipped));
                } catch (err) {
                    logger.warn({ err: err.message }, '[status] recording alert outcome failed');
                }
            }
        }

        lastRunAt = new Date().toISOString();
        if (broadcastFn) {
            try { broadcastFn('site_status', await buildRollup(sequelize)); }
            catch (err) { logger.warn({ err: err.message }, '[status] broadcast failed'); }
        }

        // A successful sweep is the heartbeat. Pinging before the work would defeat the point:
        // the switch must prove the prober is still doing its job, not merely still resident.
        const hb = await sendHeartbeat();
        if (hb.error) logger.warn({ err: hb.error }, '[status] heartbeat failed');

        logger.debug({ targets: targets.length, probed: due.length, ms: Date.now() - started }, '[status] sweep complete');
    } catch (err) {
        logger.error({ err: err.message }, '[status] sweep failed');
    } finally {
        running = false;
    }
}

// ── Rollup ───────────────────────────────────────────────────────────────────
// The shape the console renders: one row per site, five pills, plus the services behind it.
const WORST = ['up', 'unknown', 'not_configured', 'not_deployed', 'degraded', 'down'];
const worse = (a, b) => (WORST.indexOf(a) >= WORST.indexOf(b) ? a : b);

async function buildRollup(sequelize) {
    const targets = buildTargets();
    const sites = loadSites();
    const [stateRows] = await sequelize.query(
        'SELECT target_id, status, latency_ms, detail, changed_at, checked_at, last_ok_at FROM admin.probe_state',
    );
    const byId = new Map(stateRows.map((r) => [r.target_id, r]));
    const [incidentRows] = await sequelize.query(
        `SELECT id, target_id, site_id, severity, cause, opened_at, alert_sent_at, alert_error
           FROM admin.status_incidents WHERE status = 'open' ORDER BY opened_at DESC`,
    );

    const cell = (id) => {
        const s = byId.get(id);
        if (!s) return { status: 'unknown', latencyMs: null, detail: null, checkedAt: null };
        return {
            status: s.status,
            latencyMs: s.latency_ms,
            detail: s.detail,
            changedAt: s.changed_at,
            checkedAt: s.checked_at,
            lastOkAt: s.last_ok_at,
        };
    };

    const out = sites.map((site) => {
        const svcTargets = targets.filter((t) => t.kind === 'service' && t.siteIds.includes(site.id));
        const services = svcTargets.map((t) => ({
            name: t.name, tier: t.tier, container: t.container, port: t.port,
            deployment: t.deployment, ...cell(t.id),
        }));
        // A service nothing runs is excluded from the rollup: it cannot be "down", and letting
        // it colour the site red would make every property permanently broken. If that leaves
        // nothing at all, the answer is "no data" — reducing over an empty list would seed 'up'
        // and report a green tick for a property whose services were never probed.
        const probed = services.filter((s) => s.deployment !== 'not-deployed');
        const servicesStatus = probed.length ? probed.reduce((acc, s) => worse(acc, s.status), 'up') : 'unknown';

        const website  = site.status === 'live' ? cell(`website:${site.id}`) : { status: 'not_deployed', latencyMs: null };
        const seo      = site.status === 'live' ? cell(`seo:${site.id}`)     : { status: 'not_deployed', latencyMs: null };
        const auth     = site.status === 'live' ? cell(`auth:${site.id}`)    : { status: 'not_deployed', latencyMs: null };
        const payments = (site.rails || []).length ? cell(`money:${site.id}`) : { status: 'no_rails', latencyMs: null };

        const pills = { website, auth, payments, services: { status: servicesStatus }, data: cell('datastore:postgres') };

        // Overall is the worst ACTUAL fault, not the worst status. An unmeasured sub-probe —
        // a payment site that has simply not taken a payment yet, a service list nothing runs —
        // must not colour a property whose website and sign-in are provably healthy. Those
        // states stay visible on their own pill; they just do not raise an alarm on the card.
        const parts = [website.status, auth.status, servicesStatus, ...((site.rails || []).length ? [payments.status] : [])];
        const faults = parts.filter((s) => s === 'down' || s === 'degraded');
        const overall = faults.length
            ? faults.reduce((acc, s) => worse(acc, s), 'up')
            : (parts.some((s) => s === 'up') ? 'up' : 'unknown');

        return {
            id: site.id,
            name: site.name,
            domain: (site.domains || [])[0] || null,
            siteStatus: site.status,
            rails: site.rails || [],
            railsBasis: site.railsBasis,
            overall,
            pills,
            // Findability is reported alongside the property but deliberately NOT folded into
            // `overall`: a bad canonical is serious and slow, not an outage, and mixing it into
            // the up/down signal would either cry wolf or hide a real one.
            seo,
            services,
            incidents: incidentRows.filter((i) => i.site_id === site.id),
        };
    });

    // Platform-level targets that belong to no single property.
    const platform = targets
        .filter((t) => !t.siteIds.length && t.kind !== 'service')
        .map((t) => ({ id: t.id, kind: t.kind, name: t.name, ...cell(t.id) }));
    const orphanServices = targets
        .filter((t) => t.kind === 'service' && !t.siteIds.length)
        .map((t) => ({ name: t.name, tier: t.tier, deployment: t.deployment, container: t.container, ...cell(t.id) }));

    return {
        generatedAt: new Date().toISOString(),
        lastSweepAt: lastRunAt,
        sites: out.sort((a, b) => WORST.indexOf(b.overall) - WORST.indexOf(a.overall)),
        platform,
        unattachedServices: orphanServices,
        openIncidents: incidentRows.length,
        alerting: { channel: 'ntfy', configured: isConfigured(), heartbeat: Boolean(process.env.STATUS_HEARTBEAT_URL) },
    };
}

async function pruneHistory(sequelize) {
    const [rows] = await sequelize.query(
        `DELETE FROM admin.probe_results WHERE checked_at < now() - (:days || ' days')::interval RETURNING 1`,
        { replacements: { days: RETAIN_DAYS } },
    );
    if (rows.length) logger.info({ pruned: rows.length, retainDays: RETAIN_DAYS }, '[status] history pruned');
    return rows.length;
}

function startStatusProber({ sequelize, redisClient, broadcast } = {}) {
    if (timer) return;
    if (process.env.STATUS_PROBER !== 'true') {
        logger.info('[status] prober disabled (set STATUS_PROBER=true to enable)');
        return;
    }
    if (!isConfigured()) {
        // Loud on purpose. A monitoring system nobody is notified by looks identical to a
        // working one right up until the moment it matters.
        logger.warn('[status] NTFY_TOPIC is not set — incidents will be recorded but NOTHING will reach a phone');
    }
    broadcastFn = broadcast || null;

    const run = () => tick({ sequelize, redisClient });
    timer = setInterval(run, INTERVAL_MS);
    timer.unref();
    setTimeout(run, 2000).unref();                 // first sweep shortly after boot, not a full interval later

    // Daily prune, offset so it never lands on the same tick as a sweep.
    const pruneTimer = setInterval(() => pruneHistory(sequelize).catch(() => {}), 86400000);
    pruneTimer.unref();

    logger.info({ intervalMs: INTERVAL_MS, ntfy: isConfigured() }, '[status] prober started');
}

function stopStatusProber() {
    if (timer) clearInterval(timer);
    timer = null;
    broadcastFn = null;
}

module.exports = { startStatusProber, stopStatusProber, buildRollup, pruneHistory, tick };

'use strict';
/**
 * Alerting for the sanctions lists.
 *
 * A screening engine that quietly runs on stale lists is worse than one that visibly
 * fails: customers get cleared against a list that has since changed. So the refresh
 * has to be watched from two directions:
 *
 *   FAILURE   a refresh that fails or is refused alerts straight away (and only on the
 *             job's last attempt, so a retry that succeeds does not page anyone).
 *   SILENCE   a watchdog compares the last successful import of each list with the clock.
 *             It catches the failure the first path cannot: the refresh job not running
 *             at all.
 *
 * Alerts go out over ntfy (the one channel that reaches a phone on this platform with no
 * credentials, see packages/notify-ntfy). The message says what broke, never why it is
 * reachable. A heartbeat (SANCTIONS_HEARTBEAT_URL) is pinged only when every list is
 * fresh, so an external monitor turns the absence of pings into an alert even if this
 * whole service is down.
 */

const SOURCES = ['OFAC', 'UN', 'EU'];
const HOUR_MS = 3600 * 1000;

// The refresh runs every 6 hours; three missed cycles is a real problem, not a blip.
const maxAgeHours = (env = process.env) => Number(env.SANCTIONS_MAX_AGE_HOURS) || 18;
const REALERT_MS = 12 * HOUR_MS;

const lastAlertAt = new Map();

function ntfy() {
    try {
        // Resolved by path: the package is a workspace member, not a dependency of this service.
        return require('../../../../../../packages/notify-ntfy');
    } catch {
        return null;
    }
}

async function send(message, overrides = {}) {
    const lib = overrides.ntfy === undefined ? ntfy() : overrides.ntfy;
    if (!lib) return { sent: false, skipped: 'notify-ntfy not available' };
    return lib.sendNtfy(message);
}

/** Alert at most once per REALERT_MS per key, so a standing problem is not a flood. */
function shouldAlert(key, now = Date.now()) {
    const prev = lastAlertAt.get(key);
    if (prev && now - prev < REALERT_MS) return false;
    lastAlertAt.set(key, now);
    return true;
}

/**
 * Freshness of each list, read from the import log. Pure read.
 * @returns {Promise<Array>} one entry per list
 */
async function getStatus(sequelize, { now = Date.now(), env = process.env } = {}) {
    const limit = maxAgeHours(env);
    const [rows] = await sequelize.query(
        `SELECT p.list_source,
                count(*) FILTER (WHERE p.active)::int AS active_parties,
                max(p.source_list_date)::text AS list_date
           FROM tradeops.compliance_sanctioned_parties p
          WHERE p.source_id IS NOT NULL
          GROUP BY p.list_source`,
    );
    const [imports] = await sequelize.query(
        `SELECT DISTINCT ON (list_source) list_source, status, started_at, detail
           FROM tradeops.compliance_list_imports
          ORDER BY list_source, started_at DESC`,
    );
    const [successes] = await sequelize.query(
        `SELECT list_source, max(started_at) AS at
           FROM tradeops.compliance_list_imports
          WHERE status IN ('succeeded','unchanged')
          GROUP BY list_source`,
    );
    const by = (arr) => Object.fromEntries(arr.map((r) => [r.list_source, r]));
    const parties = by(rows);
    const attempts = by(imports);
    const wins = by(successes);

    return SOURCES.map((source) => {
        const win = wins[source];
        const ageHours = win ? (now - new Date(win.at).getTime()) / HOUR_MS : null;
        const attempt = attempts[source];
        return {
            list: source,
            active_parties: parties[source] ? parties[source].active_parties : 0,
            list_date: parties[source] ? parties[source].list_date : null,
            last_success_at: win ? new Date(win.at).toISOString() : null,
            age_hours: ageHours === null ? null : Math.round(ageHours * 10) / 10,
            last_attempt: attempt ? { status: attempt.status, at: new Date(attempt.started_at).toISOString() } : null,
            stale: ageHours === null || ageHours > limit,
            never_imported: !win,
            max_age_hours: limit,
        };
    });
}

/** A refresh that failed or was refused. Called by the job on its final attempt. */
async function alertRefreshFailure(results, overrides = {}) {
    const bad = (results || []).filter((r) => r.status === 'failed' || r.status === 'refused');
    if (!bad.length) return { sent: false, skipped: 'no failures' };
    // Error text can carry the download URL (one of them has an access token in it) and an ntfy
    // topic is not private, so URLs never go into an alert.
    const clean = (e) => String(e).replace(/https?:\/\/\S+/g, '[url]').slice(0, 160);
    const lines = bad.map((r) => `${r.source}: ${r.status}${r.error ? ` — ${clean(r.error)}` : ''}`);
    return send({
        title: 'Sanctions list refresh failed',
        body: `${lines.join('\n')}\nScreening is running on the previous list until this is fixed.`,
        severity: 'critical',
        tags: ['rotating_light'],
    }, overrides);
}

/**
 * The watchdog. Alerts for any stale list, and pings the heartbeat only when every list is
 * fresh. Never throws.
 */
async function checkFreshness(sequelize, overrides = {}) {
    const now = overrides.now ?? Date.now();
    let status;
    try {
        status = await getStatus(sequelize, { now, env: overrides.env });
    } catch (err) {
        // If we cannot even read the log, say so — silence here would hide the very thing watched.
        if (shouldAlert('status-unreadable', now)) {
            await send({ title: 'Sanctions list watchdog cannot read its status', body: String(err.message).slice(0, 200), severity: 'critical', tags: ['rotating_light'] }, overrides);
        }
        return { ok: false, error: err.message };
    }

    const stale = status.filter((s) => s.stale);
    for (const s of stale) {
        if (!shouldAlert(`stale:${s.list}`, now)) continue;
        const how = s.never_imported ? 'has never been imported' : `was last refreshed ${Math.round(s.age_hours)}h ago (limit ${s.max_age_hours}h)`;
        await send({
            title: `Sanctions list stale: ${s.list}`,
            body: `The ${s.list} list ${how}. Screening is using out-of-date data.`,
            severity: 'critical',
            tags: ['warning'],
        }, overrides);
    }

    if (!stale.length) {
        const lib = overrides.ntfy === undefined ? ntfy() : overrides.ntfy;
        if (lib && lib.sendHeartbeat) await lib.sendHeartbeat(overrides.heartbeatUrl ?? process.env.SANCTIONS_HEARTBEAT_URL);
    }
    return { ok: true, stale: stale.map((s) => s.list), status };
}

module.exports = { getStatus, alertRefreshFailure, checkFreshness, shouldAlert, maxAgeHours, SOURCES, _reset: () => lastAlertAt.clear() };

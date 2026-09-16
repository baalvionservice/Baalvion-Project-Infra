'use strict';
/**
 * Edge detection: turns a stream of probe results into incidents, and incidents into exactly
 * one notification each.
 *
 * The whole value of this file is what it does NOT do. A naive monitor alerts on every failed
 * probe, so a 5-second tick turns one bad minute into twelve pages, and after a week you stop
 * reading them. Here:
 *   - a target must fail FAILURE_THRESHOLD consecutive probes before an incident opens
 *   - it must then succeed RECOVERY_THRESHOLD consecutive probes before it resolves
 *   - one open incident per target is enforced by a partial unique index, so a prober restart
 *     mid-outage cannot open a second incident and alert again
 *   - a `not_deployed` or `not_configured` target never alerts: it is not broken, it is absent
 */
const logger = require('../../utils/logger');

const FAILURE_THRESHOLD  = Number(process.env.PROBE_FAILURE_THRESHOLD  || 3);
const RECOVERY_THRESHOLD = Number(process.env.PROBE_RECOVERY_THRESHOLD || 2);

const BAD = new Set(['down', 'degraded']);
// Absent is not broken. These states describe configuration, and paging on them would mean a
// permanent alert for every service you have declared but not deployed.
const NOT_AN_OUTAGE = new Set(['not_deployed', 'not_configured', 'unknown']);

/**
 * Severity is a property of what broke, not of how loudly it failed.
 * A payment-taking property being unreachable is the one thing that must always wake you.
 */
function severityFor(target, status, siteById) {
    if (status === 'degraded') return 'warning';
    const site = target.siteIds.length ? siteById.get(target.siteIds[0]) : null;
    const takesMoney = site && (site.rails || []).length > 0;

    if (target.kind === 'website') return takesMoney ? 'critical' : 'warning';
    if (target.kind === 'money') return 'critical';
    if (target.kind === 'auth') return takesMoney ? 'critical' : 'warning';
    if (target.kind === 'datastore') return 'critical';
    if (target.kind === 'service') {
        if (target.tier === 'tier-0') return 'critical';
        return takesMoney ? 'critical' : 'warning';
    }
    return 'warning';
}

/**
 * Apply one probe result. Returns a transition descriptor when the caller should notify,
 * otherwise null.
 */
async function applyResult({ sequelize, target, result, siteById }) {
    const siteId = target.siteIds[0] || null;
    const isBad = BAD.has(result.status);
    const neutral = NOT_AN_OUTAGE.has(result.status);

    // History first — it is append-only and independent of the state machine, so a bug here
    // still leaves a complete record to reconstruct from.
    await sequelize.query(
        `INSERT INTO admin.probe_results (target_id, kind, site_id, status, latency_ms, detail, checked_at)
         VALUES (:id, :kind, :siteId, :status, :latency, CAST(:detail AS jsonb), now())`,
        { replacements: {
            id: target.id, kind: target.kind, siteId, status: result.status,
            latency: result.latencyMs ?? null, detail: JSON.stringify(result.detail || {}),
        } },
    );

    const [prevRows] = await sequelize.query(
        'SELECT status, consecutive_failures, consecutive_successes FROM admin.probe_state WHERE target_id = :id',
        { replacements: { id: target.id } },
    );
    const prev = prevRows[0] || null;
    const failures  = isBad ? (prev?.consecutive_failures ?? 0) + 1 : 0;
    const successes = isBad ? 0 : (prev?.consecutive_successes ?? 0) + 1;
    const changed = !prev || prev.status !== result.status;

    await sequelize.query(
        `INSERT INTO admin.probe_state
           (target_id, kind, site_id, status, consecutive_failures, consecutive_successes,
            latency_ms, detail, last_ok_at, changed_at, checked_at)
         VALUES (:id, :kind, :siteId, :status, :failures, :successes, :latency,
                 CAST(:detail AS jsonb), CASE WHEN :isBad THEN NULL ELSE now() END, now(), now())
         ON CONFLICT (target_id) DO UPDATE SET
           status = EXCLUDED.status,
           consecutive_failures = EXCLUDED.consecutive_failures,
           consecutive_successes = EXCLUDED.consecutive_successes,
           latency_ms = EXCLUDED.latency_ms,
           detail = EXCLUDED.detail,
           last_ok_at = COALESCE(EXCLUDED.last_ok_at, admin.probe_state.last_ok_at),
           changed_at = CASE WHEN admin.probe_state.status IS DISTINCT FROM EXCLUDED.status
                             THEN now() ELSE admin.probe_state.changed_at END,
           checked_at = now()`,
        { replacements: {
            id: target.id, kind: target.kind, siteId, status: result.status,
            failures, successes, latency: result.latencyMs ?? null,
            detail: JSON.stringify(result.detail || {}), isBad,
        } },
    );

    if (neutral) return null;

    // ── Open ─────────────────────────────────────────────────────────────────
    if (isBad && failures === FAILURE_THRESHOLD) {
        const severity = severityFor(target, result.status, siteById);
        const cause = result.detail?.reason || result.detail?.error || `probe reported ${result.status}`;
        // ON CONFLICT DO NOTHING against the one-open-per-target index: if an incident is
        // already open we must not alert a second time for the same outage.
        const [rows] = await sequelize.query(
            `INSERT INTO admin.status_incidents (target_id, kind, site_id, severity, status, cause, detail)
             VALUES (:id, :kind, :siteId, :severity, 'open', :cause, CAST(:detail AS jsonb))
             ON CONFLICT (target_id) WHERE status = 'open' DO NOTHING
             RETURNING id, opened_at`,
            { replacements: {
                id: target.id, kind: target.kind, siteId, severity, cause,
                detail: JSON.stringify(result.detail || {}),
            } },
        );
        if (!rows.length) return null;                    // already open — stay quiet
        logger.warn({ target: target.id, severity, cause }, '[status] incident opened');
        return { type: 'opened', incidentId: rows[0].id, target, severity, cause, result };
    }

    // ── Resolve ──────────────────────────────────────────────────────────────
    if (!isBad && successes === RECOVERY_THRESHOLD) {
        const [rows] = await sequelize.query(
            `UPDATE admin.status_incidents
                SET status = 'resolved', resolved_at = now()
              WHERE target_id = :id AND status = 'open'
              RETURNING id, severity, opened_at`,
            { replacements: { id: target.id } },
        );
        if (!rows.length) return null;                    // nothing was open — nothing recovered
        const downMs = Date.now() - new Date(rows[0].opened_at).getTime();
        logger.info({ target: target.id, downMs }, '[status] incident resolved');
        return { type: 'resolved', incidentId: rows[0].id, target, severity: rows[0].severity, downMs, result };
    }

    if (changed) logger.debug({ target: target.id, status: result.status, failures }, '[status] state changed');
    return null;
}

/** Record whether the phone actually buzzed, so a silent alerting failure is visible. */
async function recordAlertOutcome(sequelize, incidentId, error) {
    await sequelize.query(
        `UPDATE admin.status_incidents
            SET alert_sent_at = CASE WHEN :err IS NULL THEN now() ELSE alert_sent_at END,
                alert_error   = :err
          WHERE id = :id`,
        { replacements: { id: incidentId, err: error || null } },
    );
}

module.exports = { applyResult, recordAlertOutcome, severityFor, FAILURE_THRESHOLD, RECOVERY_THRESHOLD };

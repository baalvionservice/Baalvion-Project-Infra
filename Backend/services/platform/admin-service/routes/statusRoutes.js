'use strict';
/**
 * Mission Control API — the per-site status rollup the admin console renders.
 *
 * Read-only and staff-admin gated. It exposes which properties are up, which services back
 * them, and what is currently broken; that is operational detail about the estate, not public
 * status-page material.
 */
const router = require('express').Router();
const { requireRole } = require('../middleware/authMiddleware');
// Reading the board is ordinary operations work, so it sits at staff-admin rather than the
// super_admin gate the rest of /v1/admin inherits — an operator who cannot see what is broken
// cannot act on it.
const staffAdmin = requireRole('super_admin', 'admin');
const { sequelize } = require('../models');
const { buildRollup } = require('../service/statusProbe');
const logger = require('../utils/logger');

const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// GET /v1/admin/status/sites — the whole board in one call.
router.get('/sites', staffAdmin, asyncH(async (req, res) => {
    const rollup = await buildRollup(sequelize);
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: rollup });
}));

// GET /v1/admin/status/sites/:siteId/history?hours=24
// Per-target timeline + uptime for one property. Uptime is computed from recorded probes only —
// a window with no probes reports null rather than 100%, which would claim an availability that
// was never measured.
router.get('/sites/:siteId/history', staffAdmin, asyncH(async (req, res) => {
    const hours = Math.min(Math.max(Number(req.query.hours) || 24, 1), 24 * 30);
    const [rows] = await sequelize.query(
        `SELECT target_id, kind,
                count(*)::int                                          AS samples,
                count(*) FILTER (WHERE status = 'up')::int              AS up_samples,
                round(avg(latency_ms))::int                             AS avg_latency_ms,
                max(checked_at)                                         AS last_checked_at
           FROM admin.probe_results
          WHERE site_id = :siteId AND checked_at > now() - (:hours || ' hours')::interval
          GROUP BY target_id, kind
          ORDER BY target_id`,
        { replacements: { siteId: req.params.siteId, hours } },
    );
    const [incidents] = await sequelize.query(
        `SELECT id, target_id, kind, severity, status, cause, opened_at, resolved_at,
                alert_sent_at, alert_error
           FROM admin.status_incidents
          WHERE site_id = :siteId AND opened_at > now() - (:hours || ' hours')::interval
          ORDER BY opened_at DESC LIMIT 200`,
        { replacements: { siteId: req.params.siteId, hours } },
    );
    res.set('Cache-Control', 'no-store');
    res.json({
        success: true,
        data: {
            siteId: req.params.siteId,
            windowHours: hours,
            targets: rows.map((r) => ({
                targetId: r.target_id,
                kind: r.kind,
                samples: r.samples,
                uptimePct: r.samples ? Number(((r.up_samples / r.samples) * 100).toFixed(2)) : null,
                avgLatencyMs: r.avg_latency_ms,
                lastCheckedAt: r.last_checked_at,
            })),
            incidents,
        },
    });
}));

// GET /v1/admin/status/incidents?status=open
router.get('/incidents', staffAdmin, asyncH(async (req, res) => {
    const status = req.query.status === 'resolved' ? 'resolved' : req.query.status === 'all' ? null : 'open';
    const [rows] = await sequelize.query(
        `SELECT id, target_id, kind, site_id, severity, status, cause, opened_at, resolved_at,
                alert_sent_at, alert_error
           FROM admin.status_incidents
          ${status ? 'WHERE status = :status' : ''}
          ORDER BY opened_at DESC LIMIT 200`,
        { replacements: status ? { status } : {} },
    );
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: rows });
}));

// POST /v1/admin/status/test-alert — prove the phone actually buzzes, without breaking anything.
// The most common way a monitoring system fails is that nobody ever verified the last hop.
router.post('/test-alert', staffAdmin, asyncH(async (req, res) => {
    const { sendNtfy, isConfigured } = require('@baalvion/notify-ntfy');
    if (!isConfigured()) {
        return res.status(409).json({ success: false, error: { code: 'NTFY_NOT_CONFIGURED', message: 'NTFY_TOPIC is not set' } });
    }
    const outcome = await sendNtfy({
        title: 'Baalvion status — test alert',
        body: `Triggered from the admin console by ${req.user?.email || 'an admin'}. Alerting works.`,
        severity: 'info',
        tags: ['bell'],
    });
    logger.info({ outcome, actor: req.user?.id }, '[status] test alert');
    res.status(outcome.sent ? 200 : 502).json({ success: outcome.sent, data: outcome });
}));

module.exports = router;

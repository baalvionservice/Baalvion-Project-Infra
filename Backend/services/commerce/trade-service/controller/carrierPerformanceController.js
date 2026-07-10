'use strict';
/**
 * Freight Management — Carrier Performance (Phase 3, Prompt 2). Read endpoints over
 * the periodic aggregate (tradeops.carrier_performance, migration 050) + an
 * admin-triggerable on-demand refresh, mirroring the /v1/monitoring/run pattern
 * already used for verification_monitor.
 */
const db = require('../models');
const carrierPerformance = require('../service/freight/carrierPerformance');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function toApi(r) {
    return {
        id: r.id, carrierId: r.carrier_id, periodStart: r.period_start, periodEnd: r.period_end,
        bookingsCount: r.bookings_count,
        onTimePct: r.on_time_pct != null ? Number(r.on_time_pct) : null,
        avgTransitDays: r.avg_transit_days != null ? Number(r.avg_transit_days) : null,
        etaAccuracyPct: r.eta_accuracy_pct != null ? Number(r.eta_accuracy_pct) : null,
        damageIncidentRate: r.damage_incident_rate != null ? Number(r.damage_incident_rate) : null,
        cancellationRate: r.cancellation_rate != null ? Number(r.cancellation_rate) : null,
        avgRating: r.avg_rating != null ? Number(r.avg_rating) : null,
        computedScore: r.computed_score != null ? Number(r.computed_score) : null,
        createdAt: r.created_at,
    };
}

// ── GET /v1/freight/carrier-performance ──────────────────────────────────────
const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'period_end'] });
        const where = {};
        if (req.query.carrierId) where.carrier_id = req.query.carrierId;
        const { count, rows } = await db.CarrierPerformance.findAndCountAll({ where, limit, offset, order });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

// ── GET /v1/freight/carrier-performance/:carrierId/latest ────────────────────
const latest = async (req, res, next) => {
    try {
        const row = await db.CarrierPerformance.findOne({
            where: { carrier_id: req.params.carrierId }, order: [['period_end', 'DESC']],
        });
        if (!row) return next(new AppError('NOT_FOUND', 'No performance history for this carrier yet', 404));
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

// ── POST /v1/freight/carrier-performance/refresh (admin-only) ────────────────
const refresh = async (req, res, next) => {
    try {
        if (!isAdmin(req)) throw new AppError('FORBIDDEN', 'Admin role required to trigger a performance refresh', 403);
        const periodDays = Number(req.body && req.body.period_days) || undefined;
        const result = await carrierPerformance.runCycle({ periodDays });
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

module.exports = { list, latest, refresh };

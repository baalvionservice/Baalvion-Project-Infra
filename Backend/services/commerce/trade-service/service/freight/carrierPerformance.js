'use strict';
/**
 * Freight Management — Carrier Performance aggregation (Phase 3, Prompt 2).
 *
 * Computes a rolling-period performance snapshot per carrier from
 * tradeops.freight_bookings (the existing booking lifecycle — migration 016) and
 * persists it to tradeops.carrier_performance (migration 050), denormalizing the
 * blended score onto carriers.performance_score. Runs periodically via the
 * freight_carrier_performance_refresh BullMQ job (queue/index.js +
 * queue/workers.js), never computed per-request — matching how the rest of this
 * service treats aggregate scoring (e.g. verification_monitor).
 *
 * Matches a tradeops.carriers row to its bookings by CODE: freight_bookings.carrier
 * is the 4-value coded-connector enum (dhl/fedex/ups/maersk) today; a dynamically
 * registered carrier with no bookings yet simply gets a zero-booking snapshot
 * (computed_score stays null) rather than an error — Phase 2's booking-engine
 * deepening is what lets a dynamic carrier accumulate real booking history.
 */

const db = require('../../models');

const DEFAULT_PERIOD_DAYS = 30;

function num(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function daysBetween(a, b) {
    return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / (24 * 60 * 60 * 1000);
}

/** Compute one carrier's performance stats over [periodStart, periodEnd). Read-only. */
async function computePeriodStats({ carrierCode, periodStart, periodEnd }) {
    const { Op } = db.Sequelize;
    const bookings = await db.FreightBooking.findAll({
        where: { carrier: carrierCode, created_at: { [Op.gte]: periodStart, [Op.lt]: periodEnd } },
    });

    const bookingsCount = bookings.length;
    if (bookingsCount === 0) {
        return {
            bookingsCount: 0, onTimePct: null, avgTransitDays: null, etaAccuracyPct: null,
            damageIncidentRate: null, cancellationRate: null, avgRating: null, computedScore: null,
        };
    }

    const delivered = bookings.filter((b) => b.status === 'delivered' && b.completed_at && b.booked_at);
    const cancelled = bookings.filter((b) => b.status === 'cancelled');

    const onTimeDelivered = delivered.filter((b) => b.estimated_delivery && new Date(b.completed_at) <= new Date(b.estimated_delivery));
    const onTimePct = delivered.length ? Number(((onTimeDelivered.length / delivered.length) * 100).toFixed(2)) : null;

    const transitDaysList = delivered.map((b) => daysBetween(b.booked_at, b.completed_at));
    const avgTransitDays = transitDaysList.length
        ? Number((transitDaysList.reduce((s, d) => s + d, 0) / transitDaysList.length).toFixed(2))
        : null;

    const etaAccurate = delivered.filter((b) => b.estimated_delivery && daysBetween(b.completed_at, b.estimated_delivery) <= 1);
    const etaAccuracyPct = delivered.length ? Number(((etaAccurate.length / delivered.length) * 100).toFixed(2)) : null;

    const cancellationRate = Number((cancelled.length / bookingsCount).toFixed(4));

    // Damage-incident rate: no direct freight_bookings→incidents link column exists
    // yet (Incident keys off shipment_id) — documented as a future join once every
    // booking is guaranteed a shipment_id; 0 here is "no data", not "no damage".
    const damageIncidentRate = null;
    const avgRating = null; // per-booking rating not modeled; carriers.rating is the operator-entered baseline instead.

    const weights = { onTime: 0.5, cancellation: 0.3, eta: 0.2 };
    let computedScore = null;
    if (onTimePct != null || etaAccuracyPct != null) {
        const onTimeComponent = onTimePct != null ? onTimePct : 70;
        const etaComponent = etaAccuracyPct != null ? etaAccuracyPct : 70;
        const cancellationComponent = (1 - cancellationRate) * 100;
        computedScore = Number((
            weights.onTime * onTimeComponent + weights.cancellation * cancellationComponent + weights.eta * etaComponent
        ).toFixed(2));
    }

    return { bookingsCount, onTimePct, avgTransitDays, etaAccuracyPct, damageIncidentRate, cancellationRate, avgRating, computedScore };
}

/**
 * Recompute + persist the performance snapshot for every carrier that has a coded
 * connector key (the only carriers freight_bookings.carrier can currently record —
 * see the module doc above). Idempotent per period via the (carrier_id,
 * period_start, period_end) unique constraint.
 */
async function runCycle({ periodDays = DEFAULT_PERIOD_DAYS, now = new Date() } = {}) {
    const periodEnd = now;
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const carriers = await db.CarrierDirectory.findAll({ where: { connector_key: { [db.Sequelize.Op.ne]: null } } });
    let processed = 0;
    for (const carrier of carriers) {
        const stats = await computePeriodStats({ carrierCode: carrier.connector_key, periodStart, periodEnd });
        const [row] = await db.CarrierPerformance.findOrCreate({
            where: { carrier_id: carrier.id, period_start: periodStart, period_end: periodEnd },
            defaults: {
                carrier_id: carrier.id, period_start: periodStart, period_end: periodEnd,
                bookings_count: stats.bookingsCount, on_time_pct: stats.onTimePct, avg_transit_days: stats.avgTransitDays,
                eta_accuracy_pct: stats.etaAccuracyPct, damage_incident_rate: stats.damageIncidentRate,
                cancellation_rate: stats.cancellationRate, avg_rating: stats.avgRating, computed_score: stats.computedScore,
            },
        });
        if (stats.computedScore != null) {
            await carrier.update({ performance_score: stats.computedScore });
        }
        processed += 1;
        void row;
    }
    return { processed, periodStart, periodEnd };
}

module.exports = { computePeriodStats, runCycle, DEFAULT_PERIOD_DAYS };

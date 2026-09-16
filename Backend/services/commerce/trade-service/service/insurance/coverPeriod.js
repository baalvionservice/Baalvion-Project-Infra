'use strict';
/**
 * Cover period + expiry (migration 066).
 *
 * `bindPolicy` used to set end_date = now + termMonths*30 (default 6 months) for
 * every policy, and nothing ever moved a policy off `active` — so cover was
 * effectively perpetual and a loss date was never checked against it.
 *
 * Cargo cover is per-voyage: it attaches when the goods leave the named
 * warehouse and terminates 60 days after discharge at the destination port (the
 * transit clause every Institute Cargo Clauses set carries). Where the policy is
 * bound against a real shipment we derive the period from that shipment's
 * departure and arrival; otherwise we fall back to a term policy.
 */
const { Op } = require('sequelize');
const db = require('../../models');

const DISCHARGE_GRACE_DAYS = 60;
const DAY_MS = 86400000;

/**
 * @returns {{startDate:Date, endDate:Date, basis:'voyage'|'term', detail:string}}
 */
function coverPeriodFor({ shipment, termMonths } = {}) {
    const now = new Date();

    if (shipment && (shipment.estimated_departure || shipment.actual_departure) && (shipment.estimated_arrival || shipment.actual_arrival)) {
        const start = new Date(shipment.actual_departure || shipment.estimated_departure);
        const arrival = new Date(shipment.actual_arrival || shipment.estimated_arrival);
        const end = new Date(arrival.getTime() + DISCHARGE_GRACE_DAYS * DAY_MS);
        return {
            startDate: start,
            endDate: end,
            basis: 'voyage',
            detail: `Attaches on departure ${start.toISOString().slice(0, 10)}, terminates ${DISCHARGE_GRACE_DAYS} days after arrival at destination.`,
        };
    }

    const months = Number(termMonths) || 6;
    return {
        startDate: now,
        endDate: new Date(now.getTime() + months * 30 * DAY_MS),
        basis: 'term',
        detail: `No sailing dates on the linked shipment — bound as a ${months}-month term policy instead of voyage cover.`,
    };
}

/** Is a loss on this date within the policy's cover period? */
function coversDate(policy, when) {
    const d = when ? new Date(when) : new Date();
    if (Number.isNaN(d.getTime())) return { covered: false, reason: 'loss date is not a valid date' };
    if (policy.start_date && d < new Date(policy.start_date)) {
        return { covered: false, reason: `loss occurred before cover attached on ${new Date(policy.start_date).toISOString().slice(0, 10)}` };
    }
    if (policy.end_date && d > new Date(policy.end_date)) {
        return { covered: false, reason: `loss occurred after cover terminated on ${new Date(policy.end_date).toISOString().slice(0, 10)}` };
    }
    return { covered: true, reason: null };
}

// How far ahead the sweep warns that cover is about to lapse. Cargo still afloat
// when a policy ends is uninsured, and the assured needs time to extend.
const EXPIRY_WARNING_DAYS = 14;

/**
 * Age out every active policy whose cover period has run out, and warn on the ones
 * about to. Idempotent — safe to call from the scheduler and from the read paths
 * (lazy expiry), which is what keeps a stale `active` from being usable between
 * sweeps. `notifyFn` is injected so this module stays free of a notification
 * dependency and remains unit-testable.
 */
async function expireDuePolicies({ policyIds, notifyFn } = {}) {
    const where = { status: 'active', end_date: { [Op.lt]: new Date() } };
    if (policyIds && policyIds.length) where.id = { [Op.in]: policyIds };

    const due = await db.InsurancePolicy.findAll({ where, limit: 1000 });
    for (const p of due) {
        await p.update({ status: 'expired', expired_at: new Date() });
        if (notifyFn) await notifyFn('policy_expired', p);
    }
    return { expired: due.length, ids: due.map((p) => p.id) };
}

/**
 * Policies lapsing inside the warning window that have not been warned yet. The
 * `expiryWarnedAt` stamp makes this at-most-once per policy rather than a daily
 * nag until it expires.
 */
async function warnExpiringPolicies({ notifyFn } = {}) {
    const horizon = new Date(Date.now() + EXPIRY_WARNING_DAYS * DAY_MS);
    const soon = await db.InsurancePolicy.findAll({
        where: { status: 'active', end_date: { [Op.gt]: new Date(), [Op.lte]: horizon } },
        limit: 1000,
    });
    const warned = [];
    for (const p of soon) {
        if ((p.metadata || {}).expiryWarnedAt) continue;
        if (notifyFn) await notifyFn('policy_expiring', p);
        await p.update({ metadata: { ...(p.metadata || {}), expiryWarnedAt: new Date().toISOString() } });
        warned.push(p.id);
    }
    return { warned: warned.length, ids: warned };
}

module.exports = {
    coverPeriodFor, coversDate, expireDuePolicies, warnExpiringPolicies,
    DISCHARGE_GRACE_DAYS, EXPIRY_WARNING_DAYS,
};

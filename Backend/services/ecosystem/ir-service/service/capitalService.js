'use strict';
/**
 * Capital account logic — what an investor has committed, been called for, paid, and received.
 *
 * Two rules this module exists to enforce:
 *
 *  1. BALANCES ARE DERIVED. Called capital is the sum of the allocation ledger; distributions are
 *     the sum of the distribution ledger. Nothing is cached on the commitment row, so the portal
 *     cannot show a figure its own history does not support.
 *
 *  2. MONEY MOVES ONLY ON EVIDENCE. An allocation becomes paid when a settlement reference is
 *     recorded against it — not because an operator clicked a button. The previous UI marked
 *     wires "Confirmed" in browser state alone.
 *
 * Every investor-facing read is scoped to the caller's own commitment. An investor sees their own
 * position and the vehicle-level NAV, never another investor's numbers.
 */
const db = require('../models');
const { Op } = require('sequelize');

const money = (v) => Number(v || 0);
const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;

async function commitmentsFor(userId) {
    return db.IrCommitment.findAll({ where: { investor_user_id: String(userId) } });
}

/** Allocations belonging to the given commitments, on calls that have actually been issued. */
async function allocationsFor(commitmentIds) {
    if (!commitmentIds.length) return [];
    const rows = await db.IrCallAllocation.findAll({ where: { commitment_id: { [Op.in]: commitmentIds } } });
    if (!rows.length) return [];
    const calls = await db.IrCapitalCall.findAll({ where: { id: { [Op.in]: [...new Set(rows.map((r) => r.call_id))] } } });
    const issued = new Map(calls.filter((c) => c.status !== 'draft').map((c) => [c.id, c]));
    // A draft call is not a notice — it must not appear in an investor's position.
    return rows.filter((r) => issued.has(r.call_id)).map((r) => ({ allocation: r, call: issued.get(r.call_id) }));
}

/**
 * The investor's position. Returns null when they hold no commitment — the caller renders an
 * empty state rather than inventing a portfolio.
 */
async function summaryFor(userId) {
    const commitments = await commitmentsFor(userId);
    if (!commitments.length) return null;

    const ids = commitments.map((c) => c.id);
    const [allocs, distributions] = await Promise.all([
        allocationsFor(ids),
        db.IrDistribution.findAll({ where: { commitment_id: { [Op.in]: ids }, status: 'paid' } }),
    ]);

    const commitment = commitments.reduce((t, c) => t + money(c.commitment_amount), 0);
    const called = allocs.reduce((t, a) => t + money(a.allocation.amount_due), 0);
    const paid = allocs.reduce((t, a) => t + money(a.allocation.amount_received), 0);
    const distributed = distributions.reduce((t, d) => t + money(d.amount), 0);
    const currency = commitments[0].currency;

    // NAV is the vehicle's published valuation, apportioned by this investor's share of paid-in
    // capital. Reported as null when there is no published NAV or nothing has been paid in —
    // an investor's share of an unknown number is not zero, it is unknown.
    const vehicles = [...new Set(commitments.map((c) => c.vehicle))];
    const navPoint = await db.IrNavPoint.findOne({
        where: { vehicle: { [Op.in]: vehicles }, published_at: { [Op.ne]: null } },
        order: [['as_of', 'DESC']],
    });
    let nav = null;
    if (navPoint) {
        const vehiclePaid = await totalPaidIn(vehicles);
        if (vehiclePaid > 0) nav = round2(money(navPoint.nav_total) * (paid / vehiclePaid));
    }

    return {
        currency,
        commitment: round2(commitment),
        calledCapital: round2(called),
        paidInCapital: round2(paid),
        outstanding: round2(called - paid),
        uncalledCommitment: round2(commitment - called),
        distributions: round2(distributed),
        nav,
        navAsOf: navPoint ? navPoint.as_of : null,
        // Deliberately NOT reported: IRR. It needs a dated cash-flow series and an agreed
        // methodology; the portal previously displayed a fixed 18.4% that was computed from
        // nothing. A blank field is honest, a fabricated return is not.
        irr: null,
    };
}

async function totalPaidIn(vehicles) {
    const commitments = await db.IrCommitment.findAll({ where: { vehicle: { [Op.in]: vehicles } } });
    if (!commitments.length) return 0;
    const allocs = await allocationsFor(commitments.map((c) => c.id));
    return allocs.reduce((t, a) => t + money(a.allocation.amount_received), 0);
}

/** The investor's own capital calls — issued notices only. */
async function callsFor(userId) {
    const commitments = await commitmentsFor(userId);
    const allocs = await allocationsFor(commitments.map((c) => c.id));
    return allocs
        .map(({ allocation, call }) => ({
            id: call.id,
            reference: call.reference,
            callDate: call.call_date,
            dueDate: call.due_date,
            purpose: call.purpose,
            amount: round2(money(allocation.amount_due)),
            amountReceived: round2(money(allocation.amount_received)),
            currency: allocation.currency,
            status: allocation.status,
        }))
        .sort((a, b) => String(b.callDate || '').localeCompare(String(a.callDate || '')));
}

async function distributionsFor(userId) {
    const commitments = await commitmentsFor(userId);
    if (!commitments.length) return [];
    return db.IrDistribution.findAll({
        where: { commitment_id: { [Op.in]: commitments.map((c) => c.id) } },
        order: [['paid_on', 'DESC']],
    });
}

/** Published NAV history for the vehicles this investor is in. */
async function navHistoryFor(userId) {
    const commitments = await commitmentsFor(userId);
    if (!commitments.length) return [];
    return db.IrNavPoint.findAll({
        where: { vehicle: { [Op.in]: [...new Set(commitments.map((c) => c.vehicle))] }, published_at: { [Op.ne]: null } },
        order: [['as_of', 'ASC']],
    });
}

/**
 * Record money actually received against an allocation. Requires a settlement reference — this
 * is the only path that can move an allocation to paid.
 */
async function recordSettlement({ allocationId, amount, settlementRef, actorId, receivedOn }) {
    const row = await db.IrCallAllocation.findByPk(allocationId);
    if (!row) return null;

    // IDEMPOTENT ON THE BANK REFERENCE. This used to increment amount_received in place, so the
    // same reference posted twice — a webhook retry, a double-click, a re-run of a reconciliation
    // job — silently doubled the money on the ledger unless it happened to exceed the amount due.
    // The unique index on (allocation_id, settlement_ref) makes the second post a no-op.
    const existing = await db.IrCallReceipt.findOne({
        where: { allocation_id: allocationId, settlement_ref: settlementRef },
    });
    if (existing) return row;   // already applied; the caller sees the same end state

    const due = money(row.amount_due);
    const receipts = await db.IrCallReceipt.findAll({ where: { allocation_id: allocationId } });
    const alreadyIn = receipts.reduce((t, r) => t + money(r.amount), 0);
    const received = round2(alreadyIn + money(amount));
    // Receiving more than was called is never routine — a wrong reference, or a genuine
    // overpayment needing a decision. Refuse it rather than carry a negative outstanding.
    if (received > due + 0.005) {
        const err = new Error(`Receipt exceeds the amount called (due ${due}, would be ${received})`);
        err.status = 409; throw err;
    }

    return db.sequelize.transaction(async (t) => {
        try {
            await db.IrCallReceipt.create({
                allocation_id: allocationId, amount: money(amount), currency: row.currency,
                settlement_ref: settlementRef, recorded_by: actorId || null,
                received_on: receivedOn || new Date().toISOString().slice(0, 10),
            }, { transaction: t });
        } catch (err) {
            // Lost a race against a concurrent identical post — the unique index held, which is
            // the point. Treat it as already applied.
            if (err.name === 'SequelizeUniqueConstraintError') return row;
            throw err;
        }
        // amount_received stays as a denormalised total for reads, but it is now DERIVED from the
        // receipt rows rather than accumulated blindly.
        await row.update({
            amount_received: received,
            settlement_ref: settlementRef,
            settled_at: new Date(),
            settled_by: actorId || null,
            status: received >= due ? 'paid' : received > 0 ? 'part_paid' : 'outstanding',
        }, { transaction: t });
        return row;
    });
}

// ── Operator side (IR / finance team) ─────────────────────────────────────────

/** Every commitment in a vehicle, with called/paid derived from the ledgers. */
async function registerFor(vehicle = 'baalvion') {
    const commitments = await db.IrCommitment.findAll({ where: { vehicle }, order: [['investor_name', 'ASC']] });
    if (!commitments.length) return [];
    const allocs = await allocationsFor(commitments.map((c) => c.id));
    const byCommitment = new Map();
    for (const { allocation } of allocs) {
        const acc = byCommitment.get(allocation.commitment_id) || { due: 0, received: 0 };
        acc.due += money(allocation.amount_due);
        acc.received += money(allocation.amount_received);
        byCommitment.set(allocation.commitment_id, acc);
    }
    return commitments.map((c) => {
        const acc = byCommitment.get(c.id) || { due: 0, received: 0 };
        return {
            id: c.id,
            investorName: c.investor_name,
            investorUserId: c.investor_user_id,
            currency: c.currency,
            status: c.status,
            commitmentAmount: round2(money(c.commitment_amount)),
            calledToDate: round2(acc.due),
            paidToDate: round2(acc.received),
            outstanding: round2(acc.due - acc.received),
            remainingCommitment: round2(money(c.commitment_amount) - acc.due),
        };
    });
}

/**
 * Issue a drawdown notice pro-rata across every SIGNED commitment in the vehicle.
 *
 * Created as `issued` with its allocations in one transaction: a call that exists without its
 * allocations is a notice nobody owes anything against. Percentages that would over-call a
 * commitment are rejected outright rather than silently clamped — calling more than an investor
 * committed is not a rounding question.
 */
async function issueCall({ vehicle = 'baalvion', callPct, purpose, dueDate, actorId, orgId }) {
    const pct = Number(callPct);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
        const err = new Error('callPct must be between 0 and 100');
        err.status = 400; throw err;
    }
    const commitments = await db.IrCommitment.findAll({ where: { vehicle, status: 'signed' } });
    if (!commitments.length) {
        const err = new Error('No signed commitments in this vehicle — nothing to call');
        err.status = 409; throw err;
    }

    const register = await registerFor(vehicle);
    const calledBy = new Map(register.map((r) => [r.id, r.calledToDate]));
    for (const c of commitments) {
        const amount = money(c.commitment_amount) * (pct / 100);
        if ((calledBy.get(c.id) || 0) + amount > money(c.commitment_amount) + 0.005) {
            const err = new Error(`Call would exceed ${c.investor_name}'s remaining commitment`);
            err.status = 409; throw err;
        }
    }

    const today = new Date().toISOString().slice(0, 10);
    const reference = `CC-${today.slice(0, 4)}-${String(await db.IrCapitalCall.count({ where: { vehicle } }) + 1).padStart(3, '0')}`;

    return db.sequelize.transaction(async (t) => {
        const call = await db.IrCapitalCall.create({
            org_id: orgId, vehicle, reference, call_pct: pct, currency: commitments[0].currency,
            purpose: purpose || null, status: 'issued', call_date: today, due_date: dueDate || null,
            issued_at: new Date(), issued_by: actorId || null,
        }, { transaction: t });

        for (const c of commitments) {
            await db.IrCallAllocation.create({
                call_id: call.id, commitment_id: c.id,
                amount_due: round2(money(c.commitment_amount) * (pct / 100)),
                amount_received: 0, currency: c.currency, status: 'outstanding',
            }, { transaction: t });
        }
        return call;
    });
}

/**
 * Declare a distribution to every investor holding paid-in capital, apportioned by their share
 * of it. Created as `declared`, never `paid`: declaring is a board decision, paying is a bank
 * event, and collapsing the two is how a portal ends up reporting money it never sent.
 *
 * Investors with nothing paid in are skipped rather than given a zero row — a distribution to
 * someone who has contributed nothing is a data error, not a line worth recording.
 */
async function declareDistribution({ vehicle = 'baalvion', amount, kind = 'income', reference, orgId }) {
    const total = money(amount);
    if (!Number.isFinite(total) || total <= 0) {
        const err = new Error('A distribution amount must be greater than zero'); err.status = 400; throw err;
    }
    const register = await registerFor(vehicle);
    const paidIn = register.reduce((t, r) => t + r.paidToDate, 0);
    if (paidIn <= 0) {
        const err = new Error('Nothing has been paid in to this vehicle — there is no basis to apportion a distribution');
        err.status = 409; throw err;
    }

    const today = new Date().toISOString().slice(0, 10);
    const ref = reference || `DIST-${today.slice(0, 4)}-${String(await db.IrDistribution.count() + 1).padStart(3, '0')}`;

    return db.sequelize.transaction(async (t) => {
        const rows = [];
        for (const r of register) {
            if (r.paidToDate <= 0) continue;
            rows.push(await db.IrDistribution.create({
                org_id: orgId, commitment_id: r.id, reference: ref,
                amount: round2(total * (r.paidToDate / paidIn)),
                currency: r.currency, kind, status: 'declared',
            }, { transaction: t }));
        }
        return { reference: ref, total: round2(total), basis: 'paid_in_capital', recipients: rows.length, items: rows };
    });
}

/** Mark a declared distribution paid — against a bank reference, exactly like a receipt. */
async function payDistribution({ distributionId, settlementRef, paidOn }) {
    const row = await db.IrDistribution.findByPk(distributionId);
    if (!row) return null;
    if (row.status === 'paid') {
        const err = new Error('This distribution is already recorded as paid'); err.status = 409; throw err;
    }
    await row.update({ status: 'paid', settlement_ref: settlementRef, paid_on: paidOn || new Date().toISOString().slice(0, 10) });
    return row;
}

module.exports = {
    commitmentsFor,
    registerFor,
    issueCall,
    declareDistribution,
    payDistribution,
    summaryFor,
    callsFor,
    distributionsFor,
    navHistoryFor,
    recordSettlement,
    totalPaidIn,
};

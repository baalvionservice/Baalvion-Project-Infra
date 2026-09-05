'use strict';
/**
 * Pre-arrival filing scheduler — DB-backed ORCHESTRATOR (Compression, Phase 4).
 *
 * Turns the pure regime model into scheduled work:
 *
 *   schedule()  materializes one row per filing requirement and keeps the window
 *               in step with the schedule. ETAs move constantly, so windows are
 *               RECOMPUTED on every call rather than frozen at booking — a
 *               deadline computed against a three-week-old ETA is not a deadline.
 *
 *   sweep()     the worker's work list: filings whose window is open now. It is
 *               ordered by deadline so the most urgent goes first, and it refuses
 *               to hand back anything the corridor gate would reject.
 *
 * The gate check inside sweep() is deliberate. Firing an early filing that
 * bounces wastes exactly the head start the phase exists to buy, and turns a
 * lever into a liability.
 */

const db = require('../../models');
const preArrival = require('./preArrival');
const ledger = require('./ledger');
const corridorEngine = require('../corridor/corridorEngine');
const { AppError } = require('../../utils/errors');

const plain = (x) => (x && typeof x.toJSON === 'function' ? x.toJSON() : x);

const ACTIONABLE = Object.freeze([preArrival.STATUS.OPEN, preArrival.STATUS.DUE_SOON, preArrival.STATUS.OVERDUE]);

async function fetchConsignment(consignmentId, tenantId) {
    const where = { id: consignmentId };
    if (tenantId) where.tenant_id = tenantId;
    const row = await db.Consignment.findOne({ where });
    if (!row) throw new AppError('NOT_FOUND', 'Consignment not found', 404);
    return row;
}

/**
 * Create or refresh the pre-arrival schedule for a consignment.
 *
 * Idempotent per (consignment, filing_key). A filing already `filed` is never
 * rewound by a reschedule — the authority has it, and moving its window would
 * make the record disagree with reality.
 */
async function schedule(consignmentId, { tenantId = null, now = new Date() } = {}) {
    const consignment = await fetchConsignment(consignmentId, tenantId);
    const p = preArrival.plan(consignment.canonical || {}, { now });

    const rows = [];
    for (const filing of p.filings) {
        const where = { consignment_id: consignment.id, filing_key: filing.filing_key };
        if (consignment.tenant_id) where.tenant_id = consignment.tenant_id;
        const existing = await db.PrearrivalFiling.findOne({ where });

        if (existing && ['filed', 'filing', 'cancelled'].includes(existing.status)) {
            rows.push(plain(existing)); // terminal or in-flight — leave it alone
            continue;
        }

        const values = {
            shipment_id: consignment.shipment_id,
            destination_country: consignment.destination_country,
            regime_code: p.regime ? p.regime.code : null,
            channel: p.regime ? p.regime.channel : null,
            label: filing.label,
            anchor: filing.anchor || 'arrival',
            anchor_at: filing.anchor_at || null,
            earliest_at: filing.earliest_at || null,
            due_at: filing.due_at || null,
            target_at: filing.target_at || null,
            status: filing.status,
            mandatory: filing.mandatory !== false,
            penalty: filing.penalty || null,
            regime_version: p.regime_version,
            metadata: { reason: filing.reason || null, note: filing.note || null },
        };

        if (existing) {
            await existing.update(values);
            rows.push(plain(existing));
        } else {
            rows.push(plain(await db.PrearrivalFiling.create({
                tenant_id: consignment.tenant_id,
                consignment_id: consignment.id,
                filing_key: filing.filing_key,
                ...values,
            })));
        }
    }

    // Pre-filing is a real stage on the compression clock; opening it here is what
    // makes the head start measurable rather than assumed.
    if (p.file_now.length) {
        ledger.record({ subjectType: 'consignment', subjectId: consignment.id }, 'import_prefiling', 'open',
            { tenantId: consignment.tenant_id, now });
    }

    return {
        consignment_id: consignment.id,
        regime: p.regime,
        regime_note: p.reason || null,
        filings: rows,
        file_now: p.file_now,
        missed: p.missed,
    };
}

/**
 * Filings ready to transmit now, most urgent first.
 *
 * Each candidate is run through the corridor gate before being handed to a
 * worker: an early filing that bounces spends the head start it was meant to buy.
 */
async function sweep({ tenantId = null, limit = 100, now = new Date(), checkGate = true } = {}) {
    const where = { status: ACTIONABLE, target_at: { [db.Sequelize.Op.lte]: new Date(now) } };
    if (tenantId) where.tenant_id = tenantId;

    const rows = (await db.PrearrivalFiling.findAll({
        where,
        limit: Math.min(1000, Number(limit) || 100),
        order: [['due_at', 'ASC']],
    })).map(plain);

    const ready = [];
    const held = [];

    for (const row of rows) {
        if (!checkGate) { ready.push(row); continue; }
        try {
            const consignment = await fetchConsignment(row.consignment_id, row.tenant_id);
            const result = await corridorEngine.evaluate(consignment.canonical || {}, {
                tenantId: row.tenant_id,
                consignmentId: consignment.id,
                persist: false,
            });
            if (result.submittable) ready.push({ ...row, precheck: { submittable: true } });
            else {
                held.push({
                    ...row,
                    blocking: result.findings.filter((f) => f.severity === 'blocking'),
                    // A held filing with a near deadline is the thing that needs a
                    // human right now — everything else can wait.
                    hours_to_deadline: row.due_at ? Math.round(((new Date(row.due_at).getTime() - new Date(now).getTime()) / 3600000) * 100) / 100 : null,
                });
            }
        } catch (err) {
            held.push({ ...row, error: err.message });
        }
    }

    return { ready, held, swept: rows.length };
}

/** Record a transmitted filing against its schedule row. */
async function markFiled(id, { submissionId = null, tenantId = null, now = new Date() } = {}) {
    const where = { id };
    if (tenantId) where.tenant_id = tenantId;
    const row = await db.PrearrivalFiling.findOne({ where });
    if (!row) throw new AppError('NOT_FOUND', 'Pre-arrival filing not found', 404);
    await row.update({
        status: 'filed',
        filed_at: now,
        submission_id: submissionId || row.submission_id,
        attempts: Number(row.attempts || 0) + 1,
        last_error: null,
    });

    // If nothing is left outstanding, the pre-filing stage is genuinely complete.
    const outstanding = await db.PrearrivalFiling.count({
        where: {
            consignment_id: row.consignment_id,
            status: [...ACTIONABLE, 'scheduled', 'not_yet_open'],
            mandatory: true,
        },
    });
    if (outstanding === 0) {
        ledger.record({ subjectType: 'consignment', subjectId: row.consignment_id }, 'import_prefiling', 'close',
            { tenantId: row.tenant_id, now });
    }

    return plain(row);
}

async function markFailed(id, { error, tenantId = null } = {}) {
    const where = { id };
    if (tenantId) where.tenant_id = tenantId;
    const row = await db.PrearrivalFiling.findOne({ where });
    if (!row) throw new AppError('NOT_FOUND', 'Pre-arrival filing not found', 404);
    await row.update({ status: 'failed', attempts: Number(row.attempts || 0) + 1, last_error: String(error || '').slice(0, 2000) });
    return plain(row);
}

/**
 * Deadline exposure across the book: what is about to be missed, and what
 * already has been. A missed lading-anchored filing is unrecoverable, so it is
 * reported separately rather than mixed in with things still fixable.
 */
async function exposure({ tenantId = null, withinHours = 48, now = new Date() } = {}) {
    const where = {};
    if (tenantId) where.tenant_id = tenantId;
    const rows = (await db.PrearrivalFiling.findAll({
        where, limit: 5000, order: [['due_at', 'ASC']],
    })).map(plain);

    const nowMs = new Date(now).getTime();
    const horizon = nowMs + withinHours * 3600000;
    const hoursTo = (d) => (d ? Math.round(((new Date(d).getTime() - nowMs) / 3600000) * 100) / 100 : null);

    const open = rows.filter((r) => ACTIONABLE.includes(r.status));
    return {
        total: rows.length,
        filed: rows.filter((r) => r.status === 'filed').length,
        due_within_window: open
            .filter((r) => r.due_at && new Date(r.due_at).getTime() <= horizon)
            .map((r) => ({ ...r, hours_to_deadline: hoursTo(r.due_at) })),
        overdue: open.filter((r) => r.status === preArrival.STATUS.OVERDUE).length,
        // Unrecoverable: the anchor event has passed. Reported apart from the
        // fixable backlog because the remedy is a penalty, not a filing.
        missed: rows.filter((r) => r.status === preArrival.STATUS.MISSED)
            .map((r) => ({ id: r.id, consignment_id: r.consignment_id, filing_key: r.filing_key, anchor: r.anchor, penalty: r.penalty })),
        unschedulable: rows.filter((r) => r.status === preArrival.STATUS.UNSCHEDULABLE)
            .map((r) => ({ id: r.id, consignment_id: r.consignment_id, filing_key: r.filing_key, reason: (r.metadata || {}).reason })),
    };
}

module.exports = { schedule, sweep, markFiled, markFailed, exposure };

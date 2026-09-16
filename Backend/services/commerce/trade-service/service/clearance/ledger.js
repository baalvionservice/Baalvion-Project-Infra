'use strict';
/**
 * Clearance Stage Ledger — DB-backed ORCHESTRATOR (Clearance Compression, Phase 0).
 *
 * Wraps the PURE stage model (stages.js) with persistence, so the compression
 * programme is driven by measured time rather than opinion. The engine is
 * deliberately thin: all timing arithmetic and all bottleneck analysis lives in
 * the pure core; this file only opens, blocks, closes and reads rows.
 *
 * IDEMPOTENCY — every mutator is keyed on (tenant, subject, stage), which the
 * migration enforces with a unique constraint. Opening an already-open stage is
 * a no-op rather than a second row; RE-opening a closed one bumps touch_count
 * (the rework signal) instead of losing the first pass. That matters because the
 * callers are workflow hooks and webhook handlers, which retry.
 *
 * BLOCKED TIME — block() stamps blocked_since; unblock() banks the window into
 * blocked_ms and clears it. Elapsed time keeps running while blocked, because
 * the customer is waiting either way; the split just tells us WHOSE problem it is.
 */

const db = require('../../models');
const stages = require('./stages');
const { AppError } = require('../../utils/errors');

const plain = (x) => (x && typeof x.toJSON === 'function' ? x.toJSON() : x);

/** Normalize the polymorphic subject into the columns the table carries. */
function subjectColumns({ subjectType, subjectId, consignmentId, tradeOperationId, shipmentId }) {
    const type = subjectType || (consignmentId ? 'consignment' : (shipmentId ? 'shipment' : 'trade_operation'));
    const id = subjectId || consignmentId || shipmentId || tradeOperationId;
    if (!id) throw new AppError('VALIDATION_ERROR', 'A clearance stage timing needs a subject id', 400);
    return {
        subject_type: type,
        subject_id: id,
        consignment_id: consignmentId || (type === 'consignment' ? id : null),
        shipment_id: shipmentId || (type === 'shipment' ? id : null),
        trade_operation_id: tradeOperationId || (type === 'trade_operation' ? id : null),
    };
}

function requireStage(stage) {
    if (!stages.isStage(stage)) {
        throw new AppError('VALIDATION_ERROR', `Unknown clearance stage: ${stage}`, 400, { known: stages.STAGE_KEYS });
    }
    return stages.stageDef(stage);
}

async function findRow(subject, stage, tenantId) {
    const cols = subjectColumns(subject);
    const where = {
        subject_type: cols.subject_type,
        subject_id: cols.subject_id,
        stage,
    };
    if (tenantId) where.tenant_id = tenantId;
    return db.ClearanceStageTiming.findOne({ where });
}

/**
 * Materialize the full stage set for a subject as `pending` rows, each with a
 * target_at derived from the model's critical path.
 *
 * The deadline is not a flat per-stage SLA: a stage's target is its earliest
 * possible finish under the chosen scenario, offset from `startAt`. So a stage
 * that legitimately cannot start until 9h in is not marked breached at hour 2.
 */
async function plan(subject, {
    tenantId = null,
    scenarioName = 'target',
    include = [],
    exclude = [],
    startAt = new Date(),
    metadata = {},
} = {}) {
    const cols = subjectColumns(subject);
    const s = stages.SCENARIOS[scenarioName];
    if (!s) throw new AppError('VALIDATION_ERROR', `Unknown scenario: ${scenarioName}`, 400, { known: Object.keys(stages.SCENARIOS) });

    const opts = {
        include: include.length ? include : (s.opts.include || []),
        exclude: exclude.length ? exclude : (s.opts.exclude || []),
    };
    const cp = stages.criticalPath(s.durationOf, opts);
    const start = new Date(startAt).getTime();

    const rows = [];
    for (const key of stages.activeKeys(opts)) {
        const def = stages.stageDef(key);
        const existing = await findRow(subject, key, tenantId);
        if (existing) { rows.push(plain(existing)); continue; } // replan never clobbers live timings
        const created = await db.ClearanceStageTiming.create({
            ...(tenantId ? { tenant_id: tenantId } : {}),
            ...cols,
            stage: key,
            track: def.track,
            owner_party: def.owner,
            status: stages.STAGE_STATUS.PENDING,
            target_at: new Date(start + stages.hoursToMs(cp.finish[key])),
            baseline_hours: def.baseline_hours,
            target_hours: def.target_hours,
            metadata: { ...metadata, scenario: scenarioName, planned_start_offset_hours: cp.start[key] },
        });
        rows.push(plain(created));
    }
    return { scenario: scenarioName, critical_path: cp.path, projected_hours: cp.total_hours, stages: rows };
}

/** Start (or restart) a stage's clock. A restart is rework — touch_count records it. */
async function open(subject, stage, { tenantId = null, actor = null, waitingOn = null, now = new Date() } = {}) {
    const def = requireStage(stage);
    const cols = subjectColumns(subject);
    let row = await findRow(subject, stage, tenantId);

    if (!row) {
        return plain(await db.ClearanceStageTiming.create({
            ...(tenantId ? { tenant_id: tenantId } : {}),
            ...cols,
            stage,
            track: def.track,
            owner_party: def.owner,
            status: stages.STAGE_STATUS.ACTIVE,
            started_at: now,
            waiting_on_party: waitingOn || def.owner,
            touch_count: 1,
            baseline_hours: def.baseline_hours,
            target_hours: def.target_hours,
            metadata: actor ? { opened_by: actor } : {},
        }));
    }

    // Already running — idempotent no-op so retrying callers cannot restart the clock.
    if (row.status === stages.STAGE_STATUS.ACTIVE) return plain(row);

    await row.update({
        status: stages.STAGE_STATUS.ACTIVE,
        // Reopening a closed stage keeps the ORIGINAL started_at: the customer's
        // clock never rewound just because we had to redo the work.
        started_at: row.started_at || now,
        completed_at: null,
        blocked_since: null,
        waiting_on_party: waitingOn || def.owner,
        touch_count: Number(row.touch_count || 0) + 1,
        ...(actor ? { metadata: { ...(row.metadata || {}), opened_by: actor } } : {}),
    });
    return plain(row);
}

/** Park a stage on someone. The whole point of the ledger is answering "on whom". */
async function block(subject, stage, { tenantId = null, waitingOn, reason = null, now = new Date() } = {}) {
    requireStage(stage);
    const row = await findRow(subject, stage, tenantId);
    if (!row) throw new AppError('NOT_FOUND', `Stage ${stage} is not open for this subject`, 404);
    if (row.status === stages.STAGE_STATUS.BLOCKED) return plain(row); // idempotent
    await row.update({
        status: stages.STAGE_STATUS.BLOCKED,
        blocked_since: now,
        started_at: row.started_at || now,
        waiting_on_party: waitingOn || row.waiting_on_party,
        blocked_by: reason,
    });
    return plain(row);
}

/** Bank the open block window and resume. */
async function unblock(subject, stage, { tenantId = null, now = new Date() } = {}) {
    requireStage(stage);
    const row = await findRow(subject, stage, tenantId);
    if (!row) throw new AppError('NOT_FOUND', `Stage ${stage} is not open for this subject`, 404);
    if (row.status !== stages.STAGE_STATUS.BLOCKED) return plain(row);
    const banked = Number(row.blocked_ms || 0)
        + (row.blocked_since ? Math.max(0, now.getTime() - new Date(row.blocked_since).getTime()) : 0);
    await row.update({
        status: stages.STAGE_STATUS.ACTIVE,
        blocked_since: null,
        blocked_ms: banked,
        blocked_by: null,
    });
    return plain(row);
}

/** Stop the clock. Freezes elapsed_ms and decides the breach against target_at. */
async function close(subject, stage, { tenantId = null, actor = null, now = new Date() } = {}) {
    requireStage(stage);
    const row = await findRow(subject, stage, tenantId);
    if (!row) throw new AppError('NOT_FOUND', `Stage ${stage} is not open for this subject`, 404);
    if (row.status === stages.STAGE_STATUS.DONE) return plain(row); // idempotent

    const startedAt = row.started_at ? new Date(row.started_at) : now;
    const banked = Number(row.blocked_ms || 0)
        + (row.blocked_since ? Math.max(0, now.getTime() - new Date(row.blocked_since).getTime()) : 0);

    await row.update({
        status: stages.STAGE_STATUS.DONE,
        completed_at: now,
        blocked_since: null,
        blocked_ms: banked,
        elapsed_ms: Math.max(0, now.getTime() - startedAt.getTime()),
        waiting_on_party: null,
        blocked_by: null,
        breached: row.target_at ? now.getTime() > new Date(row.target_at).getTime() : false,
        ...(actor ? { metadata: { ...(row.metadata || {}), closed_by: actor } } : {}),
    });
    return plain(row);
}

/** Mark a stage as not applicable (no CoO needed, no duty payable, ...). */
async function skip(subject, stage, { tenantId = null, reason = null, now = new Date() } = {}) {
    const def = requireStage(stage);
    const cols = subjectColumns(subject);
    const row = await findRow(subject, stage, tenantId);
    if (row) {
        await row.update({
            status: stages.STAGE_STATUS.SKIPPED,
            completed_at: now,
            blocked_since: null,
            waiting_on_party: null,
            metadata: { ...(row.metadata || {}), skip_reason: reason },
        });
        return plain(row);
    }
    return plain(await db.ClearanceStageTiming.create({
        ...(tenantId ? { tenant_id: tenantId } : {}),
        ...cols,
        stage,
        track: def.track,
        owner_party: def.owner,
        status: stages.STAGE_STATUS.SKIPPED,
        completed_at: now,
        metadata: { skip_reason: reason },
    }));
}

/**
 * Fire-and-forget stage transition for callers on a request path (the workflow
 * engine, webhook handlers). Measurement must never be able to fail a shipment.
 */
function record(subject, stage, action, opts = {}) {
    const fn = { open, block, unblock, close, skip }[action];
    if (!fn) return Promise.resolve(null);
    return fn(subject, stage, opts).catch(() => null);
}

/** Rows + the pure analysis: where this subject's time actually went. */
async function timeline(subject, { tenantId = null, now = new Date() } = {}) {
    const cols = subjectColumns(subject);
    const where = { subject_type: cols.subject_type, subject_id: cols.subject_id };
    if (tenantId) where.tenant_id = tenantId;
    const rows = await db.ClearanceStageTiming.findAll({ where, order: [['created_at', 'ASC']] });
    const list = rows.map(plain);
    return {
        subject: { type: cols.subject_type, id: cols.subject_id },
        ...stages.analyze(list, now),
        model: stages.scenario('target'),
    };
}

/**
 * Portfolio bottleneck view: aggregate elapsed time per stage across every
 * subject in the tenant. This is the report that decides what gets built next —
 * the assumed bottleneck and the measured one are rarely the same stage.
 */
async function bottlenecks({ tenantId = null, since = null, limit = 5000, now = new Date(), subjectIds = null } = {}) {
    const where = {};
    if (tenantId) where.tenant_id = tenantId;
    if (since) where.created_at = { [db.Sequelize.Op.gte]: new Date(since) };
    // Party scope: an explicit id list confines the rollup to the caller's own
    // trades. An EMPTY list is meaningful (party to nothing) and must match no
    // rows rather than degrade into an unfiltered tenant-wide read.
    if (Array.isArray(subjectIds)) where.subject_id = { [db.Sequelize.Op.in]: subjectIds };
    const rows = await db.ClearanceStageTiming.findAll({
        where, limit: Math.min(20000, Number(limit) || 5000), order: [['created_at', 'DESC']],
    });
    const list = rows.map(plain);

    // Per-stage aggregate across subjects — mean is what a rollup needs, but p90
    // is what a promise needs, so both are reported.
    const analysis = stages.analyze(list, now);
    const grouped = {};
    for (const s of analysis.stages) {
        const g = grouped[s.stage] || (grouped[s.stage] = {
            stage: s.stage, label: s.label, track: s.track, owner: s.owner,
            samples: [], blocked: 0, breaches: 0, rework: 0,
        });
        g.samples.push(s.elapsed_hours);
        g.blocked += s.blocked_hours;
        if (s.breached) g.breaches += 1;
        if (s.touch_count > 1) g.rework += 1;
    }

    const pct = (arr, p) => {
        if (!arr.length) return 0;
        const sorted = arr.slice().sort((a, b) => a - b);
        const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
        return Math.round(sorted[idx] * 100) / 100;
    };

    const summary = Object.values(grouped).map((g) => {
        const total = g.samples.reduce((a, b) => a + b, 0);
        const def = stages.stageDef(g.stage);
        return {
            stage: g.stage,
            label: g.label,
            track: g.track,
            owner: g.owner,
            count: g.samples.length,
            total_hours: Math.round(total * 100) / 100,
            mean_hours: Math.round((total / g.samples.length) * 100) / 100,
            p90_hours: pct(g.samples, 90),
            blocked_hours: Math.round(g.blocked * 100) / 100,
            breach_rate: Math.round((g.breaches / g.samples.length) * 100) / 100,
            rework_rate: Math.round((g.rework / g.samples.length) * 100) / 100,
            target_hours: def ? def.target_hours : null,
            baseline_hours: def ? def.baseline_hours : null,
        };
    }).sort((a, b) => b.total_hours - a.total_hours);

    const grand = summary.reduce((a, s) => a + s.total_hours, 0);
    return {
        engine_version: stages.ENGINE_VERSION,
        sample_rows: list.length,
        total_hours: Math.round(grand * 100) / 100,
        stages: summary.map((s) => ({
            ...s,
            share_pct: grand > 0 ? Math.round((s.total_hours / grand) * 10000) / 100 : 0,
        })),
        by_party: analysis.by_party,
        by_track: analysis.by_track,
        vital_few: analysis.vital_few,
    };
}

module.exports = {
    plan, open, block, unblock, close, skip, record, timeline, bottlenecks,
    subjectColumns,
};

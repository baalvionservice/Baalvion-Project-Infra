'use strict';
/**
 * Parallel work front + hard gates — PURE (Compression, Phase 3).
 *
 * Two jobs, both aimed at the serialization that causes most of the 19 days.
 *
 * 1. THE FRONT. service/workflow/stateMachine.js walks a single linear chain:
 *    DOCUMENT_COLLECTION → DOCUMENT_VERIFICATION → COMPLIANCE_CHECK →
 *    HS_CLASSIFICATION → CUSTOMS_READY. That ordering is an artefact of the
 *    machine, not of the work: given the goods and the parties, classification,
 *    screening, insurance, freight booking and document collection are
 *    independent. `readyStages()` returns EVERY stage whose dependencies are
 *    satisfied right now, so work fans out instead of queueing.
 *
 * 2. THE GATES. A readiness SCORE cannot gate anything — 78/100 does not answer
 *    "may this be filed?". So the score becomes one signal among hard
 *    predicates, and each gate states exactly which predicate failed and how to
 *    clear it. A gate that only says "not ready" recreates the queue it replaced.
 *
 * PURE: no DB, no clock beyond what the caller injects.
 */

const stages = require('./stages');

const GATE_VERSION = '1.0.0';

const DONE_STATUSES = Object.freeze([stages.STAGE_STATUS.DONE, stages.STAGE_STATUS.SKIPPED]);

/** Index ledger rows by stage key. */
const indexRows = (rows = []) => rows.reduce((acc, r) => { acc[r.stage] = r; return acc; }, {});

const statusOf = (byStage, key) => (byStage[key] ? byStage[key].status : stages.STAGE_STATUS.PENDING);
const isSatisfied = (byStage, key) => DONE_STATUSES.includes(statusOf(byStage, key));

/**
 * Every stage that could be worked on RIGHT NOW: not finished, and with all its
 * dependencies satisfied. The size of this set is the parallelism the cycle is
 * actually getting — if it is persistently 1, the work is still serial.
 */
function readyStages(rows = [], { include = [], exclude = [] } = {}) {
    const byStage = indexRows(rows);
    const active = stages.activeKeys({ include, exclude });
    return active.filter((key) => {
        if (isSatisfied(byStage, key)) return false;
        return stages.stageDef(key).dependsOn
            .filter((dep) => active.includes(dep))
            .every((dep) => isSatisfied(byStage, dep));
    });
}

/** Which unsatisfied dependencies are holding a stage back, and who owns them. */
function blockedBy(stage, rows = [], opts = {}) {
    const byStage = indexRows(rows);
    const active = stages.activeKeys(opts);
    const def = stages.stageDef(stage);
    if (!def) return [];
    return def.dependsOn
        .filter((dep) => active.includes(dep) && !isSatisfied(byStage, dep))
        .map((dep) => ({
            stage: dep,
            label: stages.stageDef(dep).label,
            status: statusOf(byStage, dep),
            owner: (byStage[dep] && byStage[dep].waiting_on_party) || stages.stageDef(dep).owner,
        }));
}

/**
 * Live projection: given what is already done, how much longer until release?
 *
 * Finished stages cost nothing more; everything else is priced at its target
 * duration. This is the number a customer is actually asking for, and it moves
 * as the work moves rather than being a quote fixed at booking.
 */
function projectRemaining(rows = [], { include = [], exclude = [], scenarioName = 'target' } = {}) {
    const byStage = indexRows(rows);
    const s = stages.SCENARIOS[scenarioName] || stages.SCENARIOS.target;
    const opts = {
        include: include.length ? include : (s.opts.include || []),
        exclude: exclude.length ? exclude : (s.opts.exclude || []),
    };
    const cp = stages.criticalPath(
        (def) => (isSatisfied(byStage, def.key) ? 0 : Number(s.durationOf(def) || 0)),
        opts,
    );
    const remainingPath = cp.path.filter((k) => !isSatisfied(byStage, k));
    return {
        remaining_hours: cp.total_hours,
        remaining_days: cp.total_days,
        critical_path: remainingPath,
        // The one stage to push on. Everything else has slack by definition.
        next_constraint: remainingPath[0] || null,
        completed: stages.activeKeys(opts).filter((k) => isSatisfied(byStage, k)),
    };
}

// ── Hard gates ───────────────────────────────────────────────────────────────

/**
 * Gate definitions. Each condition is a predicate over the signals bundle plus
 * the reason it exists and the remedy — a blocked gate must always tell the
 * operator what to do next, or it is just a slower queue.
 */
const GATES = Object.freeze({
    customs_filing: {
        label: 'May this consignment be filed with customs?',
        conditions: [
            {
                key: 'precheck_submittable',
                test: (s) => s.precheck_submittable === true,
                reason: 'The pre-submit gate found unmet requirements.',
                fix: 'Resolve every blocking finding from /v1/corridor/precheck. A rejected filing costs a full clearance cycle, not a retry.',
            },
            {
                key: 'documents_fresh',
                test: (s) => s.documents_complete === true && s.documents_stale !== true,
                reason: 'The derived document set is incomplete or stale relative to the consignment.',
                fix: 'Regenerate the documents — they derive from the canonical record and never need retyping.',
            },
            {
                key: 'hs_classified',
                test: (s) => s.hs_classified === true,
                reason: 'Every line needs an HS classification before duty or licensing can be assessed.',
                fix: 'Classify the outstanding lines via the HS engine.',
            },
            {
                key: 'sanctions_clear',
                test: (s) => s.sanctions_clear === true,
                reason: 'A party or a good is subject to an unresolved sanctions or control hit.',
                fix: 'Clear the screening result before filing. This one cannot be worked around.',
            },
        ],
        soft: [
            {
                key: 'readiness',
                test: (s) => Number(s.readiness_score || 0) >= 70,
                reason: 'Overall readiness is below 70 — the filing may pass but the shipment is fragile.',
            },
        ],
    },

    pre_arrival_filing: {
        label: 'May the import declaration be lodged ahead of arrival?',
        conditions: [
            {
                key: 'export_cleared',
                test: (s) => s.export_cleared === true,
                reason: 'The export side must clear before the import declaration can reference it.',
                fix: 'Complete export clearance at origin.',
            },
            {
                key: 'arrival_known',
                test: (s) => !!s.scheduled_arrival,
                reason: 'Pre-arrival filing is scheduled off a known arrival time.',
                fix: 'Attach the vessel/flight schedule so the filing window can be computed.',
            },
            {
                key: 'precheck_submittable',
                test: (s) => s.precheck_submittable === true,
                reason: 'A pre-arrival filing that bounces wastes the head start it exists to buy.',
                fix: 'Clear the precheck findings first.',
            },
        ],
        soft: [],
    },

    duty_settlement: {
        label: 'May duty and tax be settled automatically?',
        conditions: [
            {
                key: 'duty_assessed',
                test: (s) => Number(s.duty_amount_minor || 0) > 0 || s.duty_assessed === true,
                reason: 'No assessed duty amount to settle.',
                fix: 'Wait for the assessment, or confirm the consignment is duty-free.',
            },
            {
                key: 'funds_available',
                test: (s) => s.duty_funded === true,
                reason: 'The duty account does not hold enough to cover the assessment.',
                fix: 'Top up the duty account — an unfunded assessment turns a ledger debit back into a bank transfer, which is a day.',
            },
        ],
        soft: [],
    },

    cargo_release: {
        label: 'May the cargo be released?',
        conditions: [
            {
                key: 'duty_paid',
                test: (s) => s.duty_paid === true,
                reason: 'Duty and tax are unpaid.',
                fix: 'Settle against the duty account.',
            },
            {
                key: 'exam_resolved',
                test: (s) => s.exam_required !== true || s.exam_completed === true,
                reason: 'The consignment was selected for examination and the exam is not finished.',
                fix: 'Nothing to do but wait — a physical exam is queue time no software shortens. Trusted-trader status is what avoids selection.',
            },
            {
                key: 'assessment_accepted',
                test: (s) => s.assessment_accepted === true,
                reason: 'Customs has not accepted the assessment.',
                fix: 'Respond to the outstanding query from the authority.',
            },
        ],
        soft: [],
    },
});

/**
 * Evaluate one gate.
 *
 * Missing signals are treated as NOT satisfied. A gate that opens because a
 * caller forgot to pass a flag is worse than no gate: it would let an unchecked
 * filing through while reporting that it was checked.
 */
function evaluateGate(gateName, signals = {}) {
    const gate = GATES[gateName];
    if (!gate) throw new Error(`Unknown clearance gate: ${gateName}`);

    const failed = gate.conditions
        .filter((c) => !c.test(signals))
        .map((c) => ({ condition: c.key, reason: c.reason, fix: c.fix }));

    const warnings = (gate.soft || [])
        .filter((c) => !c.test(signals))
        .map((c) => ({ condition: c.key, reason: c.reason }));

    return {
        gate: gateName,
        gate_version: GATE_VERSION,
        label: gate.label,
        open: failed.length === 0,
        failed,
        warnings,
        // Reported, never decisive. The score describes fragility; the predicates
        // decide admissibility.
        readiness_score: signals.readiness_score == null ? null : Number(signals.readiness_score),
    };
}

/** Every gate at once — the "what is actually holding this shipment up" view. */
function evaluateAll(signals = {}) {
    return Object.keys(GATES).reduce((acc, name) => {
        acc[name] = evaluateGate(name, signals);
        return acc;
    }, {});
}

/**
 * Parallelism actually achieved.
 *
 * A cycle that ran every stage strictly one after another has a factor of 1.0;
 * the target model reaches roughly 1.9. This is the number that says whether the
 * DAG is being used or whether the old chain has quietly reasserted itself.
 */
function parallelismFactor(rows = [], { now = new Date(), ...opts } = {}) {
    const active = stages.activeKeys(opts);
    const targetSerial = active.reduce((a, k) => a + stages.stageDef(k).target_hours, 0);
    const criticalPath = projectRemaining([], opts).remaining_hours;

    // The model half is independent of any observed ledger, so it must still be
    // reported for an empty one — that is precisely when someone is asking what
    // parallelism the design buys.
    const out = {
        model_serial_hours: Math.round(targetSerial * 100) / 100,
        model_critical_path_hours: criticalPath,
        model_parallelism: criticalPath > 0 ? Math.round((targetSerial / criticalPath) * 100) / 100 : null,
        observed_parallelism: null,
        observed_elapsed_hours: null,
        observed_critical_path_hours: null,
    };
    if (!rows.length) return out;

    // Observed: total time spent across stages vs. the wall-clock span the
    // consignment actually took. A ratio near 1.0 means the work ran serially
    // whatever the DAG says — the old chain has reasserted itself.
    const analysis = stages.analyze(rows, now);
    const starts = rows.map((r) => (r.started_at ? new Date(r.started_at).getTime() : null)).filter(Boolean);
    const ends = rows.map((r) => new Date(r.completed_at || now).getTime());
    if (!starts.length) return out;
    const span = (Math.max(...ends) - Math.min(...starts)) / 3600000;

    out.observed_elapsed_hours = analysis.totals.elapsed_hours;
    out.observed_critical_path_hours = Math.round(span * 100) / 100;
    out.observed_parallelism = span > 0 ? Math.round((analysis.totals.elapsed_hours / span) * 100) / 100 : null;
    return out;
}

module.exports = {
    GATE_VERSION,
    GATES,
    indexRows,
    isSatisfied,
    readyStages,
    blockedBy,
    projectRemaining,
    evaluateGate,
    evaluateAll,
    parallelismFactor,
};

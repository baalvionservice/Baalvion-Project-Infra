'use strict';
/**
 * Clearance gates — DB-backed ORCHESTRATOR (Compression, Phase 3).
 *
 * Assembles the signal bundle the pure gates evaluate against. The assembly is
 * the delicate part: a signal that cannot be established must be reported as
 * UNKNOWN and treated as unsatisfied, never defaulted to true. A gate that opens
 * because a lookup quietly failed is worse than no gate — it lets an unchecked
 * filing through while reporting that it was checked.
 *
 * Every lookup is therefore individually try/caught and individually recorded in
 * `signal_sources`, so an operator can see whether a gate is closed because the
 * work is outstanding or because we could not read it.
 */

const db = require('../../models');
const gate = require('./gate');
const stages = require('./stages');
const ledger = require('./ledger');
const derive = require('../consignment/derive');

const plain = (x) => (x && typeof x.toJSON === 'function' ? x.toJSON() : x);

/** Run a lookup, recording whether it actually answered. */
async function probe(sources, name, fn, fallback = null) {
    try {
        const value = await fn();
        sources[name] = value === null || value === undefined ? 'unknown' : 'resolved';
        return value === null || value === undefined ? fallback : value;
    } catch {
        sources[name] = 'error';
        return fallback;
    }
}

/**
 * Gather every signal the gates need for one consignment.
 *
 * @param {string} consignmentId
 * @param {object} opts { tenantId, overrides } — overrides let a caller supply a
 *        signal the platform does not own yet (an exam notice from a broker,
 *        say) without pretending the system inferred it.
 */
async function collectSignals(consignmentId, { tenantId = null, overrides = {} } = {}) {
    const sources = {};

    const consignment = await probe(sources, 'consignment', async () => {
        const where = { id: consignmentId };
        if (tenantId) where.tenant_id = tenantId;
        return db.Consignment.findOne({ where });
    });

    const canonical = consignment ? consignment.canonical : null;

    // Derived documents: complete AND matching the current consignment revision.
    const documents = await probe(sources, 'documents', async () => {
        if (!consignment) return null;
        const where = { consignment_id: consignment.id };
        if (consignment.tenant_id) where.tenant_id = consignment.tenant_id;
        return (await db.ConsignmentDocument.findAll({ where })).map(plain);
    }, []);

    const currentHash = canonical ? derive.sourceHash(canonical) : null;
    const docTypes = new Set((documents || []).map((d) => d.doc_type));
    const documentsComplete = derive.DOC_TYPES.every((t) => docTypes.has(t));
    const documentsStale = (documents || []).some((d) => d.source_hash !== currentHash);

    // Latest precheck verdict for this consignment.
    const precheck = await probe(sources, 'precheck', async () => {
        if (!db.FilingPrecheck || !consignment) return null;
        const where = { consignment_id: consignment.id };
        if (consignment.tenant_id) where.tenant_id = consignment.tenant_id;
        return db.FilingPrecheck.findOne({ where, order: [['created_at', 'DESC']] });
    });

    // Readiness score — a soft signal only. It describes fragility, not admissibility.
    const readiness = await probe(sources, 'readiness', async () => {
        if (!db.ShipmentReadiness || !consignment || !consignment.shipment_id) return null;
        return db.ShipmentReadiness.findOne({
            where: { shipment_id: consignment.shipment_id },
            order: [['created_at', 'DESC']],
        });
    });

    // Sanctions / controls. Absence of a screening is NOT clearance — an
    // unscreened consignment must fail the gate, not pass it by default.
    const screening = await probe(sources, 'screening', async () => {
        if (!db.ComplianceScreening || !consignment) return null;
        const where = {};
        if (consignment.tenant_id) where.tenant_id = consignment.tenant_id;
        if (consignment.shipment_id) where.shipment_id = consignment.shipment_id;
        else return null;
        return db.ComplianceScreening.findOne({ where, order: [['created_at', 'DESC']] });
    });

    const ledgerRows = await probe(sources, 'ledger', async () => {
        const where = { subject_type: 'consignment', subject_id: consignmentId };
        if (tenantId) where.tenant_id = tenantId;
        return (await db.ClearanceStageTiming.findAll({ where })).map(plain);
    }, []);

    const byStage = gate.indexRows(ledgerRows || []);
    const stageDone = (key) => gate.isSatisfied(byStage, key);

    const hsClassified = !!canonical
        && Array.isArray(canonical.lines)
        && canonical.lines.length > 0
        && canonical.lines.every((l) => l.hs_code && l.hs_code.length >= 6);

    const screeningClear = screening
        ? ['clear', 'passed', 'approved', 'no_match'].includes(String(screening.decision || screening.status || '').toLowerCase())
        : false;

    const signals = {
        // Hard predicates
        precheck_submittable: precheck ? precheck.submittable === true : false,
        documents_complete: documentsComplete,
        documents_stale: documentsStale,
        hs_classified: hsClassified,
        sanctions_clear: screeningClear,
        export_cleared: stageDone('export_clearance'),
        duty_paid: stageDone('duty_payment'),
        assessment_accepted: stageDone('import_assessment'),
        scheduled_arrival: canonical && canonical.transport ? canonical.transport.eta : null,

        // Soft signal
        readiness_score: readiness ? Number(readiness.readiness_score) : null,

        // Signals the platform does not own yet — supplied by later phases or by
        // an explicit override, never inferred.
        duty_assessed: false,
        duty_amount_minor: 0,
        duty_funded: false,
        exam_required: false,
        exam_completed: false,
        trusted_trader: false,

        ...overrides,
    };

    return {
        consignment: consignment ? plain(consignment) : null,
        signals,
        signal_sources: sources,
        ledger_rows: ledgerRows || [],
    };
}

/** Full clearance picture for a consignment: gates, work front, live projection. */
async function status(consignmentId, { tenantId = null, overrides = {}, now = new Date() } = {}) {
    const { consignment, signals, signal_sources, ledger_rows } = await collectSignals(consignmentId, { tenantId, overrides });

    const include = signals.exam_required ? ['customs_exam'] : [];
    const front = gate.readyStages(ledger_rows, { include });

    return {
        consignment_id: consignmentId,
        reference: consignment ? consignment.reference : null,
        gates: gate.evaluateAll(signals),
        signals,
        signal_sources,
        work_front: front.map((key) => {
            const def = stages.stageDef(key);
            const row = ledger_rows.find((r) => r.stage === key);
            return {
                stage: key,
                label: def.label,
                track: def.track,
                owner: (row && row.waiting_on_party) || def.owner,
                status: row ? row.status : 'pending',
                target_hours: def.target_hours,
            };
        }),
        // The single most useful line in this payload: how many things can be
        // worked on at once. Persistently 1 means the work is still serial.
        parallel_width: front.length,
        projection: gate.projectRemaining(ledger_rows, { include }),
        parallelism: gate.parallelismFactor(ledger_rows, { include, now }),
        timeline: stages.analyze(ledger_rows, now),
    };
}

/**
 * Advance the front: open a ledger clock for every stage that is workable now.
 * This is what actually replaces the linear chain with a fan-out.
 */
async function advance(consignmentId, { tenantId = null, actor = null, overrides = {}, now = new Date() } = {}) {
    const { signals, ledger_rows } = await collectSignals(consignmentId, { tenantId, overrides });
    const include = signals.exam_required ? ['customs_exam'] : [];
    const front = gate.readyStages(ledger_rows, { include });
    const subject = { subjectType: 'consignment', subjectId: consignmentId };

    const opened = [];
    for (const key of front) {
        const row = ledger_rows.find((r) => r.stage === key);
        // Only start clocks that have not started. Reopening a running stage
        // would inflate its touch count and slander it as rework.
        if (row && [stages.STAGE_STATUS.ACTIVE, stages.STAGE_STATUS.BLOCKED].includes(row.status)) continue;
        await ledger.open(subject, key, { tenantId, actor, now });
        opened.push(key);
    }
    return { opened, front, parallel_width: front.length };
}

module.exports = { collectSignals, status, advance };

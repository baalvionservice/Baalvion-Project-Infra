'use strict';
/**
 * Parallel work front + hard gates — verification harness (Phase 3).
 *
 * Two properties: the DAG actually fans work out (rather than reproducing the
 * old linear chain), and a gate never opens on a missing signal.
 *
 *   node tests/clearance-gate.verify.js
 */
const assert = require('assert');
const gate = require('../service/clearance/gate');
const stages = require('../service/clearance/stages');

const H = 3600 * 1000;
const T0 = Date.parse('2026-09-05T00:00:00Z');
let pass = 0;
let fail = 0;
const failures = [];
function t(name, fn) {
    try { fn(); pass += 1; console.log(`  ✓ ${name}`); }
    catch (err) { fail += 1; failures.push({ name, message: err.message }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}
function section(title) { console.log(`\n${title}`); }

const done = (...keys) => keys.map((k) => ({ stage: k, status: 'done', started_at: new Date(T0), completed_at: new Date(T0 + H) }));

// Every hard condition satisfied — the baseline the negative cases perturb.
const OPEN_SIGNALS = {
    precheck_submittable: true,
    documents_complete: true,
    documents_stale: false,
    hs_classified: true,
    sanctions_clear: true,
    readiness_score: 90,
};

(() => {
    // ── the work front ───────────────────────────────────────────────────────
    section('the parallel work front');
    t('only the entry stage is workable at the start', () => {
        assert.deepStrictEqual(gate.readyStages([]), ['order_capture']);
    });
    t('finishing order capture fans out four independent tracks at once', () => {
        const front = gate.readyStages(done('order_capture'));
        assert.deepStrictEqual(front, ['party_verification', 'hs_classification', 'fx_lock', 'freight_booking']);
        assert.ok(front.length > 1, 'the whole point is that work stops being serial here');
    });
    t('the front spans multiple tracks, not one chain', () => {
        const front = gate.readyStages(done('order_capture'));
        const tracks = new Set(front.map((k) => stages.stageDef(k).track));
        assert.ok(tracks.size >= 3, `expected work across tracks, got ${[...tracks]}`);
    });
    t('a stage with an unmet dependency stays off the front', () => {
        assert.ok(!gate.readyStages(done('order_capture')).includes('document_preparation'));
    });
    t('a skipped dependency satisfies its dependents just like a done one', () => {
        const rows = [...done('order_capture'), { stage: 'hs_classification', status: 'skipped' }];
        assert.ok(gate.readyStages(rows).includes('document_preparation'));
    });
    t('a completed stage drops off the front', () => {
        assert.ok(!gate.readyStages(done('order_capture')).includes('order_capture'));
    });
    t('an in-progress stage stays on the front until it finishes', () => {
        const rows = [...done('order_capture'), { stage: 'hs_classification', status: 'active' }];
        assert.ok(gate.readyStages(rows).includes('hs_classification'));
    });
    t('the conditional exam only enters the front when included', () => {
        const rows = done('order_capture', 'hs_classification', 'party_verification', 'fx_lock', 'freight_booking',
            'document_preparation', 'document_verification', 'trade_finance', 'duty_funding',
            'origin_certification', 'export_filing', 'import_prefiling', 'import_assessment');
        assert.ok(!gate.readyStages(rows).includes('customs_exam'));
        assert.ok(gate.readyStages(rows, { include: ['customs_exam'] }).includes('customs_exam'));
    });

    // ── what is holding a stage up ───────────────────────────────────────────
    section('blockedBy names the holder');
    t('an unstarted stage reports every outstanding dependency with its owner', () => {
        const blockers = gate.blockedBy('document_preparation', done('order_capture'));
        assert.deepStrictEqual(blockers.map((b) => b.stage), ['hs_classification']);
        assert.strictEqual(blockers[0].owner, 'platform');
    });
    t('a stage with everything satisfied reports no blockers', () => {
        assert.deepStrictEqual(gate.blockedBy('hs_classification', done('order_capture')), []);
    });
    t('an unknown stage returns empty rather than throwing', () => {
        assert.deepStrictEqual(gate.blockedBy('not_a_stage', []), []);
    });

    // ── live projection ──────────────────────────────────────────────────────
    section('live projection');
    t('remaining time shrinks as stages complete', () => {
        const before = gate.projectRemaining([]).remaining_hours;
        const after = gate.projectRemaining(done('order_capture', 'hs_classification', 'document_preparation')).remaining_hours;
        assert.ok(after < before, `${after} should be under ${before}`);
    });
    t('completed stages are excluded from the remaining critical path', () => {
        const p = gate.projectRemaining(done('order_capture', 'hs_classification'));
        assert.ok(!p.critical_path.includes('order_capture'));
        assert.ok(p.completed.includes('hs_classification'));
    });
    t('next_constraint names the one stage worth pushing on', () => {
        const p = gate.projectRemaining(done('order_capture'));
        assert.strictEqual(p.next_constraint, 'hs_classification');
    });
    t('an examined consignment projects longer than a clean one', () => {
        const clean = gate.projectRemaining([]).remaining_hours;
        const examined = gate.projectRemaining([], { include: ['customs_exam'] }).remaining_hours;
        assert.ok(examined > clean);
    });

    // ── parallelism metric ───────────────────────────────────────────────────
    section('parallelism metric');
    t('the model reports its designed parallelism even for an empty ledger', () => {
        const p = gate.parallelismFactor([]);
        assert.ok(p.model_parallelism > 1.5, `got ${p.model_parallelism}`);
    });
    t('two stages run at the same time score about 2x', () => {
        const rows = [
            { stage: 'hs_classification', status: 'done', started_at: new Date(T0), completed_at: new Date(T0 + 4 * H) },
            { stage: 'freight_booking', status: 'done', started_at: new Date(T0), completed_at: new Date(T0 + 4 * H) },
        ];
        assert.strictEqual(gate.parallelismFactor(rows, { now: new Date(T0 + 4 * H) }).observed_parallelism, 2);
    });
    t('the same two stages run back to back score 1x — the old chain', () => {
        const rows = [
            { stage: 'hs_classification', status: 'done', started_at: new Date(T0), completed_at: new Date(T0 + 4 * H) },
            { stage: 'freight_booking', status: 'done', started_at: new Date(T0 + 4 * H), completed_at: new Date(T0 + 8 * H) },
        ];
        assert.strictEqual(gate.parallelismFactor(rows, { now: new Date(T0 + 8 * H) }).observed_parallelism, 1);
    });

    // ── hard gates ───────────────────────────────────────────────────────────
    section('hard gates');
    t('all conditions met opens the filing gate', () => {
        const g = gate.evaluateGate('customs_filing', OPEN_SIGNALS);
        assert.strictEqual(g.open, true, JSON.stringify(g.failed));
    });
    t('an unmet precheck closes it with a stated fix', () => {
        const g = gate.evaluateGate('customs_filing', { ...OPEN_SIGNALS, precheck_submittable: false });
        assert.strictEqual(g.open, false);
        assert.strictEqual(g.failed[0].condition, 'precheck_submittable');
        assert.ok(g.failed[0].fix.length > 10);
    });
    t('stale documents close the gate even when the set is complete', () => {
        const g = gate.evaluateGate('customs_filing', { ...OPEN_SIGNALS, documents_stale: true });
        assert.strictEqual(g.open, false);
        assert.ok(g.failed.some((f) => f.condition === 'documents_fresh'));
    });
    t('an empty signal bundle closes every gate — unknown is never satisfied', () => {
        for (const name of Object.keys(gate.GATES)) {
            assert.strictEqual(gate.evaluateGate(name, {}).open, false, `${name} opened on no signals`);
        }
    });
    t('a missing sanctions screening is treated as unscreened, not as clear', () => {
        const g = gate.evaluateGate('customs_filing', { ...OPEN_SIGNALS, sanctions_clear: undefined });
        assert.strictEqual(g.open, false);
        assert.ok(g.failed.some((f) => f.condition === 'sanctions_clear'));
    });
    t('a high readiness score cannot open a gate whose conditions fail', () => {
        const g = gate.evaluateGate('customs_filing', { ...OPEN_SIGNALS, readiness_score: 100, hs_classified: false });
        assert.strictEqual(g.open, false, 'a score must never override a hard predicate');
    });
    t('a low readiness score does not close a gate whose conditions pass', () => {
        const g = gate.evaluateGate('customs_filing', { ...OPEN_SIGNALS, readiness_score: 12 });
        assert.strictEqual(g.open, true);
        assert.ok(g.warnings.some((w) => w.condition === 'readiness'));
    });
    t('the release gate holds for an unfinished examination', () => {
        const base = { duty_paid: true, assessment_accepted: true, exam_required: true, exam_completed: false };
        assert.strictEqual(gate.evaluateGate('cargo_release', base).open, false);
        assert.strictEqual(gate.evaluateGate('cargo_release', { ...base, exam_completed: true }).open, true);
    });
    t('an unexamined consignment is not held by the exam condition', () => {
        assert.strictEqual(gate.evaluateGate('cargo_release', { duty_paid: true, assessment_accepted: true }).open, true);
    });
    t('duty settlement needs both an assessment and available funds', () => {
        assert.strictEqual(gate.evaluateGate('duty_settlement', { duty_assessed: true, duty_funded: false }).open, false);
        assert.strictEqual(gate.evaluateGate('duty_settlement', { duty_assessed: true, duty_funded: true }).open, true);
    });
    t('pre-arrival filing needs a known arrival time', () => {
        const base = { export_cleared: true, precheck_submittable: true };
        assert.strictEqual(gate.evaluateGate('pre_arrival_filing', base).open, false);
        assert.strictEqual(gate.evaluateGate('pre_arrival_filing', { ...base, scheduled_arrival: '2026-10-01' }).open, true);
    });
    t('an unknown gate name throws rather than silently opening', () => {
        assert.throws(() => gate.evaluateGate('wishful_thinking', OPEN_SIGNALS), /Unknown clearance gate/);
    });
    t('evaluateAll covers every defined gate', () => {
        assert.deepStrictEqual(Object.keys(gate.evaluateAll(OPEN_SIGNALS)).sort(), Object.keys(gate.GATES).sort());
    });
    t('every gate condition ships a fix, not just a complaint', () => {
        for (const [name, g] of Object.entries(gate.GATES)) {
            for (const c of g.conditions) {
                assert.ok(c.fix && c.fix.length > 10, `${name}.${c.key} has no usable fix`);
            }
        }
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) {
        console.log('\nFailures:');
        failures.forEach((f) => console.log(`  • ${f.name}: ${f.message}`));
        process.exit(1);
    }
})();

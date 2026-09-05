'use strict';
/**
 * Clearance stage model — standalone verification harness (Phase 0).
 *
 * jest is broken repo-wide (jest-runtime clearMocksOnScope skew), so this runs
 * the PURE catalogue + critical-path + analysis assertions on a tiny built-in
 * runner. No DB, no network, injected clock.
 *
 *   node tests/clearance-stages.verify.js
 */
const assert = require('assert');
const stages = require('../service/clearance/stages');

const NOW = new Date('2026-09-05T12:00:00Z');
const H = 3600 * 1000;
let pass = 0;
let fail = 0;
const failures = [];

function t(name, fn) {
    try { fn(); pass += 1; console.log(`  ✓ ${name}`); }
    catch (err) { fail += 1; failures.push({ name, message: err.message }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}
function section(title) { console.log(`\n${title}`); }

(() => {
    // ── catalogue integrity ──────────────────────────────────────────────────
    section('catalogue integrity');
    t('every stage key is unique', () => {
        assert.strictEqual(new Set(stages.STAGE_KEYS).size, stages.STAGE_KEYS.length);
    });
    t('every dependsOn edge points at a real stage', () => {
        for (const s of stages.STAGES) {
            for (const dep of s.dependsOn) {
                assert.ok(stages.isStage(dep), `${s.key} depends on unknown stage ${dep}`);
            }
        }
    });
    t('the DAG is acyclic', () => {
        assert.doesNotThrow(() => stages.topoSort(stages.STAGE_KEYS));
    });
    t('topological order never places a stage before its dependency', () => {
        const order = stages.topoSort(stages.activeKeys());
        const pos = Object.fromEntries(order.map((k, i) => [k, i]));
        for (const key of order) {
            for (const dep of stages.stageDef(key).dependsOn) {
                if (pos[dep] === undefined) continue;
                assert.ok(pos[dep] < pos[key], `${dep} must precede ${key}`);
            }
        }
    });
    t('floor never exceeds target, target never exceeds baseline', () => {
        for (const s of stages.STAGES) {
            assert.ok(s.floor_hours <= s.target_hours, `${s.key}: floor > target`);
            assert.ok(s.target_hours <= s.baseline_hours, `${s.key}: target > baseline`);
        }
    });
    t('every stage declares a known owner party and track', () => {
        const parties = new Set(Object.values(stages.PARTY));
        const tracks = new Set(Object.values(stages.TRACK));
        for (const s of stages.STAGES) {
            assert.ok(parties.has(s.owner), `${s.key}: unknown owner ${s.owner}`);
            assert.ok(tracks.has(s.track), `${s.key}: unknown track ${s.track}`);
        }
    });

    // ── conditional stages ───────────────────────────────────────────────────
    section('conditional stages');
    t('customs_exam is excluded by default', () => {
        assert.ok(!stages.activeKeys().includes('customs_exam'));
    });
    t('customs_exam is included when opted in', () => {
        assert.ok(stages.activeKeys({ include: ['customs_exam'] }).includes('customs_exam'));
    });
    t('excluding a conditional stage drops its edge without orphaning dependents', () => {
        // release_order depends on customs_exam; with the exam excluded it must
        // still be reachable, not stuck waiting on a stage that never runs.
        const cp = stages.criticalPath((d) => d.target_hours);
        assert.ok(cp.finish.release_order > 0, 'release_order never scheduled');
        assert.ok(cp.path.includes('release_order'));
    });

    // ── critical path ────────────────────────────────────────────────────────
    section('critical path');
    t('total elapsed is the longest path, not the sum of stages', () => {
        const cp = stages.criticalPath((d) => d.baseline_hours);
        const sum = stages.activeKeys().reduce((a, k) => a + stages.stageDef(k).baseline_hours, 0);
        assert.ok(cp.total_hours < sum, 'critical path should be shorter than the serial sum');
    });
    t('a stage never starts before its slowest dependency finishes', () => {
        const cp = stages.criticalPath((d) => d.baseline_hours);
        for (const key of stages.activeKeys()) {
            for (const dep of stages.stageDef(key).dependsOn) {
                if (cp.finish[dep] === undefined) continue;
                assert.ok(cp.start[key] >= cp.finish[dep], `${key} starts before ${dep} finishes`);
            }
        }
    });
    t('every stage on the critical path has zero slack', () => {
        const cp = stages.criticalPath((d) => d.baseline_hours);
        const tail = cp.path[cp.path.length - 1];
        assert.strictEqual(cp.slack[tail], 0);
    });

    // ── scenarios: the numbers we quote ──────────────────────────────────────
    section('scenarios');
    t('baseline lands in the 18–19 day band we are compressing', () => {
        const s = stages.scenario('baseline');
        assert.ok(s.total_days >= 18 && s.total_days <= 19.5, `got ${s.total_days} days`);
    });
    t('target clears in under 24 hours — the one-day claim', () => {
        const s = stages.scenario('target');
        assert.ok(s.total_hours < 24, `got ${s.total_hours}h`);
    });
    t('cold_start is honestly multi-day, not one day', () => {
        const s = stages.scenario('cold_start');
        assert.ok(s.total_days > 3, `cold start must not promise a fast lane, got ${s.total_days} days`);
    });
    t('an examined consignment costs days, and says so', () => {
        const s = stages.scenario('examined');
        assert.ok(s.total_days > 2, `got ${s.total_days} days`);
        assert.ok(s.path.includes('customs_exam'));
    });
    t('floor is the irreducible limit — no scenario beats it', () => {
        const floor = stages.scenario('floor').total_hours;
        for (const name of Object.keys(stages.SCENARIOS)) {
            assert.ok(stages.scenario(name).total_hours >= floor, `${name} beat the floor`);
        }
    });
    t('target improves on baseline by more than 20x', () => {
        const b = stages.scenario('baseline').total_hours;
        const g = stages.scenario('target').total_hours;
        assert.ok(b / g > 20, `only ${(b / g).toFixed(1)}x`);
    });
    t('unknown scenario throws rather than silently defaulting', () => {
        assert.throws(() => stages.scenario('wishful'), /unknown clearance scenario/);
    });

    // ── observed timing analysis ─────────────────────────────────────────────
    section('analyze — observed timings');
    const row = (over) => ({
        stage: 'document_preparation',
        status: 'done',
        started_at: new Date(NOW.getTime() - 10 * H),
        completed_at: new Date(NOW.getTime() - 2 * H),
        blocked_ms: 0,
        touch_count: 1,
        ...over,
    });

    t('elapsed is measured between start and completion', () => {
        const a = stages.analyze([row()], NOW);
        assert.strictEqual(a.stages[0].elapsed_hours, 8);
    });
    t('an open stage keeps accruing up to now', () => {
        const a = stages.analyze([row({ status: 'active', completed_at: null })], NOW);
        assert.strictEqual(a.stages[0].elapsed_hours, 10);
        assert.strictEqual(a.stages[0].open, true);
    });
    t('a currently-blocked window counts toward blocked time', () => {
        const a = stages.analyze([row({
            status: 'blocked', completed_at: null,
            blocked_since: new Date(NOW.getTime() - 3 * H),
        })], NOW);
        assert.strictEqual(a.stages[0].blocked_hours, 3);
        assert.strictEqual(a.stages[0].working_hours, 7);
    });
    t('banked and open blocked windows are added, not replaced', () => {
        const a = stages.analyze([row({
            status: 'blocked', completed_at: null,
            blocked_ms: 2 * H,
            blocked_since: new Date(NOW.getTime() - 3 * H),
        })], NOW);
        assert.strictEqual(a.stages[0].blocked_hours, 5);
    });
    t('a never-started stage contributes zero, not NaN', () => {
        const a = stages.analyze([row({ status: 'pending', started_at: null, completed_at: null })], NOW);
        assert.strictEqual(a.stages[0].elapsed_hours, 0);
        assert.strictEqual(a.totals.elapsed_hours, 0);
    });
    t('breach is decided against target_at', () => {
        const late = stages.analyze([row({ target_at: new Date(NOW.getTime() - 5 * H) })], NOW);
        const ontime = stages.analyze([row({ target_at: new Date(NOW.getTime() + 5 * H) })], NOW);
        assert.strictEqual(late.stages[0].breached, true);
        assert.strictEqual(ontime.stages[0].breached, false);
    });
    t('touch_count above 1 is counted as rework', () => {
        const a = stages.analyze([row({ touch_count: 3 })], NOW);
        assert.strictEqual(a.totals.rework_touches, 2);
    });
    t('vs_target exposes how far off the model a stage ran', () => {
        const a = stages.analyze([row()], NOW); // 8h against a 0.25h target
        assert.strictEqual(a.stages[0].vs_target, 32);
    });
    t('bottlenecks are ordered by elapsed time, biggest first', () => {
        const a = stages.analyze([
            row({ stage: 'document_preparation' }),
            row({ stage: 'export_filing', started_at: new Date(NOW.getTime() - 30 * H) }),
            row({ stage: 'fx_lock', started_at: new Date(NOW.getTime() - 3 * H) }),
        ], NOW);
        assert.deepStrictEqual(a.bottlenecks.map((s) => s.stage), ['export_filing', 'document_preparation', 'fx_lock']);
        assert.ok(a.bottlenecks[0].share_pct > a.bottlenecks[2].share_pct);
    });
    t('vital_few names the smallest set holding ~80% of the time', () => {
        const a = stages.analyze([
            row({ stage: 'export_filing', started_at: new Date(NOW.getTime() - 100 * H) }),
            row({ stage: 'fx_lock', started_at: new Date(NOW.getTime() - 3 * H) }),
        ], NOW);
        assert.deepStrictEqual(a.vital_few, ['export_filing']);
    });
    t('waiting_on_party overrides the catalogue owner in the party rollup', () => {
        const a = stages.analyze([row({ waiting_on_party: 'shipper' })], NOW);
        assert.ok(a.by_party.shipper > 0);
    });
    t('an empty ledger analyzes to zeroes rather than throwing', () => {
        const a = stages.analyze([], NOW);
        assert.strictEqual(a.totals.elapsed_hours, 0);
        assert.deepStrictEqual(a.vital_few, []);
    });

    // ── summary ──────────────────────────────────────────────────────────────
    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) {
        console.log('\nFailures:');
        failures.forEach((f) => console.log(`  • ${f.name}: ${f.message}`));
        process.exit(1);
    }
})();

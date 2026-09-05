'use strict';
/**
 * Pre-arrival filing regimes — verification harness (Phase 4).
 *
 * The property that matters most: a lading-anchored deadline is computed from
 * DEPARTURE, not arrival. Getting that wrong silently misses a filing whose
 * penalty is liquidated damages rather than a delay.
 *
 *   node tests/prearrival-regimes.verify.js
 */
const assert = require('assert');
const pa = require('../service/clearance/preArrival');

let pass = 0;
let fail = 0;
const failures = [];
function t(name, fn) {
    try { fn(); pass += 1; console.log(`  ✓ ${name}`); }
    catch (err) { fail += 1; failures.push({ name, message: err.message }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}
function section(title) { console.log(`\n${title}`); }

const NOW = new Date('2026-09-05T00:00:00Z');
const cns = (destination, mode = 'sea', etd = '2026-09-20T00:00:00Z', eta = '2026-10-15T00:00:00Z') => ({
    destination_country: destination,
    transport: { mode, etd, eta },
});
const filing = (plan, key) => plan.filings.find((f) => f.filing_key === key);

(() => {
    // ── regime resolution ────────────────────────────────────────────────────
    section('regime resolution');
    t('a named jurisdiction resolves directly', () => {
        assert.strictEqual(pa.regimeFor('US').jurisdiction, 'United States');
        assert.strictEqual(pa.regimeFor('IN').channel, 'icegate');
    });
    t('any EU member state resolves to the union regime', () => {
        for (const c of ['DE', 'FR', 'NL', 'PL']) {
            const r = pa.regimeFor(c);
            assert.strictEqual(r.code, 'EU', `${c} did not resolve to EU`);
            assert.strictEqual(r.member_state, c);
        }
    });
    t('country codes are case-insensitive', () => {
        assert.strictEqual(pa.regimeFor('de').code, 'EU');
    });
    t('an unmodelled destination returns null rather than an empty regime', () => {
        assert.strictEqual(pa.regimeFor('BR'), null);
    });
    t('an unmodelled destination says so instead of implying nothing is required', () => {
        const p = pa.plan(cns('BR'), { now: NOW });
        assert.strictEqual(p.regime, null);
        assert.ok(/Confirm the local requirement/.test(p.reason));
        assert.deepStrictEqual(p.filings, []);
    });

    // ── the anchor distinction — the expensive one ───────────────────────────
    section('lading-anchored vs arrival-anchored deadlines');
    t('a US ISF deadline is 24h before DEPARTURE, not before arrival', () => {
        const f = filing(pa.plan(cns('US'), { now: NOW }), 'isf_10_2');
        assert.strictEqual(f.anchor, 'lading');
        // ETD 2026-09-20 minus 24h.
        assert.strictEqual(f.due_at, '2026-09-19T00:00:00.000Z');
    });
    t('the US entry deadline is anchored to arrival instead', () => {
        const f = filing(pa.plan(cns('US'), { now: NOW }), 'entry');
        assert.strictEqual(f.anchor, 'arrival');
        assert.strictEqual(f.due_at, '2026-10-15T00:00:00.000Z');
    });
    t('the two US deadlines are almost a month apart — they are not one filing', () => {
        const p = pa.plan(cns('US'), { now: NOW });
        const isf = Date.parse(filing(p, 'isf_10_2').due_at);
        const entry = Date.parse(filing(p, 'entry').due_at);
        assert.ok(entry - isf > 20 * 24 * 3600 * 1000);
    });
    t('an EU ENS is likewise lading-anchored', () => {
        assert.strictEqual(filing(pa.plan(cns('DE'), { now: NOW }), 'ens').anchor, 'lading');
    });
    t('a lading-anchored filing is MISSED once the vessel has sailed', () => {
        const afterSailing = new Date('2026-09-25T00:00:00Z');
        const f = filing(pa.plan(cns('US'), { now: afterSailing }), 'isf_10_2');
        assert.strictEqual(f.status, pa.STATUS.MISSED);
        assert.ok(f.penalty.length > 0);
    });
    t('the arrival-anchored filing is still fine at that point', () => {
        const afterSailing = new Date('2026-09-25T00:00:00Z');
        assert.notStrictEqual(filing(pa.plan(cns('US'), { now: afterSailing }), 'entry').status, pa.STATUS.MISSED);
    });

    // ── window mechanics ─────────────────────────────────────────────────────
    section('filing windows');
    t('a filing before its window opens is not_yet_open', () => {
        // ACE entry opens 15 days before an arrival that is 40 days out.
        const f = filing(pa.plan(cns('US'), { now: NOW }), 'entry');
        assert.strictEqual(f.status, pa.STATUS.NOT_YET_OPEN);
    });
    t('the target is the START of the window, never the deadline', () => {
        const f = filing(pa.plan(cns('US'), { now: NOW }), 'entry');
        assert.strictEqual(f.target_at, f.earliest_at, 'aiming at the deadline recreates the behaviour this phase removes');
        assert.ok(Date.parse(f.target_at) < Date.parse(f.due_at));
    });
    t('once the window is open the target is now, not a backdated instant', () => {
        const f = filing(pa.plan(cns('US'), { now: NOW }), 'isf_10_2');
        assert.strictEqual(f.status, pa.STATUS.OPEN);
        assert.strictEqual(f.target_at, NOW.toISOString());
    });
    t('a filing inside the last quarter of its window is due_soon', () => {
        // India BoE: due 24h before an ETA that is 3 days out.
        const f = filing(pa.plan(cns('IN', 'air', null, '2026-09-08T00:00:00Z'), { now: NOW }), 'bill_of_entry');
        assert.strictEqual(f.status, pa.STATUS.DUE_SOON);
    });
    t('past the deadline but before the anchor is overdue, not missed', () => {
        const late = new Date('2026-09-19T12:00:00Z'); // after the ISF deadline, before ETD
        assert.strictEqual(filing(pa.plan(cns('US'), { now: late }), 'isf_10_2').status, pa.STATUS.OVERDUE);
    });
    t('hours_to_deadline goes negative once the deadline passes', () => {
        const late = new Date('2026-09-19T12:00:00Z');
        assert.ok(filing(pa.plan(cns('US'), { now: late }), 'isf_10_2').hours_to_deadline < 0);
    });

    // ── missing dates ────────────────────────────────────────────────────────
    section('missing schedule data');
    t('no ETD makes a lading-anchored filing unschedulable, not silently fine', () => {
        const f = filing(pa.plan(cns('US', 'sea', null), { now: NOW }), 'isf_10_2');
        assert.strictEqual(f.status, pa.STATUS.UNSCHEDULABLE);
        assert.ok(/departure \(ETD\)/.test(f.reason));
    });
    t('no ETA makes an arrival-anchored filing unschedulable', () => {
        const f = filing(pa.plan(cns('US', 'sea', '2026-09-20T00:00:00Z', null), { now: NOW }), 'entry');
        assert.strictEqual(f.status, pa.STATUS.UNSCHEDULABLE);
        assert.ok(/arrival \(ETA\)/.test(f.reason));
    });
    t('an unparseable date is treated as missing rather than as epoch zero', () => {
        const f = filing(pa.plan(cns('US', 'sea', 'next tuesday'), { now: NOW }), 'isf_10_2');
        assert.strictEqual(f.status, pa.STATUS.UNSCHEDULABLE);
    });

    // ── mode applicability ───────────────────────────────────────────────────
    section('mode applicability');
    t('a sea-only security filing does not apply to air cargo', () => {
        const f = filing(pa.plan(cns('US', 'air'), { now: NOW }), 'isf_10_2');
        assert.strictEqual(f.status, pa.STATUS.NOT_APPLICABLE);
        assert.ok(/moves by air/.test(f.reason));
    });
    t('the arrival-anchored entry still applies to air cargo', () => {
        assert.notStrictEqual(filing(pa.plan(cns('US', 'air'), { now: NOW }), 'entry').status, pa.STATUS.NOT_APPLICABLE);
    });

    // ── work list ────────────────────────────────────────────────────────────
    section('work list');
    t('file_now lists only filings whose window is actually open', () => {
        const p = pa.plan(cns('US'), { now: NOW });
        assert.deepStrictEqual(p.file_now, ['isf_10_2']);
    });
    t('dueFilings agrees with file_now', () => {
        const due = pa.dueFilings(cns('US'), { now: NOW });
        assert.deepStrictEqual(due.map((f) => f.filing_key), ['isf_10_2']);
    });
    t('every modelled filing declares a penalty for missing it', () => {
        for (const [code, regime] of Object.entries(pa.REGIMES)) {
            for (const f of regime.filings) {
                assert.ok(f.penalty && f.penalty.length > 10, `${code}.${f.key} has no stated penalty`);
            }
        }
    });
    t('every regime maps to a customs gateway channel we actually have', () => {
        const known = ['ace', 'eu_cds', 'icegate', 'mirsal', 'china_single_window'];
        for (const [code, regime] of Object.entries(pa.REGIMES)) {
            assert.ok(known.includes(regime.channel), `${code} points at unknown channel ${regime.channel}`);
        }
    });
    t('every filing opens its window before its deadline', () => {
        for (const [code, regime] of Object.entries(pa.REGIMES)) {
            for (const f of regime.filings) {
                assert.ok(f.earliest_hours_before > f.deadline_hours_before, `${code}.${f.key} has an inverted window`);
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

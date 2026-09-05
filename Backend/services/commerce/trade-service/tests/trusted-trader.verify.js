'use strict';
/**
 * Trusted trader — verification harness (Phase 6).
 *
 * This is the module most easily turned into a promise the platform cannot keep,
 * so a good half of these assertions are about refusing to overclaim: a lapsed
 * accreditation confers nothing, a programme with no recognition at the
 * destination is not recommended, and every estimate says it is an estimate.
 *
 *   node tests/trusted-trader.verify.js
 */
const assert = require('assert');
const programmes = require('../service/trustedTrader/programmes');
const assessment = require('../service/trustedTrader/assessment');
const risk = require('../service/trustedTrader/risk');

const NOW = new Date('2026-09-05T00:00:00Z');
const E = assessment.EVIDENCE_STATUS;
let pass = 0;
let fail = 0;
const failures = [];
function t(name, fn) {
    try { fn(); pass += 1; console.log(`  ✓ ${name}`); }
    catch (err) { fail += 1; failures.push({ name, message: err.message }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}
function section(title) { console.log(`\n${title}`); }

const cns = (over = {}) => ({
    destination_country: 'DE', origin_country: 'IN',
    totals: { customs_value: 50000 },
    lines: [{ hs_code: '620520' }],
    parties: { exporter: { name: 'Acme Exports' } },
    ...over,
});

(() => {
    // ── catalogue integrity ──────────────────────────────────────────────────
    section('programme catalogue');
    t('every programme references only defined criteria', () => {
        for (const [code, p] of Object.entries(programmes.PROGRAMMES)) {
            for (const c of p.criteria) {
                assert.ok(programmes.CRITERIA[c], `${code} references unknown criterion ${c}`);
            }
        }
    });
    t('every programme declares an exam multiplier below 1 — otherwise it buys nothing', () => {
        for (const [code, p] of Object.entries(programmes.PROGRAMMES)) {
            assert.ok(p.exam_rate_multiplier > 0 && p.exam_rate_multiplier < 1, `${code}: ${p.exam_rate_multiplier}`);
        }
    });
    t('every prerequisite names a real programme', () => {
        for (const [code, p] of Object.entries(programmes.PROGRAMMES)) {
            for (const pre of p.prerequisites || []) {
                assert.ok(programmes.PROGRAMMES[pre], `${code} requires unknown programme ${pre}`);
            }
        }
    });
    t('criterion weights are positive', () => {
        for (const [key, c] of Object.entries(programmes.CRITERIA)) {
            assert.ok(c.weight > 0, `${key} has no weight`);
        }
    });
    t('a higher tier is never less beneficial than the tier below it', () => {
        const tiers = [['IN_AEO_T1', 'IN_AEO_T2'], ['IN_AEO_T2', 'IN_AEO_T3'], ['EU_AEOC', 'EU_AEOF']];
        for (const [lower, higher] of tiers) {
            assert.ok(programmes.PROGRAMMES[higher].exam_rate_multiplier <= programmes.PROGRAMMES[lower].exam_rate_multiplier,
                `${higher} is not better than ${lower}`);
        }
    });

    // ── mutual recognition ───────────────────────────────────────────────────
    section('mutual recognition');
    t('a domestic programme is recognised at home', () => {
        assert.deepStrictEqual(programmes.recognitionIn('EU_AEOS', 'DE'), { recognised: true, basis: 'domestic' });
    });
    t('every EU member state counts as home for an EU programme', () => {
        assert.strictEqual(programmes.recognitionIn('EU_AEOS', 'PL').basis, 'domestic');
    });
    t('an MRA partner recognises the programme too', () => {
        assert.strictEqual(programmes.recognitionIn('EU_AEOS', 'US').basis, 'mutual_recognition');
    });
    t('a jurisdiction with no MRA does not recognise it', () => {
        assert.strictEqual(programmes.recognitionIn('IN_AEO_T2', 'US').recognised, false);
    });
    t('AEOC carries no mutual recognition — only the security tiers do', () => {
        assert.strictEqual(programmes.recognitionIn('EU_AEOC', 'US').recognised, false);
        assert.strictEqual(programmes.recognitionIn('EU_AEOS', 'US').recognised, true);
    });
    t('an unknown programme code is not recognised anywhere', () => {
        assert.strictEqual(programmes.recognitionIn('MADE_UP', 'DE').recognised, false);
    });

    // ── recommendation ───────────────────────────────────────────────────────
    section('recommendation');
    t('coverage is weighted by where the trader actually ships', () => {
        const ranked = programmes.recommend('IN', { AE: 90, DE: 10 });
        assert.strictEqual(ranked[0].coverage_pct, 90);
    });
    t('a programme that reaches none of the destinations scores zero', () => {
        const ranked = programmes.recommend('IN', { US: 100 });
        assert.ok(ranked.every((r) => r.coverage_pct === 0), 'no Indian programme is recognised in the US');
    });
    t('between equal coverage, the faster accreditation ranks higher', () => {
        const ranked = programmes.recommend('IN', { US: 100 }); // all zero coverage
        assert.strictEqual(ranked[0].typical_lead_time_days, Math.min(...ranked.map((r) => r.typical_lead_time_days)));
    });

    // ── readiness assessment ─────────────────────────────────────────────────
    section('readiness assessment');
    const partial = {
        compliance_record: E.SATISFIED, records_management: E.SATISFIED, financial_solvency: E.PARTIAL,
        security_premises: E.MISSING, security_cargo: E.SATISFIED, security_personnel: E.MISSING,
        security_partners: E.SATISFIED, incident_management: E.PARTIAL,
    };
    t('an empty evidence set scores zero, not a default pass', () => {
        assert.strictEqual(assessment.assess('EU_AEOS', {}).readiness_pct, 0);
    });
    t('a full evidence set scores 100 and is ready to apply', () => {
        const full = Object.fromEntries(programmes.PROGRAMMES.EU_AEOS.criteria.map((c) => [c, E.SATISFIED]));
        const r = assessment.assess('EU_AEOS', full);
        assert.strictEqual(r.readiness_pct, 100);
        assert.strictEqual(r.ready_to_apply, true);
    });
    t('a partial criterion earns half credit, not full', () => {
        // Assert on the exact earned weight, not on doubled percentages — those
        // are rounded for display and would fail on a rounding artefact alone.
        const at = (r) => r.criteria.find((c) => c.criterion === 'compliance_record').earned;
        const one = assessment.assess('EU_AEOC', { compliance_record: E.PARTIAL });
        const full = assessment.assess('EU_AEOC', { compliance_record: E.SATISFIED });
        assert.strictEqual(at(one) * 2, at(full));
        assert.ok(one.readiness_pct < full.readiness_pct);
    });
    t('any open criterion blocks application, however high the score', () => {
        const r = assessment.assess('EU_AEOS', partial);
        assert.ok(r.readiness_pct > 70);
        assert.strictEqual(r.ready_to_apply, false, 'an authority will not accept an application with an open criterion');
    });
    t('gaps are split by who actually has to close them', () => {
        const r = assessment.assess('EU_AEOS', partial);
        assert.ok(r.operator_owned_gaps > 0);
        assert.strictEqual(r.platform_owned_gaps + r.operator_owned_gaps, r.gaps.length);
    });
    t('next actions are ranked by the readiness they unlock', () => {
        const actions = assessment.assess('EU_AEOS', partial).next_actions;
        const points = actions.map((a) => a.readiness_points_available);
        assert.deepStrictEqual(points, [...points].sort((a, b) => b - a));
    });
    t('every next action names the evidence an auditor will ask for', () => {
        for (const a of assessment.assess('EU_AEOS', partial).next_actions) {
            assert.ok(Array.isArray(a.evidence_required) && a.evidence_required.length > 0, `${a.criterion} lists no evidence`);
        }
    });
    t('an unmet prerequisite blocks application even at full readiness', () => {
        const full = Object.fromEntries(programmes.PROGRAMMES.IN_AEO_T2.criteria.map((c) => [c, E.SATISFIED]));
        assert.strictEqual(assessment.assess('IN_AEO_T2', full, { heldProgrammes: [] }).ready_to_apply, false);
        assert.strictEqual(assessment.assess('IN_AEO_T2', full, { heldProgrammes: ['IN_AEO_T1'] }).ready_to_apply, true);
    });
    t('an unknown programme throws rather than scoring nothing', () => {
        assert.throws(() => assessment.assess('MADE_UP', {}), /Unknown trusted-trader programme/);
    });

    // ── validity ─────────────────────────────────────────────────────────────
    section('accreditation validity');
    t('an active, unexpired accreditation confers benefit', () => {
        const v = assessment.validity({ programme: 'EU_AEOS', status: 'active', expires_at: '2028-01-01' }, { now: NOW });
        assert.strictEqual(v.state, 'active');
        assert.strictEqual(v.confers_benefit, true);
    });
    t('an expired accreditation confers nothing', () => {
        const v = assessment.validity({ programme: 'EU_AEOS', status: 'active', expires_at: '2026-01-01' }, { now: NOW });
        assert.strictEqual(v.state, 'expired');
        assert.strictEqual(v.confers_benefit, false);
    });
    t('a suspended accreditation confers nothing even before expiry', () => {
        const v = assessment.validity({ programme: 'EU_AEOS', status: 'suspended', expires_at: '2028-01-01' }, { now: NOW });
        assert.strictEqual(v.confers_benefit, false);
    });
    t('an accreditation near expiry still works but is flagged for renewal', () => {
        const v = assessment.validity({ programme: 'EU_AEOS', status: 'active', expires_at: '2026-10-01' }, { now: NOW });
        assert.strictEqual(v.state, 'renewal_due');
        assert.strictEqual(v.confers_benefit, true);
    });

    // ── selection risk ───────────────────────────────────────────────────────
    section('selection risk');
    const newbie = { filings_count: 1, accreditations: [] };
    const veteran = {
        filings_count: 400, first_pass_rate: 0.99,
        accreditations: [{ programme: 'EU_AEOS', status: 'active', expires_at: '2028-01-01' }],
    };

    t('an accredited veteran is far less likely to be selected than a first-timer', () => {
        const a = risk.estimate(newbie, cns(), { now: NOW }).estimated_selection_probability;
        const b = risk.estimate(veteran, cns(), { now: NOW }).estimated_selection_probability;
        assert.ok(b < a / 4, `${b} should be well under ${a}`);
    });
    t('an accredited veteran lands in the green channel', () => {
        assert.strictEqual(risk.estimate(veteran, cns(), { now: NOW }).predicted_channel, risk.CHANNEL.GREEN);
    });
    t('a lapsed accreditation gets no benefit at all', () => {
        const lapsed = { ...veteran, accreditations: [{ programme: 'EU_AEOS', status: 'active', expires_at: '2026-01-01' }] };
        const r = risk.estimate(lapsed, cns(), { now: NOW });
        assert.deepStrictEqual(r.recognised_accreditations, []);
        assert.ok(r.factors.some((f) => /not currently valid/.test(f.explanation)));
    });
    t('an accreditation not recognised at the destination gets no benefit', () => {
        const indian = { ...veteran, accreditations: [{ programme: 'IN_AEO_T2', status: 'active', expires_at: '2028-01-01' }] };
        assert.deepStrictEqual(risk.estimate(indian, cns(), { now: NOW }).recognised_accreditations, []);
    });
    t('the "no accreditation" explanation is surfaced, not silently dropped', () => {
        const r = risk.estimate(newbie, cns(), { now: NOW });
        const f = r.factors.find((x) => x.factor === 'no_recognised_accreditation');
        assert.ok(f, 'the single most useful line in the output must be present');
        assert.strictEqual(f.informational, true);
    });
    t('a high-risk commodity raises the estimate', () => {
        const tobacco = cns({ lines: [{ hs_code: '240220' }] });
        assert.ok(risk.estimate(veteran, tobacco, { now: NOW }).estimated_selection_probability
            > risk.estimate(veteran, cns(), { now: NOW }).estimated_selection_probability);
    });
    t('a poor filing record raises the estimate', () => {
        const sloppy = { ...veteran, first_pass_rate: 0.6 };
        assert.ok(risk.estimate(sloppy, cns(), { now: NOW }).estimated_selection_probability
            > risk.estimate(veteran, cns(), { now: NOW }).estimated_selection_probability);
    });
    t('a value far outside the trader pattern is flagged', () => {
        const r = risk.estimate({ ...veteran, average_consignment_value: 5000 }, cns(), { now: NOW });
        assert.ok(r.factors.some((f) => f.factor === 'value_anomaly'));
    });
    t('a first-time counterparty is flagged as controllable', () => {
        const r = risk.estimate({ ...veteran, known_counterparties: ['Someone Else'] }, cns(), { now: NOW });
        const f = r.factors.find((x) => x.factor === 'new_counterparty');
        assert.ok(f && f.controllable);
    });
    t('probability stays inside a sane band even when every factor is bad', () => {
        const worst = { filings_count: 0, first_pass_rate: 0.1, prior_findings: 10, accreditations: [], average_consignment_value: 100 };
        const r = risk.estimate(worst, cns({ lines: [{ hs_code: '930100' }] }), { now: NOW });
        assert.ok(r.estimated_selection_probability <= 0.95 && r.estimated_selection_probability > 0);
    });
    t('no programme is recommended where none is recognised at the destination', () => {
        const r = risk.estimate(newbie, cns({ destination_country: 'DE', origin_country: 'IN' }), { now: NOW });
        assert.strictEqual(r.accreditation_opportunity, null);
        assert.ok(/importer of record to be accredited locally/.test(r.accreditation_note));
    });
    t('a programme IS recommended where one does reach the destination', () => {
        const r = risk.estimate(newbie, cns({ destination_country: 'AE', origin_country: 'IN' }), { now: NOW });
        assert.ok(r.accreditation_opportunity);
        assert.ok(r.accreditation_opportunity.estimated_probability_if_accredited < r.estimated_selection_probability);
    });
    t('every estimate carries its disclaimer', () => {
        const r = risk.estimate(veteran, cns(), { now: NOW });
        assert.ok(/does not determine the channel/.test(r.disclaimer));
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) {
        console.log('\nFailures:');
        failures.forEach((f) => console.log(`  • ${f.name}: ${f.message}`));
        process.exit(1);
    }
})();

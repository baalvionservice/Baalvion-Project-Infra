'use strict';
/**
 * Delegated authority + coverage — verification harness (Phase 7).
 *
 * Two halves. The first is that delegation actually removes waits. The second,
 * and the more important one, is that it never removes the wrong wait: no limit,
 * however generous, may auto-approve a sanctions hit or a licence check.
 *
 *   node tests/authority-policy.verify.js
 */
const assert = require('assert');
const policy = require('../service/authority/policy');

let pass = 0;
let fail = 0;
const failures = [];
function t(name, fn) {
    try { fn(); pass += 1; console.log(`  ✓ ${name}`); }
    catch (err) { fail += 1; failures.push({ name, message: err.message }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}
function section(title) { console.log(`\n${title}`); }

// 2026-09-09 is a Wednesday; 2026-09-12 a Saturday.
const WED_EVENING = new Date('2026-09-09T18:00:00Z');
const WED_MORNING = new Date('2026-09-09T08:00:00Z');
const SAT_NIGHT = new Date('2026-09-12T20:00:00Z');

const ROTA = [
    { name: 'Mumbai desk', roles: ['broker'], days: [1, 2, 3, 4, 5], start_hour: 3.5, end_hour: 12 },
    { name: 'Hamburg desk', roles: ['broker'], days: [1, 2, 3, 4, 5], start_hour: 7, end_hour: 16 },
    { name: 'Overnight', roles: ['broker'], days: [1, 2, 3, 4], start_hour: 22, end_hour: 3.5 },
];

const DELEGATION = {
    id: 'DEL-1',
    decision: 'settle_duty',
    status: 'active',
    scope: { corridors: ['IN-DE'], hs_chapters: ['62'], max_value_minor: 500000, currency: 'USD' },
};

const REQ = {
    decision: 'settle_duty',
    origin_country: 'IN',
    destination_country: 'DE',
    hs_codes: ['620520'],
    amount_minor: 250000,
    currency: 'USD',
};

const ev = (req = REQ, dels = [DELEGATION], now = WED_EVENING) => policy.evaluate(req, dels, { rota: ROTA, now, role: 'broker' });

(() => {
    // ── the never-delegable list ─────────────────────────────────────────────
    section('safety — decisions no limit may cover');
    t('a sanctions hit is never auto-approved, whatever the delegation says', () => {
        const generous = { ...DELEGATION, scope: { ...DELEGATION.scope, max_value_minor: 999999999999 } };
        const r = ev({ ...REQ, blockers: ['sanctions_hit'] }, [generous]);
        assert.strictEqual(r.auto_approved, false);
        assert.strictEqual(r.outcome, policy.OUTCOME.NEEDS_HUMAN);
    });
    t('every never-delegable blocker stops auto-approval', () => {
        for (const blocker of Object.keys(policy.NEVER_DELEGABLE)) {
            const r = ev({ ...REQ, blockers: [blocker] });
            assert.strictEqual(r.auto_approved, false, `${blocker} was auto-approved`);
        }
    });
    t('a blocked decision explains why, not just that', () => {
        const r = ev({ ...REQ, blockers: ['controlled_goods_licence'] });
        assert.strictEqual(r.blocked_by[0].blocker, 'controlled_goods_licence');
        assert.ok(r.blocked_by[0].reason.length > 20);
    });
    t('an unrecognised blocker string does not silently block everything', () => {
        const r = ev({ ...REQ, blockers: ['vibes'] });
        assert.strictEqual(r.auto_approved, true);
    });

    // ── scope matching ───────────────────────────────────────────────────────
    section('delegation scope');
    t('a request inside every limit is auto-approved', () => {
        const r = ev();
        assert.strictEqual(r.outcome, policy.OUTCOME.AUTO_APPROVED);
        assert.strictEqual(r.matched_delegation.id, 'DEL-1');
        assert.strictEqual(r.escalation_wait_hours, 0);
    });
    t('an amount over the limit escalates, naming the limit', () => {
        const r = ev({ ...REQ, amount_minor: 900000 });
        assert.strictEqual(r.auto_approved, false);
        assert.ok(r.reasons.some((x) => /exceeds the delegated limit 500000/.test(x)));
    });
    t('an amount exactly at the limit is inside it', () => {
        assert.strictEqual(ev({ ...REQ, amount_minor: 500000 }).auto_approved, true);
    });
    t('a commodity outside the delegated chapters escalates', () => {
        const r = ev({ ...REQ, hs_codes: ['240220'] });
        assert.ok(r.reasons.some((x) => /HS chapter\(s\) 24/.test(x)));
    });
    t('a corridor outside the delegation escalates', () => {
        const r = ev({ ...REQ, destination_country: 'US' });
        assert.ok(r.reasons.some((x) => /corridor IN-US is outside/.test(x)));
    });
    t('a currency mismatch escalates rather than converting silently', () => {
        const r = ev({ ...REQ, currency: 'EUR' });
        assert.ok(r.reasons.some((x) => /denominated in USD/.test(x)));
    });
    t('a delegation for a different decision type never matches', () => {
        const r = ev(REQ, [{ ...DELEGATION, decision: 'release_cargo' }]);
        assert.strictEqual(r.auto_approved, false);
    });
    t('a counterparty allowlist is enforced when present', () => {
        const scoped = { ...DELEGATION, scope: { ...DELEGATION.scope, counterparties: ['Acme Exports'] } };
        assert.strictEqual(ev({ ...REQ, counterparty: 'Acme Exports' }, [scoped]).auto_approved, true);
        assert.strictEqual(ev({ ...REQ, counterparty: 'Unknown Ltd' }, [scoped]).auto_approved, false);
    });
    t('an unset scope dimension imposes no restriction on it', () => {
        const loose = { id: 'D2', decision: 'settle_duty', status: 'active', scope: { max_value_minor: 500000, currency: 'USD' } };
        assert.strictEqual(ev({ ...REQ, destination_country: 'BR', hs_codes: ['930100'] }, [loose]).auto_approved, true);
    });

    // ── the misconfiguration that must not be possible ───────────────────────
    section('value limits');
    t('a delegation with no value limit grants nothing, rather than everything', () => {
        const blank = { id: 'D3', decision: 'settle_duty', status: 'active', scope: { corridors: ['IN-DE'] } };
        const r = ev(REQ, [blank]);
        assert.strictEqual(r.auto_approved, false, 'a blank limit must never mean unlimited');
        assert.ok(r.reasons.some((x) => /exceeds the delegated limit 0/.test(x)));
    });
    t('a zero-amount request is still inside a zero limit', () => {
        const blank = { id: 'D3', decision: 'settle_duty', status: 'active', scope: {} };
        assert.strictEqual(ev({ ...REQ, amount_minor: 0 }, [blank]).auto_approved, true);
    });

    // ── delegation lifecycle ─────────────────────────────────────────────────
    section('delegation lifecycle');
    t('a suspended delegation does not apply', () => {
        assert.strictEqual(ev(REQ, [{ ...DELEGATION, status: 'suspended' }]).auto_approved, false);
    });
    t('an expired delegation does not apply', () => {
        assert.strictEqual(ev(REQ, [{ ...DELEGATION, expires_at: '2026-01-01T00:00:00Z' }]).auto_approved, false);
    });
    t('a delegation not yet in force does not apply', () => {
        assert.strictEqual(ev(REQ, [{ ...DELEGATION, effective_from: '2027-01-01T00:00:00Z' }]).auto_approved, false);
    });
    t('an explicitly disabled delegation does not apply', () => {
        assert.strictEqual(ev(REQ, [{ ...DELEGATION, active: false }]).auto_approved, false);
    });
    t('the first matching delegation is used when several could apply', () => {
        const second = { ...DELEGATION, id: 'DEL-2' };
        assert.strictEqual(ev(REQ, [DELEGATION, second]).matched_delegation.id, 'DEL-1');
    });
    t('no delegations at all escalates with a clear reason', () => {
        const r = ev(REQ, []);
        assert.strictEqual(r.auto_approved, false);
        assert.deepStrictEqual(r.reasons, ['No delegation exists for this decision type.']);
    });

    // ── coverage ─────────────────────────────────────────────────────────────
    section('coverage rota');
    t('a weekday morning is covered', () => {
        const c = policy.coverageAt(ROTA, { now: WED_MORNING, role: 'broker' });
        assert.strictEqual(c.covered_now, true);
        assert.ok(c.on_duty.includes('Mumbai desk'));
        assert.strictEqual(c.wait_hours, 0);
    });
    t('a wrapping overnight window covers the hours after midnight', () => {
        // Thursday 01:00 UTC falls inside Wednesday's 22:00-03:30 window.
        const c = policy.coverageAt(ROTA, { now: new Date('2026-09-10T01:00:00Z'), role: 'broker' });
        assert.strictEqual(c.covered_now, true);
        assert.ok(c.on_duty.includes('Overnight'));
    });
    t('a weekend night is not covered and the wait is quantified', () => {
        const c = policy.coverageAt(ROTA, { now: SAT_NIGHT, role: 'broker' });
        assert.strictEqual(c.covered_now, false);
        // Sat 20:00 UTC -> Mon 03:30 UTC when the Mumbai desk opens.
        assert.strictEqual(c.wait_hours, 31.5);
        assert.deepStrictEqual(c.next_on_duty, ['Mumbai desk']);
    });
    t('the weekend wait shows up on the decision, not just the rota', () => {
        const r = ev({ ...REQ, amount_minor: 900000 }, [DELEGATION], SAT_NIGHT);
        assert.strictEqual(r.escalation_wait_hours, 31.5);
    });
    t('an auto-approved decision reports a zero wait even out of hours', () => {
        assert.strictEqual(ev(REQ, [DELEGATION], SAT_NIGHT).escalation_wait_hours, 0);
    });
    t('a role with nobody rostered is reported as an unbounded wait', () => {
        const c = policy.coverageAt(ROTA, { now: WED_MORNING, role: 'compliance_officer' });
        assert.strictEqual(c.covered_now, false);
        assert.strictEqual(c.wait_hours, null);
        assert.ok(/unbounded wait/.test(c.gap));
    });
    t('an empty rota is an unbounded wait, not an instant one', () => {
        const c = policy.coverageAt([], { now: WED_MORNING, role: 'broker' });
        assert.strictEqual(c.covered_now, false);
        assert.strictEqual(c.wait_hours, null);
    });

    // ── actionability ────────────────────────────────────────────────────────
    section('actionability');
    t('an escalation says what would have made it automatic', () => {
        const r = ev({ ...REQ, amount_minor: 900000 });
        assert.ok(r.would_auto_approve_if.length > 0);
        assert.ok(r.would_auto_approve_if[0].blocking_reasons.length > 0);
    });
    t('impact reports the automation rate and the hours actually waited', () => {
        const i = policy.coverageImpact([
            { auto_approved: true, escalation_wait_hours: 0 },
            { auto_approved: true, escalation_wait_hours: 0 },
            { auto_approved: false, escalation_wait_hours: 10 },
            { auto_approved: false, escalation_wait_hours: 20 },
        ]);
        assert.strictEqual(i.automation_rate, 50);
        assert.strictEqual(i.hours_waited, 30);
        assert.strictEqual(i.mean_escalation_wait_hours, 15);
        assert.strictEqual(i.hours_saved, 30);
    });
    t('impact over no decisions reports nothing rather than a perfect score', () => {
        assert.strictEqual(policy.coverageImpact([]).automation_rate, null);
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) {
        console.log('\nFailures:');
        failures.forEach((f) => console.log(`  • ${f.name}: ${f.message}`));
        process.exit(1);
    }
})();

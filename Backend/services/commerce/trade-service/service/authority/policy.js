'use strict';
/**
 * Delegated authority + coverage — PURE (Compression, Phase 7).
 *
 * A large slice of the baseline cycle is not work at all; it is waiting for
 * someone's morning. A declaration is ready at 18:00 in Mumbai and is approved
 * at 09:00 in Hamburg, and those fifteen hours appear nowhere in anyone's
 * process documentation.
 *
 * Two mechanisms remove it:
 *
 *   PRE-AUTHORISATION. A decision inside limits the customer has already set —
 *   this corridor, this commodity, under this value, this counterparty — does
 *   not need a person at all. It executes and is audited.
 *
 *   COVERAGE. When a person IS needed, the honest question is not "is someone
 *   available" but "how long until one is". A rota makes that a number, which
 *   turns an invisible overnight wait into a measurable, staffable one.
 *
 * SAFETY. Some decisions are NEVER delegable, however generous the limits: a
 * sanctions hit, a controlled-goods licence, a valuation dispute. Auto-approving
 * one of those is not a speed improvement, it is a compliance failure. That list
 * is checked before any delegation is consulted, and no configuration can
 * override it.
 *
 * PURE: no DB, no clock beyond the injected `now`.
 */

const POLICY_VERSION = '1.0.0';

const DECISION = Object.freeze({
    FILE_DECLARATION: 'file_declaration',
    SETTLE_DUTY: 'settle_duty',
    APPROVE_AMENDMENT: 'approve_amendment',
    ACCEPT_DUTY_VARIANCE: 'accept_duty_variance',
    RELEASE_CARGO: 'release_cargo',
    WAIVE_FINDING: 'waive_finding',
    RESPOND_TO_QUERY: 'respond_to_query',
});

const OUTCOME = Object.freeze({
    AUTO_APPROVED: 'auto_approved',
    NEEDS_HUMAN: 'needs_human',
    REFUSED: 'refused',
});

/**
 * Decisions no delegation may ever cover.
 *
 * Each entry states why. These are not conservative defaults to be tuned later —
 * they are the cases where speed is the wrong objective, and a customer asking
 * for them to be automated is asking for the wrong thing.
 */
const NEVER_DELEGABLE = Object.freeze({
    sanctions_hit: 'A sanctions or export-control match requires a human decision and a documented rationale. No value limit makes this safe to automate.',
    controlled_goods_licence: 'Licensable goods need a licence check against the actual licence, by a person who can read it.',
    valuation_dispute: 'A valuation challenge from the authority is a legal position, not a workflow step.',
    prohibited_goods: 'Prohibited goods must stop, not proceed faster.',
    duty_variance_above_tolerance: 'A duty assessment materially above the estimate may indicate a misclassification; paying it silently buries the error.',
});

const HOUR_MS = 3600 * 1000;

const upper = (v) => String(v || '').toUpperCase();
const chapterOf = (hs) => (hs ? String(hs).replace(/\D/g, '').slice(0, 2) : null);

/**
 * Does a delegation's scope cover this request?
 *
 * An unset scope dimension means "no restriction on that dimension" — but an
 * unset max_value is treated as zero rather than unlimited, because an
 * accidentally-blank value limit granting unlimited authority is the exact
 * misconfiguration this system must not have.
 */
function scopeCovers(delegation, request) {
    const scope = delegation.scope || {};
    const reasons = [];

    if (delegation.decision !== request.decision) {
        return { covers: false, reasons: [`delegation is for ${delegation.decision}, not ${request.decision}`] };
    }

    if (scope.corridors && scope.corridors.length) {
        const corridor = `${upper(request.origin_country)}-${upper(request.destination_country)}`;
        const anyDestination = scope.corridors.map(upper);
        if (!anyDestination.includes(corridor) && !anyDestination.includes(upper(request.destination_country))) {
            reasons.push(`corridor ${corridor} is outside the delegated corridors`);
        }
    }

    if (scope.hs_chapters && scope.hs_chapters.length) {
        const chapters = (request.hs_codes || []).map(chapterOf).filter(Boolean);
        const outside = chapters.filter((c) => !scope.hs_chapters.includes(c));
        if (outside.length) reasons.push(`HS chapter(s) ${[...new Set(outside)].join(', ')} are outside the delegated commodities`);
    }

    if (scope.counterparties && scope.counterparties.length) {
        if (request.counterparty && !scope.counterparties.includes(request.counterparty)) {
            reasons.push(`counterparty "${request.counterparty}" is not on the delegated list`);
        }
    }

    // A value limit is mandatory. Missing means zero, not unlimited.
    const limit = Number(scope.max_value_minor ?? 0);
    const amount = Number(request.amount_minor ?? 0);
    if (amount > limit) {
        reasons.push(`amount ${amount} exceeds the delegated limit ${limit}`);
    }

    if (scope.currency && request.currency && upper(scope.currency) !== upper(request.currency)) {
        reasons.push(`delegation is denominated in ${scope.currency}, request is in ${request.currency}`);
    }

    return { covers: reasons.length === 0, reasons };
}

/** Is the delegation itself in force right now? */
function delegationActive(delegation, now = new Date()) {
    if (delegation.active === false) return { active: false, reason: 'delegation is disabled' };
    if (delegation.status && delegation.status !== 'active') return { active: false, reason: `delegation is ${delegation.status}` };
    const nowMs = new Date(now).getTime();
    if (delegation.effective_from && nowMs < Date.parse(delegation.effective_from)) {
        return { active: false, reason: 'delegation is not yet in force' };
    }
    if (delegation.expires_at && nowMs > Date.parse(delegation.expires_at)) {
        return { active: false, reason: 'delegation has expired' };
    }
    return { active: true, reason: null };
}

// ── Coverage rota ────────────────────────────────────────────────────────────

/**
 * When is a human next available?
 *
 * A rota entry is a recurring weekly window in UTC:
 *   { name, roles, days: [1..7 (Mon..Sun)], start_hour, end_hour }
 *
 * A window whose end_hour is less than or equal to its start_hour wraps past
 * midnight, which is how an overnight desk is actually staffed.
 */
function coverageAt(rota = [], { now = new Date(), role = null, horizonHours = 168 } = {}) {
    const at = new Date(now);
    const inWindow = (entry, d) => {
        // JS getUTCDay(): 0=Sun. Rota uses ISO 1=Mon..7=Sun.
        const isoDay = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
        const hour = d.getUTCHours() + d.getUTCMinutes() / 60;
        const start = Number(entry.start_hour);
        const end = Number(entry.end_hour);
        const wraps = end <= start;

        if (!wraps) {
            return (entry.days || []).includes(isoDay) && hour >= start && hour < end;
        }
        // Wrapping window: covered either late on the listed day, or early on the
        // day after a listed day.
        const prevIso = isoDay === 1 ? 7 : isoDay - 1;
        return ((entry.days || []).includes(isoDay) && hour >= start)
            || ((entry.days || []).includes(prevIso) && hour < end);
    };

    const eligible = rota.filter((e) => !role || (e.roles || []).includes(role));
    const onDuty = eligible.filter((e) => inWindow(e, at));

    if (onDuty.length) {
        return {
            covered_now: true,
            on_duty: onDuty.map((e) => e.name),
            next_open_at: new Date(now).toISOString(),
            wait_hours: 0,
        };
    }

    // Step forward in 15-minute increments to the next covered moment. Coarse
    // enough to be cheap, fine enough that a shift boundary is not missed.
    for (let step = 1; step <= horizonHours * 4; step += 1) {
        const probe = new Date(at.getTime() + step * 15 * 60 * 1000);
        const open = eligible.filter((e) => inWindow(e, probe));
        if (open.length) {
            return {
                covered_now: false,
                on_duty: [],
                next_open_at: probe.toISOString(),
                wait_hours: Math.round(((probe.getTime() - at.getTime()) / HOUR_MS) * 100) / 100,
                next_on_duty: open.map((e) => e.name),
            };
        }
    }

    return {
        covered_now: false,
        on_duty: [],
        next_open_at: null,
        wait_hours: null,
        // Worth saying out loud: a decision type with no rota at all is an
        // unbounded wait, which is precisely the invisible delay this phase
        // exists to surface.
        gap: `No ${role || 'coverage'} is rostered within the next ${horizonHours} hours. Decisions of this type have an unbounded wait.`,
    };
}

// ── The decision ─────────────────────────────────────────────────────────────

/**
 * Decide whether a request can proceed without a person.
 *
 * @param {object} request      { decision, origin_country, destination_country,
 *                                hs_codes, counterparty, amount_minor, currency,
 *                                blockers: ['sanctions_hit', ...] }
 * @param {object[]} delegations
 * @param {object} opts         { rota, now, role }
 */
function evaluate(request = {}, delegations = [], { rota = [], now = new Date(), role = 'broker' } = {}) {
    const blockers = (request.blockers || []).filter((b) => NEVER_DELEGABLE[b]);

    // Hard stops first. No delegation is consulted, and none could help.
    if (blockers.length) {
        const coverage = coverageAt(rota, { now, role });
        return {
            policy_version: POLICY_VERSION,
            decision: request.decision,
            outcome: OUTCOME.NEEDS_HUMAN,
            auto_approved: false,
            matched_delegation: null,
            blocked_by: blockers.map((b) => ({ blocker: b, reason: NEVER_DELEGABLE[b] })),
            reasons: blockers.map((b) => NEVER_DELEGABLE[b]),
            coverage,
            escalation_wait_hours: coverage.wait_hours,
        };
    }

    const considered = [];
    let matched = null;

    for (const d of delegations) {
        const active = delegationActive(d, now);
        if (!active.active) {
            considered.push({ delegation_id: d.id, matched: false, reasons: [active.reason] });
            continue;
        }
        const scope = scopeCovers(d, request);
        considered.push({ delegation_id: d.id, matched: scope.covers, reasons: scope.reasons });
        if (scope.covers && !matched) matched = d;
    }

    if (matched) {
        return {
            policy_version: POLICY_VERSION,
            decision: request.decision,
            outcome: OUTCOME.AUTO_APPROVED,
            auto_approved: true,
            matched_delegation: { id: matched.id, label: matched.label || null, delegate: matched.delegate || null },
            considered,
            blocked_by: [],
            reasons: [`Within the limits of delegation ${matched.id}`],
            // Even an auto-approved decision reports coverage, so an operator can
            // see who would have handled it had it fallen outside.
            coverage: coverageAt(rota, { now, role }),
            escalation_wait_hours: 0,
        };
    }

    const coverage = coverageAt(rota, { now, role });
    return {
        policy_version: POLICY_VERSION,
        decision: request.decision,
        outcome: OUTCOME.NEEDS_HUMAN,
        auto_approved: false,
        matched_delegation: null,
        considered,
        blocked_by: [],
        reasons: considered.length
            ? [...new Set(considered.flatMap((c) => c.reasons))]
            : ['No delegation exists for this decision type.'],
        coverage,
        escalation_wait_hours: coverage.wait_hours,
        // The actionable half: what would have to change for this to be automatic
        // next time.
        would_auto_approve_if: considered
            .filter((c) => !c.matched && c.reasons.length)
            .map((c) => ({ delegation_id: c.delegation_id, blocking_reasons: c.reasons })),
    };
}

/**
 * How much wall-clock time delegation is actually saving.
 *
 * Auto-approved decisions cost nothing; escalated ones cost their wait. The gap
 * between them is the number that justifies widening a limit — or shows that a
 * limit is set so tight it delegates nothing.
 */
function coverageImpact(evaluations = []) {
    if (!evaluations.length) return { decisions: 0, auto_approved: 0, automation_rate: null, hours_waited: 0, hours_saved: 0 };
    const auto = evaluations.filter((e) => e.auto_approved);
    const waited = evaluations.filter((e) => !e.auto_approved);
    const totalWait = waited.reduce((a, e) => a + Number(e.escalation_wait_hours || 0), 0);
    const meanWait = waited.length ? totalWait / waited.length : 0;
    return {
        decisions: evaluations.length,
        auto_approved: auto.length,
        automation_rate: Math.round((auto.length / evaluations.length) * 1000) / 10,
        hours_waited: Math.round(totalWait * 100) / 100,
        mean_escalation_wait_hours: Math.round(meanWait * 100) / 100,
        // What the auto-approved decisions would have cost at the observed mean
        // escalation wait.
        hours_saved: Math.round(auto.length * meanWait * 100) / 100,
    };
}

module.exports = {
    POLICY_VERSION,
    DECISION,
    OUTCOME,
    NEVER_DELEGABLE,
    chapterOf,
    scopeCovers,
    delegationActive,
    coverageAt,
    evaluate,
    coverageImpact,
};

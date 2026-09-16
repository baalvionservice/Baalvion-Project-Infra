'use strict';
/**
 * Accreditation readiness assessment — PURE (Compression, Phase 6).
 *
 * Scores an operator against a programme's published criteria and, more
 * usefully, says what is missing and who has to fix it. A readiness percentage
 * on its own is a vanity metric; the gap list with owners is the deliverable.
 *
 * The split that keeps this honest is `platform_can_evidence`. The platform can
 * produce a filing history, an audit trail, seal records and counterparty KYC.
 * It cannot produce audited accounts, a fenced yard or a qualified customs
 * manager. Reporting those as platform gaps would let a customer believe they
 * are further along than they are, and they would find out at the audit.
 *
 * PURE: no DB, no clock beyond the injected `now`.
 */

const programmes = require('./programmes');

const ASSESSMENT_VERSION = '1.0.0';

const EVIDENCE_STATUS = Object.freeze({
    SATISFIED: 'satisfied',
    PARTIAL: 'partial',
    MISSING: 'missing',
    NOT_ASSESSED: 'not_assessed',
});

// A partial criterion earns half credit: real progress toward an audit, but not
// something to present as met.
const STATUS_CREDIT = Object.freeze({
    [EVIDENCE_STATUS.SATISFIED]: 1,
    [EVIDENCE_STATUS.PARTIAL]: 0.5,
    [EVIDENCE_STATUS.MISSING]: 0,
    [EVIDENCE_STATUS.NOT_ASSESSED]: 0,
});

/**
 * Assess an operator against one programme.
 *
 * @param {string} programmeCode
 * @param {object} evidence  { [criterion]: 'satisfied'|'partial'|'missing'|'not_assessed' }
 * @param {object} opts      { heldProgrammes: [] } — for prerequisite checking
 */
function assess(programmeCode, evidence = {}, { heldProgrammes = [] } = {}) {
    const programme = programmes.PROGRAMMES[programmeCode];
    if (!programme) throw new Error(`Unknown trusted-trader programme: ${programmeCode}`);

    const rows = programme.criteria.map((key) => {
        const def = programmes.CRITERIA[key];
        const status = evidence[key] || EVIDENCE_STATUS.NOT_ASSESSED;
        const credit = STATUS_CREDIT[status] ?? 0;
        return {
            criterion: key,
            label: def.label,
            weight: def.weight,
            status,
            credit,
            earned: Math.round(def.weight * credit * 100) / 100,
            description: def.description,
            evidence_required: def.evidence,
            // Whose problem this is. Platform-evidenced gaps we can close;
            // the rest need the customer's own organisation.
            owner: def.platform_can_evidence ? 'platform' : 'operator',
        };
    });

    const totalWeight = rows.reduce((a, r) => a + r.weight, 0);
    const earned = rows.reduce((a, r) => a + r.earned, 0);
    const readiness = totalWeight > 0 ? Math.round((earned / totalWeight) * 1000) / 10 : 0;

    const gaps = rows.filter((r) => r.status !== EVIDENCE_STATUS.SATISFIED);
    const missingPrereqs = (programme.prerequisites || []).filter((p) => !heldProgrammes.includes(p));

    // Rank the gaps by how much readiness each one unlocks. Working the biggest
    // weight first is the difference between a 4-month and an 8-month programme.
    const nextActions = gaps
        .slice()
        .sort((a, b) => (b.weight * (1 - b.credit)) - (a.weight * (1 - a.credit)))
        .slice(0, 5)
        .map((g) => ({
            criterion: g.criterion,
            label: g.label,
            owner: g.owner,
            readiness_points_available: Math.round(g.weight * (1 - g.credit) * 10) / 10,
            evidence_required: g.evidence_required,
        }));

    return {
        assessment_version: ASSESSMENT_VERSION,
        programme: programme.code,
        programme_label: programme.label,
        authority: programme.authority,
        readiness_pct: readiness,
        // An authority will not accept an application with an open criterion, so
        // "ready to apply" is all-satisfied, not a threshold.
        ready_to_apply: gaps.length === 0 && missingPrereqs.length === 0,
        missing_prerequisites: missingPrereqs,
        criteria: rows,
        gaps: gaps.map((g) => ({ criterion: g.criterion, label: g.label, status: g.status, owner: g.owner })),
        platform_owned_gaps: gaps.filter((g) => g.owner === 'platform').length,
        operator_owned_gaps: gaps.filter((g) => g.owner === 'operator').length,
        next_actions: nextActions,
        typical_lead_time_days: programme.typical_lead_time_days,
        estimated_exam_rate_multiplier: programme.exam_rate_multiplier,
        note: 'Accreditation is granted by the authority after its own audit. This is a readiness assessment against the published criteria, not an approval.',
    };
}

/** Assess against every programme available where the operator is established. */
function assessAll(homeCountry, evidence = {}, { heldProgrammes = [] } = {}) {
    return programmes.programmesFor(homeCountry).map((p) => {
        try {
            return assess(p.code, evidence, { heldProgrammes });
        } catch {
            return null;
        }
    }).filter(Boolean).sort((a, b) => b.readiness_pct - a.readiness_pct);
}

/**
 * Is a held accreditation still good? Accreditation is revocable and is normally
 * re-validated periodically, so an expiry that has quietly passed must read as
 * NOT accredited — continuing to price a fast lane against a lapsed status is
 * how a customer gets an unexpected exam.
 */
function validity(held = {}, { now = new Date() } = {}) {
    const nowMs = new Date(now).getTime();
    const expires = held.expires_at ? Date.parse(held.expires_at) : null;
    const suspended = held.status === 'suspended' || held.status === 'revoked';

    let state = 'active';
    if (suspended) state = held.status;
    else if (expires && nowMs > expires) state = 'expired';
    else if (expires && expires - nowMs < 90 * 24 * 3600 * 1000) state = 'renewal_due';

    return {
        programme: held.programme,
        state,
        // Only an active or renewal-due accreditation confers benefit. Anything
        // else is treated as unaccredited by the risk model.
        confers_benefit: state === 'active' || state === 'renewal_due',
        expires_at: held.expires_at || null,
        days_to_expiry: expires ? Math.floor((expires - nowMs) / (24 * 3600 * 1000)) : null,
    };
}

module.exports = { ASSESSMENT_VERSION, EVIDENCE_STATUS, STATUS_CREDIT, assess, assessAll, validity };

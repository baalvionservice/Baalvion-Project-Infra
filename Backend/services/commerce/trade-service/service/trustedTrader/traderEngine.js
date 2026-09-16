'use strict';
/**
 * Trusted trader — DB-backed ORCHESTRATOR (Compression, Phase 6).
 *
 * Two responsibilities the pure cores avoid:
 *
 *   • Building the risk profile from OBSERVED history. Filing count, first-pass
 *     acceptance and examination findings are all recomputed from what actually
 *     happened, never taken from a customer's own claim — a self-declared
 *     first-pass rate defeats the entire metric.
 *
 *   • Keeping accreditation status honest over time. An accreditation that has
 *     quietly expired must stop conferring benefit the moment it lapses, so
 *     expiry is applied on read rather than waiting for a nightly job.
 */

const db = require('../../models');
const programmes = require('./programmes');
const assessment = require('./assessment');
const risk = require('./risk');
const { AppError } = require('../../utils/errors');

const plain = (x) => (x && typeof x.toJSON === 'function' ? x.toJSON() : x);

/**
 * Recompute a trader's risk profile from observed history.
 *
 * Deliberately reads the filing_prechecks ledger (Phase 2) rather than any
 * summary table: the number that matters is what the gateways actually did.
 */
async function recomputeProfile(orgId, { tenantId = null, now = new Date() } = {}) {
    const where = {};
    if (tenantId) where.tenant_id = tenantId;

    const prechecks = db.FilingPrecheck
        ? (await db.FilingPrecheck.findAll({
            where: { ...where, gateway_outcome: { [db.Sequelize.Op.ne]: null } },
            limit: 5000,
            order: [['created_at', 'DESC']],
        })).map(plain)
        : [];

    const accepted = prechecks.filter((p) => p.gateway_outcome === 'accepted').length;
    const firstPass = prechecks.length ? Math.round((accepted / prechecks.length) * 10000) / 10000 : null;

    const consignments = db.Consignment
        ? (await db.Consignment.findAll({ where, limit: 5000, order: [['created_at', 'DESC']] })).map(plain)
        : [];

    const values = consignments
        .map((c) => Number((c.totals || {}).customs_value || 0))
        .filter((v) => v > 0);
    const avgValue = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : null;

    const counterparties = [...new Set(consignments
        .map((c) => ((c.canonical || {}).parties || {}).exporter)
        .filter(Boolean)
        .map((p) => p.name)
        .filter(Boolean))];

    const oldest = consignments.length ? new Date(consignments[consignments.length - 1].created_at) : null;
    const monthsTrading = oldest
        ? Math.max(0, Math.floor((new Date(now).getTime() - oldest.getTime()) / (30 * 24 * 3600 * 1000)))
        : 0;

    const values_ = {
        filings_count: prechecks.length,
        first_pass_rate: firstPass,
        average_consignment_value: avgValue,
        known_counterparties: counterparties.slice(0, 500),
        months_trading: monthsTrading,
        computed_at: now,
    };

    const lookup = { org_id: orgId };
    if (tenantId) lookup.tenant_id = tenantId;
    const existing = await db.TraderRiskProfile.findOne({ where: lookup });
    if (existing) {
        // prior_exams / prior_findings are recorded by an operator when an
        // authority reports them; a recompute must not wipe that history.
        await existing.update(values_);
        return plain(existing);
    }
    return plain(await db.TraderRiskProfile.create({ ...(tenantId ? { tenant_id: tenantId } : {}), org_id: orgId, ...values_ }));
}

/** Accreditations with expiry applied on read, so a lapsed one stops counting immediately. */
async function accreditationsFor(orgId, { tenantId = null, now = new Date() } = {}) {
    const where = { org_id: orgId };
    if (tenantId) where.tenant_id = tenantId;
    const rows = (await db.TraderAccreditation.findAll({ where })).map(plain);

    return rows.map((r) => {
        const v = assessment.validity({
            programme: r.programme,
            status: r.status,
            expires_at: r.expires_at ? new Date(r.expires_at).toISOString() : null,
        }, { now });
        return { ...r, validity: v };
    });
}

/** Record or update a held accreditation. */
async function upsertAccreditation(orgId, {
    tenantId = null, programme, status = 'in_progress', reference = null,
    grantedAt = null, expiresAt = null, evidence = {}, actor = null, now = new Date(),
} = {}) {
    if (!programmes.PROGRAMMES[programme]) {
        throw new AppError('UNKNOWN_PROGRAMME', `Unknown trusted-trader programme: ${programme}`, 400,
            { known: Object.keys(programmes.PROGRAMMES) });
    }
    if (status === 'active' && !expiresAt) {
        // An active accreditation with no expiry would confer benefit forever,
        // which is exactly the stale-status failure this phase guards against.
        throw new AppError('EXPIRY_REQUIRED',
            'An active accreditation must carry an expiry date — accreditation is revocable and periodically re-validated.', 422);
    }

    const readiness = Object.keys(evidence).length
        ? assessment.assess(programme, evidence).readiness_pct
        : null;

    const where = { org_id: orgId, programme };
    if (tenantId) where.tenant_id = tenantId;
    const existing = await db.TraderAccreditation.findOne({ where });

    const values = {
        status,
        reference,
        authority: programmes.PROGRAMMES[programme].authority,
        granted_at: grantedAt,
        expires_at: expiresAt,
        readiness_pct: readiness,
        evidence,
        last_assessed: Object.keys(evidence).length ? now : (existing ? existing.last_assessed : null),
    };

    if (existing) {
        await existing.update(values);
        return plain(existing);
    }
    return plain(await db.TraderAccreditation.create({
        ...(tenantId ? { tenant_id: tenantId } : {}),
        org_id: orgId, programme, created_by: actor, ...values,
    }));
}

/** Readiness across every programme available where the operator is established. */
async function readiness(orgId, homeCountry, { tenantId = null, now = new Date() } = {}) {
    const held = await accreditationsFor(orgId, { tenantId, now });
    const heldCodes = held.filter((h) => h.validity.confers_benefit).map((h) => h.programme);

    // Merge whatever evidence has been captured across applications — a criterion
    // proven for one programme is proven for another.
    const evidence = held.reduce((acc, h) => ({ ...acc, ...(h.evidence || {}) }), {});

    return {
        org_id: orgId,
        home_country: homeCountry,
        held: held.map((h) => ({ programme: h.programme, status: h.status, validity: h.validity, readiness_pct: h.readiness_pct })),
        assessments: assessment.assessAll(homeCountry, evidence, { heldProgrammes: heldCodes }),
        evidence_captured: Object.keys(evidence).length,
    };
}

/** Selection-risk estimate for a specific consignment, using the observed profile. */
async function estimateRisk(orgId, consignmentCanonical, { tenantId = null, now = new Date() } = {}) {
    const lookup = { org_id: orgId };
    if (tenantId) lookup.tenant_id = tenantId;
    const profile = plain(await db.TraderRiskProfile.findOne({ where: lookup })) || {};
    const held = await accreditationsFor(orgId, { tenantId, now });

    const trader = {
        accreditations: held.map((h) => ({
            programme: h.programme,
            status: h.status,
            expires_at: h.expires_at ? new Date(h.expires_at).toISOString() : null,
        })),
        filings_count: Number(profile.filings_count || 0),
        first_pass_rate: profile.first_pass_rate == null ? null : Number(profile.first_pass_rate),
        prior_exams: Number(profile.prior_exams || 0),
        prior_findings: Number(profile.prior_findings || 0),
        average_consignment_value: Number(profile.average_consignment_value || 0),
        known_counterparties: profile.known_counterparties || [],
        months_trading: Number(profile.months_trading || 0),
    };

    return {
        ...risk.estimate(trader, consignmentCanonical || {}, { now }),
        profile_computed_at: profile.computed_at || null,
        // Named so a caller can tell a low estimate backed by 400 filings from a
        // low estimate backed by none.
        profile_basis: { filings: trader.filings_count, months_trading: trader.months_trading },
    };
}

/** Record an examination outcome — it persists on the trader record for years. */
async function recordExamination(orgId, { tenantId = null, foundDiscrepancy = false } = {}) {
    const where = { org_id: orgId };
    if (tenantId) where.tenant_id = tenantId;
    let row = await db.TraderRiskProfile.findOne({ where });
    if (!row) {
        row = await db.TraderRiskProfile.create({ ...(tenantId ? { tenant_id: tenantId } : {}), org_id: orgId });
    }
    await row.update({
        prior_exams: Number(row.prior_exams || 0) + 1,
        prior_findings: Number(row.prior_findings || 0) + (foundDiscrepancy ? 1 : 0),
    });
    return plain(row);
}

module.exports = {
    recomputeProfile, accreditationsFor, upsertAccreditation, readiness, estimateRisk, recordExamination,
};

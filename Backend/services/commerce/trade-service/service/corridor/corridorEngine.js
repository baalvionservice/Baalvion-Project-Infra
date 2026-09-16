'use strict';
/**
 * Corridor gate — DB-backed ORCHESTRATOR (Compression, Phase 2).
 *
 * Three jobs the pure cores deliberately avoid:
 *
 *   • Rule loading   — DB corridor_rules are merged over the built-in matrix, so
 *                      a jurisdiction change is a row, not a deploy. Cached,
 *                      because the gate runs on every keystroke-level revalidation.
 *
 *   • Gate + persist — evaluate() stores every evaluation. This is what makes
 *                      first-pass acceptance measurable instead of asserted.
 *
 *   • Reconciliation — reconcile() backfills the real gateway outcome onto the
 *                      precheck that preceded it. Without this the predicted
 *                      probability is a number nobody ever checks, which is worse
 *                      than having none.
 *
 * assertSubmittable() is the hard gate: it THROWS. Callers on the filing path
 * cannot accidentally ignore a boolean, which is the failure mode that would put
 * the rejection loop straight back.
 */

const db = require('../../models');
const cache = require('../../cache');
const matrix = require('./matrix');
const precheckCore = require('./precheck');
const { AppError } = require('../../utils/errors');

const RULES_CACHE_KEY = cache.key('corridor', 'rules', 'active');
const RULES_TTL = 300; // seconds — rules change on a legislative cadence, not a request one

const plain = (x) => (x && typeof x.toJSON === 'function' ? x.toJSON() : x);

/**
 * DB rules in the shape matrix.resolve() consumes. Best-effort: the table is a
 * layer on top of the built-in ruleset, so if it is missing or unmigrated the
 * gate still enforces the defaults rather than silently passing everything.
 */
async function loadExtraRules({ now = new Date() } = {}) {
    if (!db.CorridorRule) return [];
    try {
        return await cache.wrap(RULES_CACHE_KEY, RULES_TTL, async () => {
            const rows = await db.CorridorRule.findAll({ where: { active: true }, order: [['priority', 'ASC']] });
            return rows.map(plain).map((r) => ({
                id: r.id,
                scope: r.scope,
                when: r.when_clause || {},
                requires: r.requires || {},
                severity: r.severity,
                reason: r.reason,
                adds_floor_hours: Number(r.adds_floor_hours || 0),
                effective_from: r.effective_from,
                effective_to: r.effective_to,
            }));
        }).then((rules) => rules.filter((r) => {
            // A rule that is not yet in force, or has lapsed, must not gate a
            // filing — trade rules have hard commencement dates.
            const today = new Date(now).toISOString().slice(0, 10);
            if (r.effective_from && today < r.effective_from) return false;
            if (r.effective_to && today > r.effective_to) return false;
            return true;
        }));
    } catch {
        return []; // table missing / not migrated — fall back to the built-ins
    }
}

/** Which derived documents does this consignment currently hold? */
async function documentsPresentFor(consignmentId, tenantId) {
    if (!consignmentId || !db.ConsignmentDocument) return [];
    try {
        const where = { consignment_id: consignmentId };
        if (tenantId) where.tenant_id = tenantId;
        const rows = await db.ConsignmentDocument.findAll({ where, attributes: ['doc_type'] });
        return rows.map((r) => r.doc_type);
    } catch {
        return [];
    }
}

/**
 * Run the gate and persist the result.
 *
 * @param {object} consignment  normalized canonical consignment
 * @param {object} opts         { tenantId, consignmentId, partyStatus, certificatesPresent, persist }
 */
async function evaluate(consignment, {
    tenantId = null,
    consignmentId = null,
    shipmentId = null,
    partyStatus = 'verified',
    documentsPresent = null,
    certificatesPresent = [],
    actor = null,
    persist = true,
    now = new Date(),
} = {}) {
    const extraRules = await loadExtraRules({ now });
    const docs = documentsPresent || await documentsPresentFor(consignmentId, tenantId);

    const result = precheckCore.precheck(consignment, {
        partyStatus, extraRules, documentsPresent: docs, certificatesPresent,
    });

    if (!persist || !db.FilingPrecheck) return { ...result, precheck_id: null };

    const row = await db.FilingPrecheck.create({
        ...(tenantId ? { tenant_id: tenantId } : {}),
        consignment_id: consignmentId,
        shipment_id: shipmentId,
        origin_country: consignment.origin_country,
        destination_country: consignment.destination_country,
        direction: consignment.direction,
        submittable: result.submittable,
        blocking_count: result.blocking_count,
        warning_count: result.warning_count,
        findings: result.findings,
        requirements: result.requirements,
        predicted_first_pass: result.first_pass_probability,
        corridor_floor_hours: result.corridor_floor_hours,
        precheck_version: result.precheck_version,
        matrix_version: result.matrix_version,
        created_by: actor,
    });

    return { ...result, precheck_id: row.id };
}

/**
 * The hard gate on the filing path. Throws rather than returning false, so a
 * caller cannot ignore it — the whole phase is worthless if a blocked filing can
 * still be transmitted by forgetting an if-statement.
 */
async function assertSubmittable(consignment, opts = {}) {
    const result = await evaluate(consignment, opts);
    if (!result.submittable) {
        throw new AppError('FILING_NOT_SUBMITTABLE',
            `Filing blocked by ${result.blocking_count} unmet requirement(s). Fix these before submitting — a rejected filing costs a full clearance cycle, not a retry.`,
            422,
            {
                precheck_id: result.precheck_id,
                blocking: result.findings.filter((f) => f.severity === matrix.SEVERITY.BLOCKING),
                corridor_floor_hours: result.corridor_floor_hours,
            });
    }
    return result;
}

/**
 * Backfill the real gateway outcome onto the precheck that preceded it. Called
 * when a customs submission reaches a terminal state.
 */
async function reconcile(precheckId, { outcome, reason = null, submissionId = null, tenantId = null, now = new Date() } = {}) {
    if (!['accepted', 'rejected'].includes(outcome)) {
        throw new AppError('VALIDATION_ERROR', 'outcome must be accepted or rejected', 400);
    }
    const where = { id: precheckId };
    if (tenantId) where.tenant_id = tenantId;
    const row = await db.FilingPrecheck.findOne({ where });
    if (!row) throw new AppError('NOT_FOUND', 'Precheck not found', 404);
    await row.update({
        gateway_outcome: outcome,
        gateway_reason: reason,
        submission_id: submissionId || row.submission_id,
        reconciled_at: now,
    });
    return plain(row);
}

/**
 * First-pass acceptance — the Phase 2 KPI.
 *
 * Reported only over RECONCILED rows: a rate computed over predictions rather
 * than outcomes would flatter itself indefinitely. The gap between predicted and
 * observed is reported too, because a widening gap means the rule matrix has
 * fallen behind the corridor and needs new rules.
 */
async function firstPassRate({ tenantId = null, since = null, destination = null, limit = 10000 } = {}) {
    const where = { gateway_outcome: { [db.Sequelize.Op.ne]: null } };
    if (tenantId) where.tenant_id = tenantId;
    if (destination) where.destination_country = String(destination).toUpperCase();
    if (since) where.created_at = { [db.Sequelize.Op.gte]: new Date(since) };

    const rows = (await db.FilingPrecheck.findAll({
        where, limit: Math.min(50000, Number(limit) || 10000), order: [['created_at', 'DESC']],
    })).map(plain);

    if (!rows.length) {
        return { samples: 0, observed_first_pass: null, predicted_first_pass: null, note: 'No reconciled filings yet — the rate is unknown, not 100%.' };
    }

    const accepted = rows.filter((r) => r.gateway_outcome === 'accepted').length;
    const observed = Math.round((accepted / rows.length) * 10000) / 10000;
    const predicted = Math.round((rows.reduce((a, r) => a + Number(r.predicted_first_pass || 0), 0) / rows.length) * 10000) / 10000;

    // Which corridors and which findings actually correlate with rejection —
    // this is what tells us where to add a rule.
    const byCorridor = {};
    for (const r of rows) {
        const key = `${r.origin_country || '??'}→${r.destination_country || '??'}`;
        const g = byCorridor[key] || (byCorridor[key] = { corridor: key, total: 0, accepted: 0 });
        g.total += 1;
        if (r.gateway_outcome === 'accepted') g.accepted += 1;
    }
    const rejectionReasons = {};
    for (const r of rows.filter((x) => x.gateway_outcome === 'rejected')) {
        const key = r.gateway_reason || 'unspecified';
        rejectionReasons[key] = (rejectionReasons[key] || 0) + 1;
    }

    return {
        samples: rows.length,
        observed_first_pass: observed,
        predicted_first_pass: predicted,
        // A large positive gap means the gate is over-confident: real rejections
        // are getting through it, so the matrix is missing a rule.
        calibration_gap: Math.round((predicted - observed) * 10000) / 10000,
        by_corridor: Object.values(byCorridor)
            .map((g) => ({ ...g, rate: Math.round((g.accepted / g.total) * 10000) / 10000 }))
            .sort((a, b) => a.rate - b.rate),
        rejection_reasons: Object.entries(rejectionReasons)
            .map(([reason, count]) => ({ reason, count }))
            .sort((a, b) => b.count - a.count),
    };
}

/** Resolve the requirement set without persisting — the "what do I need?" call. */
async function requirementsFor(consignment, { partyStatus = 'verified', now = new Date() } = {}) {
    const extraRules = await loadExtraRules({ now });
    return matrix.resolve(consignment, { partyStatus, extraRules });
}

const invalidateRuleCache = () => cache.del(RULES_CACHE_KEY).catch(() => null);

module.exports = {
    loadExtraRules, evaluate, assertSubmittable, reconcile, firstPassRate, requirementsFor, invalidateRuleCache,
};

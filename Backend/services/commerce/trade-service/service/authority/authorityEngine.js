'use strict';
/**
 * Delegated authority — DB-backed ORCHESTRATOR (Compression, Phase 7).
 *
 * Loads the delegations and the rota, runs the pure policy, and records the
 * outcome. The recording is not bookkeeping: an automation rate nobody measures
 * drifts, and a limit set so tight that it delegates nothing looks identical to
 * one that is working until someone counts.
 *
 * Every decision that executed WITHOUT a person is auditable from this table,
 * which is also what an AEO auditor will ask to see (Phase 6, records-management
 * criterion).
 */

const db = require('../../models');
const policy = require('./policy');
const clearanceLedger = require('../clearance/ledger');
const { AppError } = require('../../utils/errors');

const plain = (x) => (x && typeof x.toJSON === 'function' ? x.toJSON() : x);

async function loadDelegations({ tenantId = null, orgId = null, decision = null } = {}) {
    const where = {};
    if (tenantId) where.tenant_id = tenantId;
    if (orgId) where.org_id = orgId;
    if (decision) where.decision = decision;
    const rows = (await db.AuthorityDelegation.findAll({ where })).map(plain);
    return rows.map((r) => ({
        id: r.id,
        label: r.label,
        decision: r.decision,
        status: r.status,
        delegate: r.delegate,
        effective_from: r.effective_from,
        expires_at: r.expires_at,
        // The column is the authority; the scope blob only carries the
        // dimensional restrictions. Keeping the limit in a typed NOT NULL column
        // is what stops a blank JSON field from meaning "unlimited".
        scope: { ...(r.scope || {}), max_value_minor: Number(r.max_value_minor), currency: r.currency },
    }));
}

async function loadRota({ tenantId = null } = {}) {
    const where = { active: true };
    if (tenantId) where.tenant_id = tenantId;
    const rows = (await db.AuthorityRota.findAll({ where })).map(plain);
    return rows.map((r) => ({
        name: r.name,
        roles: r.roles || [],
        days: r.days || [],
        start_hour: Number(r.start_hour),
        end_hour: Number(r.end_hour),
    }));
}

/**
 * Evaluate a decision and record it.
 *
 * An escalated decision opens a ledger block on the stage it belongs to, so the
 * wait shows up in the compression clock rather than hiding inside a stage that
 * merely looks slow.
 */
async function decide(request = {}, {
    tenantId = null, orgId = null, consignmentId = null, role = 'broker',
    actor = null, persist = true, now = new Date(),
} = {}) {
    const [delegations, rota] = await Promise.all([
        loadDelegations({ tenantId, orgId, decision: request.decision }),
        loadRota({ tenantId }),
    ]);

    const result = policy.evaluate(request, delegations, { rota, now, role });

    if (persist && db.AuthorityDecision) {
        const row = await db.AuthorityDecision.create({
            ...(tenantId ? { tenant_id: tenantId } : {}),
            org_id: orgId,
            consignment_id: consignmentId,
            decision: request.decision,
            outcome: result.outcome,
            auto_approved: result.auto_approved,
            matched_delegation_id: result.matched_delegation ? result.matched_delegation.id : null,
            amount_minor: request.amount_minor ?? null,
            currency: request.currency || null,
            request,
            reasons: result.reasons,
            blocked_by: result.blocked_by,
            coverage: result.coverage,
            escalation_wait_hours: result.escalation_wait_hours,
            policy_version: result.policy_version,
            created_by: actor,
        });
        result.decision_id = row.id;
    }

    // Make the human wait visible on the compression clock. Without this it hides
    // inside whichever stage merely looks slow.
    if (consignmentId && !result.auto_approved) {
        const stage = STAGE_FOR_DECISION[request.decision];
        if (stage) {
            clearanceLedger.record({ subjectType: 'consignment', subjectId: consignmentId }, stage, 'block', {
                tenantId,
                waitingOn: role,
                reason: result.blocked_by.length ? result.blocked_by[0].blocker : 'awaiting human authorisation',
                now,
            });
        }
    }

    return result;
}

// Which compression stage a decision belongs to, so an escalation blocks the
// right clock rather than a generic one.
const STAGE_FOR_DECISION = Object.freeze({
    file_declaration: 'export_filing',
    settle_duty: 'duty_payment',
    accept_duty_variance: 'import_assessment',
    approve_amendment: 'document_verification',
    release_cargo: 'release_order',
    waive_finding: 'document_verification',
    respond_to_query: 'import_assessment',
});

/** Close out an escalated decision once a person has handled it. */
async function resolve(decisionId, { tenantId = null, resolvedBy = null, now = new Date() } = {}) {
    const where = { id: decisionId };
    if (tenantId) where.tenant_id = tenantId;
    const row = await db.AuthorityDecision.findOne({ where });
    if (!row) throw new AppError('NOT_FOUND', 'Decision not found', 404);
    if (row.resolved_at) return plain(row);

    await row.update({ resolved_at: now, resolved_by: resolvedBy });

    if (row.consignment_id) {
        const stage = STAGE_FOR_DECISION[row.decision];
        if (stage) {
            clearanceLedger.record({ subjectType: 'consignment', subjectId: row.consignment_id }, stage, 'unblock',
                { tenantId: row.tenant_id, now });
        }
    }
    return plain(row);
}

async function upsertDelegation(id, {
    tenantId = null, orgId = null, label = null, decision, scope = {},
    maxValueMinor, currency = 'USD', delegate = null, grantedBy = null,
    effectiveFrom = null, expiresAt = null, status = 'active',
} = {}) {
    if (!policy.DECISION[String(decision || '').toUpperCase()]) {
        throw new AppError('UNKNOWN_DECISION', `Unknown decision type: ${decision}`, 400,
            { known: Object.values(policy.DECISION) });
    }
    if (maxValueMinor === undefined || maxValueMinor === null || !Number.isInteger(Number(maxValueMinor))) {
        // Refused rather than defaulted. A delegation whose limit was omitted must
        // not silently become an unlimited one.
        throw new AppError('VALUE_LIMIT_REQUIRED',
            'max_value_minor is required and must be an integer in the currency minor unit. A delegation without a value limit is not a limit.',
            422);
    }

    const where = { id };
    if (tenantId) where.tenant_id = tenantId;
    const existing = await db.AuthorityDelegation.findOne({ where });
    const values = {
        org_id: orgId, label, decision, status, scope,
        max_value_minor: Number(maxValueMinor), currency: String(currency).toUpperCase(),
        delegate, granted_by: grantedBy, effective_from: effectiveFrom, expires_at: expiresAt,
    };
    if (existing) {
        await existing.update(values);
        return plain(existing);
    }
    return plain(await db.AuthorityDelegation.create({ id, ...(tenantId ? { tenant_id: tenantId } : {}), ...values }));
}

/**
 * How much wall-clock the delegation policy is actually saving, and what is
 * still queued. A low automation rate with a long mean wait is the signal to
 * widen a limit; a high rate with no escalations may mean the limits are too wide.
 */
async function impact({ tenantId = null, since = null, limit = 5000, now = new Date() } = {}) {
    const where = {};
    if (tenantId) where.tenant_id = tenantId;
    if (since) where.created_at = { [db.Sequelize.Op.gte]: new Date(since) };

    const rows = (await db.AuthorityDecision.findAll({
        where, limit: Math.min(20000, Number(limit) || 5000), order: [['created_at', 'DESC']],
    })).map(plain);

    const evaluations = rows.map((r) => ({
        auto_approved: r.auto_approved,
        escalation_wait_hours: Number(r.escalation_wait_hours || 0),
    }));

    const pending = rows.filter((r) => r.outcome === 'needs_human' && !r.resolved_at);
    const nowMs = new Date(now).getTime();

    // Which limits are being hit most often — the actionable output, since each
    // is a candidate for widening.
    const blockingReasons = {};
    for (const r of rows.filter((x) => !x.auto_approved)) {
        for (const reason of (r.reasons || [])) {
            blockingReasons[reason] = (blockingReasons[reason] || 0) + 1;
        }
    }

    return {
        ...policy.coverageImpact(evaluations),
        pending_count: pending.length,
        oldest_pending_hours: pending.length
            ? Math.round(((nowMs - Math.min(...pending.map((p) => new Date(p.created_at).getTime()))) / 3600000) * 100) / 100
            : null,
        top_escalation_reasons: Object.entries(blockingReasons)
            .map(([reason, count]) => ({ reason, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
    };
}

/** Current coverage picture — who is on, and how long until someone is. */
async function coverage({ tenantId = null, role = 'broker', now = new Date() } = {}) {
    const rota = await loadRota({ tenantId });
    return { role, rota, ...policy.coverageAt(rota, { now, role }) };
}

module.exports = { loadDelegations, loadRota, decide, resolve, upsertDelegation, impact, coverage, STAGE_FOR_DECISION };

'use strict';
// Delegated authority — HTTP surface (Compression, Phase 7).
// The coverage endpoint is the one worth watching: it turns "waiting for
// someone's morning" from an invisible delay into a staffing number.
const engine = require('../service/authority/authorityEngine');
const policy = require('../service/authority/policy');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const db = require('../models');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}
function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}
function actorOf(req) {
    return (req.auth && (req.auth.userId || req.auth.email)) || 'system';
}
function scopeTenant(req) {
    return isAdmin(req) ? (req.query.tenant_id || null) : callerTenantId(req);
}

// ── GET /v1/authority/policy ─────────────────────────────────────────────────
// The delegable decision types and — more importantly — the ones that are not.
// Public, because a customer should be able to see what the platform will refuse
// to automate for them and why.
const getPolicy = (req, res) => sendSuccess(req, res, {
    policy_version: policy.POLICY_VERSION,
    decisions: policy.DECISION,
    outcomes: policy.OUTCOME,
    never_delegable: policy.NEVER_DELEGABLE,
    note: 'A delegation without a value limit is not a limit — max_value_minor is required and a missing one means zero, never unlimited.',
});

const listDelegations = async (req, res, next) => {
    try {
        const rows = await engine.loadDelegations({
            tenantId: scopeTenant(req), orgId: req.query.org_id, decision: req.query.decision,
        });
        return sendSuccess(req, res, { delegations: rows });
    } catch (err) {
        return next(err);
    }
};

const upsertDelegation = async (req, res, next) => {
    try {
        const b = req.body || {};
        if (!b.id) throw new AppError('VALIDATION_ERROR', 'id is required', 400);
        const row = await engine.upsertDelegation(b.id, {
            tenantId: scopeTenant(req),
            orgId: b.org_id,
            label: b.label,
            decision: b.decision,
            scope: b.scope || {},
            maxValueMinor: b.max_value_minor,
            currency: b.currency,
            delegate: b.delegate,
            grantedBy: actorOf(req),
            effectiveFrom: b.effective_from,
            expiresAt: b.expires_at,
            status: b.status,
        });
        return sendSuccess(req, res, row, 201);
    } catch (err) {
        return next(err);
    }
};

// ── POST /v1/authority/decide ────────────────────────────────────────────────
// Can this proceed without a person? If not, the response says who is needed and
// how long until they are on duty.
const decide = async (req, res, next) => {
    try {
        const b = req.body || {};
        if (!b.decision) throw new AppError('VALIDATION_ERROR', 'decision is required', 400);
        const result = await engine.decide({
            decision: b.decision,
            origin_country: b.origin_country,
            destination_country: b.destination_country,
            hs_codes: b.hs_codes || [],
            counterparty: b.counterparty,
            amount_minor: b.amount_minor,
            currency: b.currency,
            blockers: b.blockers || [],
        }, {
            tenantId: scopeTenant(req),
            orgId: b.org_id,
            consignmentId: b.consignment_id,
            role: b.role || 'broker',
            actor: actorOf(req),
            persist: b.persist !== false,
        });
        return sendSuccess(req, res, result);
    } catch (err) {
        return next(err);
    }
};

const resolveDecision = async (req, res, next) => {
    try {
        const row = await engine.resolve(req.params.id, {
            tenantId: scopeTenant(req), resolvedBy: actorOf(req),
        });
        return sendSuccess(req, res, row);
    } catch (err) {
        return next(err);
    }
};

// ── GET /v1/authority/queue ──────────────────────────────────────────────────
// What is sitting waiting for a person, oldest first.
const queue = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const where = { outcome: 'needs_human', resolved_at: null };
        const tenantId = scopeTenant(req);
        if (tenantId) where.tenant_id = tenantId;
        const p = Math.max(1, Number(page) || 1);
        const l = Math.min(100, Math.max(1, Number(limit) || 20));
        const { count, rows } = await db.AuthorityDecision.findAndCountAll({
            where, limit: l, offset: (p - 1) * l, order: [['created_at', 'ASC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: p, limit: l });
    } catch (err) {
        return next(err);
    }
};

const coverage = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await engine.coverage({
            tenantId: scopeTenant(req), role: req.query.role || 'broker',
        }));
    } catch (err) {
        return next(err);
    }
};

// ── GET /v1/authority/impact ─────────────────────────────────────────────────
// Automation rate, hours lost to escalation, and which limits are hit most —
// the last of which is the list of candidates for widening.
const impact = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await engine.impact({
            tenantId: scopeTenant(req), since: req.query.since,
        }));
    } catch (err) {
        return next(err);
    }
};

module.exports = { getPolicy, listDelegations, upsertDelegation, decide, resolveDecision, queue, coverage, impact };

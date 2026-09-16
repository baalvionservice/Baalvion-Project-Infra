'use strict';
// Clearance Stage Ledger — HTTP surface (Clearance Compression, Phase 0).
// Thin controller: tenant scoping (defence in depth over RLS) + PARTY scoping +
// delegation to the ledger engine. The model descriptor is public because it is
// the number we quote customers — it should be inspectable rather than living in
// a slide deck.
//
// Party scoping matters here as much as it does on the shipment dashboard: the
// ledger says who held a clearance up and for how long, which a buyer or seller
// should see on their OWN trade and nowhere else. Tenant id alone can't express
// that (both parties can share a tenant), so every subject-addressed route
// resolves the subject back to its trade operation and applies the shared
// buyer/seller policy from service/dashboard/rbac.js.
const ledger = require('../service/clearance/ledger');
const stages = require('../service/clearance/stages');
const partyIdentity = require('../service/dashboard/partyIdentity');
const clearanceAccess = require('../service/clearance/access');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

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
// Admins may read across tenants; everyone else is pinned to their own.
function scopeTenant(req) {
    return isAdmin(req) ? (req.query.tenant_id || null) : callerTenantId(req);
}

// Resolve the caller's ledger visibility and party identity, or short-circuit
// with 403. Same resolver the trade operations dashboard uses.
async function party(req, next) {
    const resolved = await partyIdentity.resolveParty(req);
    if (!resolved.access.allowed) {
        next(new AppError('FORBIDDEN', 'Not authorized for the clearance ledger', 403, { reason: resolved.access.reason }));
        return null;
    }
    return resolved;
}

// Guard a subject-addressed route. Returns false once `next` has been called.
// Out-of-scope reads 404 rather than 403 so the ledger does not confirm that a
// subject it won't show you exists at all.
async function inScope(req, next, subject) {
    const p = await party(req, next);
    if (!p) return false;
    if (await clearanceAccess.isSubjectInScope(subject, p.access, p.partyOrgIds)) return true;
    next(new AppError('NOT_FOUND', 'Clearance ledger subject not found', 404));
    return false;
}

function subjectFrom(req) {
    const { subject_type, subject_id } = req.params;
    if (!subject_id) throw new AppError('VALIDATION_ERROR', 'subject_id is required', 400);
    return { subjectType: subject_type, subjectId: subject_id };
}

// ── GET /v1/clearance_ledger/model ───────────────────────────────────────────
// The compression model itself: the stage DAG, the scenarios and what each one
// projects. Public — a customer should be able to audit the promise.
const getModel = (req, res) => sendSuccess(req, res, {
    engine_version: stages.ENGINE_VERSION,
    parties: stages.PARTY,
    tracks: stages.TRACK,
    stages: stages.STAGES,
    conditional_stages: stages.CONDITIONAL_KEYS,
    scenarios: stages.scenarioSummary(),
    note: 'Total elapsed is the critical path through the DAG, not the sum of stages. Transit time is excluded — this is the paperwork and approval clock.',
});

// ── GET /v1/clearance_ledger/:subject_type/:subject_id ────────────────────────
// Where this consignment's time actually went, against the model.
const getTimeline = async (req, res, next) => {
    try {
        const subject = subjectFrom(req);
        if (!await inScope(req, next, subject)) return undefined;
        const view = await ledger.timeline(subject, { tenantId: scopeTenant(req) });
        return sendSuccess(req, res, view);
    } catch (err) {
        return next(err);
    }
};

// ── POST /v1/clearance_ledger/:subject_type/:subject_id/plan ─────────────────
// Materialize the stage set with per-stage deadlines derived from the model.
const planStages = async (req, res, next) => {
    try {
        const subject = subjectFrom(req);
        if (!await inScope(req, next, subject)) return undefined;
        const { scenario = 'target', include = [], exclude = [], start_at } = req.body || {};
        const result = await ledger.plan(subject, {
            tenantId: scopeTenant(req),
            scenarioName: scenario,
            include,
            exclude,
            startAt: start_at ? new Date(start_at) : new Date(),
            metadata: { planned_by: actorOf(req) },
        });
        return sendSuccess(req, res, result, 201);
    } catch (err) {
        return next(err);
    }
};

// ── POST /v1/clearance_ledger/:subject_type/:subject_id/stages/:stage/:action ─
// open | block | unblock | close | skip. Every mutator is idempotent, so a
// retrying webhook cannot restart a clock or double-count blocked time.
const ACTIONS = new Set(['open', 'block', 'unblock', 'close', 'skip']);
const transition = async (req, res, next) => {
    try {
        const { stage, action } = req.params;
        if (!ACTIONS.has(action)) {
            throw new AppError('VALIDATION_ERROR', `Unknown ledger action: ${action}`, 400, { known: [...ACTIONS] });
        }
        const subject = subjectFrom(req);
        if (!await inScope(req, next, subject)) return undefined;
        const { waiting_on, reason } = req.body || {};
        const row = await ledger[action](subject, stage, {
            tenantId: scopeTenant(req),
            actor: actorOf(req),
            waitingOn: waiting_on,
            reason,
        });
        return sendSuccess(req, res, row);
    } catch (err) {
        return next(err);
    }
};

// ── GET /v1/clearance_ledger/bottlenecks ─────────────────────────────────────
// The portfolio view that decides what gets built next. Measured, not assumed.
const getBottlenecks = async (req, res, next) => {
    try {
        const p = await party(req, next);
        if (!p) return undefined;
        const acc = p.access;
        const { since, limit } = req.query;
        // A buyer/seller gets the same analysis over THEIR OWN trades only. null
        // means no subject filter (tenant-wide roles); [] means party to nothing,
        // which the engine renders as an empty rollup rather than the whole book.
        const subjectIds = await clearanceAccess.partySubjectIds(acc, p.partyOrgIds);
        const view = await ledger.bottlenecks({ tenantId: scopeTenant(req), since, limit, subjectIds });
        return sendSuccess(req, res, { ...view, scope: acc.scope });
    } catch (err) {
        return next(err);
    }
};

module.exports = { getModel, getTimeline, planStages, transition, getBottlenecks };

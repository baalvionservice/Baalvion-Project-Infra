'use strict';
// Pre-arrival filing — HTTP surface (Compression, Phase 4).
// The exposure endpoint is the one an operations desk lives on: it answers what
// is about to be missed and what already has been, and it keeps those two apart
// because a missed lading-anchored deadline is a penalty, not a task.
const engine = require('../service/clearance/preArrivalEngine');
const preArrival = require('../service/clearance/preArrival');
const consignmentEngine = require('../service/consignment/consignmentEngine');
const { sendSuccess } = require('../utils/response');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}
function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}
function scopeTenant(req) {
    return isAdmin(req) ? (req.query.tenant_id || null) : callerTenantId(req);
}

// ── GET /v1/prearrival/regimes ───────────────────────────────────────────────
// The published regime table. Public: which deadline runs from lading rather
// than arrival is exactly the thing shippers get wrong and get fined for.
const getRegimes = (req, res) => sendSuccess(req, res, {
    regime_version: preArrival.REGIME_VERSION,
    anchors: preArrival.ANCHOR,
    statuses: preArrival.STATUS,
    regimes: preArrival.REGIMES,
    eu_member_states: preArrival.EU,
    note: 'A lading-anchored filing (US ISF, EU ENS) is due before the cargo leaves origin. Scheduling it off ETA misses it, and the penalty is liquidated damages rather than a delay.',
});

// ── POST /v1/prearrival/plan ─────────────────────────────────────────────────
// Dry-run the schedule for a consignment without persisting anything.
const planFor = async (req, res, next) => {
    try {
        const { consignment_id } = req.body || {};
        const view = await consignmentEngine.get(consignment_id, { tenantId: scopeTenant(req) });
        return sendSuccess(req, res, preArrival.plan(view.consignment.canonical || {}));
    } catch (err) {
        return next(err);
    }
};

// ── POST /v1/prearrival/:consignment_id/schedule ─────────────────────────────
// Materialize (or refresh) the schedule. Safe to call repeatedly — windows are
// recomputed against the current ETA, because an ETA from three weeks ago does
// not define a real deadline.
const schedule = async (req, res, next) => {
    try {
        const result = await engine.schedule(req.params.consignment_id, { tenantId: scopeTenant(req) });
        return sendSuccess(req, res, result, 201);
    } catch (err) {
        return next(err);
    }
};

// ── GET /v1/prearrival/sweep ─────────────────────────────────────────────────
// The worker's work list: filings whose window is open AND which would pass the
// corridor gate. Held ones are returned alongside so nothing goes quiet.
const sweep = async (req, res, next) => {
    try {
        const { limit, check_gate } = req.query;
        const result = await engine.sweep({
            tenantId: scopeTenant(req),
            limit,
            checkGate: check_gate !== 'false',
        });
        return sendSuccess(req, res, result);
    } catch (err) {
        return next(err);
    }
};

// ── GET /v1/prearrival/exposure ──────────────────────────────────────────────
const exposure = async (req, res, next) => {
    try {
        const result = await engine.exposure({
            tenantId: scopeTenant(req),
            withinHours: Number(req.query.within_hours) || 48,
        });
        return sendSuccess(req, res, result);
    } catch (err) {
        return next(err);
    }
};

const markFiled = async (req, res, next) => {
    try {
        const row = await engine.markFiled(req.params.id, {
            submissionId: (req.body || {}).submission_id,
            tenantId: scopeTenant(req),
        });
        return sendSuccess(req, res, row);
    } catch (err) {
        return next(err);
    }
};

const markFailed = async (req, res, next) => {
    try {
        const row = await engine.markFailed(req.params.id, {
            error: (req.body || {}).error,
            tenantId: scopeTenant(req),
        });
        return sendSuccess(req, res, row);
    } catch (err) {
        return next(err);
    }
};

module.exports = { getRegimes, planFor, schedule, sweep, exposure, markFiled, markFailed };

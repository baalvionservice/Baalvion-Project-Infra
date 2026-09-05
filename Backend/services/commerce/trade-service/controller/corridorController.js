'use strict';
// Corridor gate — HTTP surface (Compression, Phase 2).
// The requirements and precheck endpoints are the ones a UI calls continuously
// while a user types, which is the whole point: requirements are shown and
// failures are caught at data-entry time rather than after a gateway round trip.
const engine = require('../service/corridor/corridorEngine');
const matrix = require('../service/corridor/matrix');
const precheckCore = require('../service/corridor/precheck');
const consignmentEngine = require('../service/consignment/consignmentEngine');
const cSchema = require('../service/consignment/schema');
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
function scopeTenant(req) {
    return isAdmin(req) ? (req.query.tenant_id || null) : callerTenantId(req);
}

/** Accept either a stored consignment id or an inline consignment body. */
async function resolveConsignment(req) {
    const body = req.body || {};
    if (body.consignment_id) {
        const view = await consignmentEngine.get(body.consignment_id, { tenantId: scopeTenant(req) });
        return { canonical: view.consignment.canonical, consignmentId: view.consignment.id, view };
    }
    if (!body.consignment) {
        throw new AppError('VALIDATION_ERROR', 'Provide either consignment_id or an inline consignment', 400);
    }
    return { canonical: cSchema.normalize(body.consignment), consignmentId: null, view: null };
}

// ── GET /v1/corridor/matrix ──────────────────────────────────────────────────
// The published requirement ruleset. Public: a shipper should be able to see
// exactly why a document is being demanded, and every rule states its reason.
const getMatrix = (req, res) => sendSuccess(req, res, {
    matrix_version: matrix.MATRIX_VERSION,
    precheck_version: precheckCore.PRECHECK_VERSION,
    severities: matrix.SEVERITY,
    eu_member_states: matrix.EU,
    hs_chapter_groups: matrix.CHAPTERS,
    identifier_formats: Object.fromEntries(
        Object.entries(matrix.IDENTIFIER_VALIDATORS).map(([k, v]) => [k, { label: v.label, hint: v.hint }]),
    ),
    rules: matrix.RULES,
    note: 'Required documents are resolved per corridor, commodity, incoterm, mode, value and party status — not from a fixed global list.',
});

// ── POST /v1/corridor/requirements ───────────────────────────────────────────
// "What does this shipment need?" — answered before any paperwork is started.
const getRequirements = async (req, res, next) => {
    try {
        const { canonical } = await resolveConsignment(req);
        const resolved = await engine.requirementsFor(canonical, {
            partyStatus: (req.body && req.body.party_status) || 'verified',
        });
        return sendSuccess(req, res, resolved);
    } catch (err) {
        return next(err);
    }
};

// ── POST /v1/corridor/precheck ───────────────────────────────────────────────
// The gate, non-throwing. Returns every finding with its fix so the caller can
// resolve them all in one pass rather than discovering them one bounce at a time.
const runPrecheck = async (req, res, next) => {
    try {
        const body = req.body || {};
        const { canonical, consignmentId } = await resolveConsignment(req);
        const result = await engine.evaluate(canonical, {
            tenantId: scopeTenant(req),
            consignmentId,
            shipmentId: body.shipment_id || null,
            partyStatus: body.party_status || 'verified',
            certificatesPresent: body.certificates_present || [],
            documentsPresent: body.documents_present || null,
            actor: actorOf(req),
            persist: body.persist !== false,
        });
        return sendSuccess(req, res, result);
    } catch (err) {
        return next(err);
    }
};

// ── POST /v1/corridor/prechecks/:id/reconcile ────────────────────────────────
// Record what the gateway actually did. This is what keeps the first-pass number
// honest — without it the predicted rate would never be contradicted.
const reconcile = async (req, res, next) => {
    try {
        const { outcome, reason, submission_id } = req.body || {};
        const row = await engine.reconcile(req.params.id, {
            outcome, reason, submissionId: submission_id, tenantId: scopeTenant(req),
        });
        return sendSuccess(req, res, row);
    } catch (err) {
        return next(err);
    }
};

// ── GET /v1/corridor/first_pass_rate ─────────────────────────────────────────
// The Phase 2 KPI, computed over reconciled filings only.
const getFirstPassRate = async (req, res, next) => {
    try {
        const { since, destination, limit } = req.query;
        const view = await engine.firstPassRate({ tenantId: scopeTenant(req), since, destination, limit });
        return sendSuccess(req, res, view);
    } catch (err) {
        return next(err);
    }
};

// ── POST /v1/corridor/validate_container ─────────────────────────────────────
// Standalone ISO 6346 check so a UI can validate a container number as it is
// typed rather than at submission.
const validateContainer = (req, res) => {
    const number = (req.body && req.body.container_number) || '';
    return sendSuccess(req, res, {
        container_number: String(number).toUpperCase(),
        valid: matrix.isValidContainerNumber(number),
        note: 'ISO 6346: four letters, six digits, then a check digit computed from the first ten characters.',
    });
};

module.exports = { getMatrix, getRequirements, runPrecheck, reconcile, getFirstPassRate, validateContainer };

'use strict';
// Canonical Consignment — HTTP surface (Compression, Phase 1).
// Thin controller: tenant scoping (defence in depth over RLS) + delegation. The
// derived documents are read-only by design — there is no endpoint to edit one,
// because the only supported way to change a document is to amend the consignment
// it projects from.
const engine = require('../service/consignment/consignmentEngine');
const derive = require('../service/consignment/derive');
const schema = require('../service/consignment/schema');
const { sendSuccess, sendPaginated } = require('../utils/response');
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

// ── GET /v1/consignments/schema ──────────────────────────────────────────────
// The canonical field model: incoterms, valuation bases, currency minor units and
// the derivable document set. Public so an integrator can build against it.
const getSchema = (req, res) => sendSuccess(req, res, {
    schema_version: schema.SCHEMA_VERSION,
    deriver_version: derive.DERIVER_VERSION,
    modes: schema.MODES,
    directions: schema.DIRECTIONS,
    incoterms: schema.INCOTERMS,
    fob_basis_countries: schema.FOB_BASIS_COUNTRIES,
    non_standard_minor_units: schema.MINOR_UNITS,
    derived_documents: derive.DOC_TYPES,
    note: 'Enter once. Every document below is a projection of this record — none of them is separately authored.',
});

// ── POST /v1/consignments/preview ────────────────────────────────────────────
// Normalize + derive WITHOUT persisting. Lets a client see the totals, the
// customs valuation and the full document set before committing anything.
const preview = (req, res, next) => {
    try {
        const derived = derive.deriveAll(req.body || {}, { generatedAt: new Date() });
        return sendSuccess(req, res, {
            consignment: derived.consignment,
            source_hash: derived.source_hash,
            documents: derived.documents,
            consistency: derive.crossCheck(derived),
        });
    } catch (err) {
        return next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const result = await engine.create(req.body || {}, { tenantId: scopeTenant(req), actor: actorOf(req) });
        return sendSuccess(req, res, result, 201);
    } catch (err) {
        return next(err);
    }
};

const list = async (req, res, next) => {
    try {
        const { status, destination, page = 1, limit = 20 } = req.query;
        const result = await engine.list({ tenantId: scopeTenant(req), status, destination, page, limit });
        return sendPaginated(req, res, result);
    } catch (err) {
        return next(err);
    }
};

const get = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await engine.get(req.params.id, { tenantId: scopeTenant(req) }));
    } catch (err) {
        return next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const result = await engine.update(req.params.id, req.body || {}, {
            tenantId: scopeTenant(req), actor: actorOf(req),
        });
        return sendSuccess(req, res, result);
    } catch (err) {
        return next(err);
    }
};

// ── POST /v1/consignments/:id/regenerate ─────────────────────────────────────
// Force a re-derivation. Normally unnecessary (an amendment regenerates), but it
// is the recovery path after a deriver version bump.
const regenerate = async (req, res, next) => {
    try {
        const { only } = req.body || {};
        await engine.regenerate(req.params.id, { tenantId: scopeTenant(req), only });
        return sendSuccess(req, res, await engine.get(req.params.id, { tenantId: scopeTenant(req) }));
    } catch (err) {
        return next(err);
    }
};

const lock = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await engine.lock(req.params.id, { tenantId: scopeTenant(req) }));
    } catch (err) {
        return next(err);
    }
};

// ── GET /v1/consignments/:id/documents/:doc_type ─────────────────────────────
const getDocument = async (req, res, next) => {
    try {
        const { doc_type } = req.params;
        if (!derive.DOC_TYPES.includes(doc_type)) {
            throw new AppError('VALIDATION_ERROR', `Unknown document type: ${doc_type}`, 400, { known: derive.DOC_TYPES });
        }
        const view = await engine.get(req.params.id, { tenantId: scopeTenant(req) });
        const doc = view.documents.find((d) => d.doc_type === doc_type);
        if (!doc) throw new AppError('NOT_FOUND', `Document ${doc_type} has not been generated`, 404);
        return sendSuccess(req, res, doc);
    } catch (err) {
        return next(err);
    }
};

// ── GET /v1/consignments/:id/declaration ─────────────────────────────────────
// The payload the customs gateway consumes, derived fresh from the canonical
// record so a filing can never carry a stale revision.
const getDeclaration = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await engine.declarationFor(req.params.id, { tenantId: scopeTenant(req) }));
    } catch (err) {
        return next(err);
    }
};

module.exports = { getSchema, preview, create, list, get, update, regenerate, lock, getDocument, getDeclaration };

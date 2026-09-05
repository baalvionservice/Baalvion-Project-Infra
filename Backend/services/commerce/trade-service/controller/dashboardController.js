'use strict';
/**
 * Trade Operations Dashboard — HTTP surface (War Room 4, Prompt 3).
 *
 * The shared operations dashboard for buyer / seller / admin / logistics / bank.
 * Thin controller: resolve RBAC + party scope, delegate to dashboardService,
 * shape the response. Tenant isolation is enforced by the model hooks + DB RLS;
 * party-level visibility is enforced here via the rbac scope.
 *
 * Endpoints (mounted at /v1/dashboard):
 *   GET  /shipments                 filtered + paginated shipment list
 *   GET  /shipments/:id             shipment detail (+ operation)
 *   GET  /shipments/:id/timeline    merged event / status / workflow timeline
 *   GET  /shipments/:id/readiness   computed readiness score
 *   GET  /shipments/:id/documents   shipment documents (visibility-filtered)
 *   GET  /shipments/:id/schedule    sailing, port calls, vessel position
 *   GET  /shipments/:id/clearance   clearance stage clock (paperwork time)
 *   POST /shipments/:id/comments    append a comment to the timeline
 */
const dashboardService = require('../service/dashboard/dashboardService');
const rbac = require('../service/dashboard/rbac');
const partyIdentity = require('../service/dashboard/partyIdentity');
const shipmentVoyage = require('../service/schedules/shipmentVoyage');
const ledger = require('../service/clearance/ledger');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}
function actorOf(req) {
    return (req.auth && (req.auth.userId || req.auth.email)) || 'system';
}
function isBypass(req) {
    return ((req.auth && req.auth.roles) || []).some((r) => rbac.ADMIN_ROLES.includes(r));
}

/**
 * Resolve the caller's access scope AND the org identities they can act as a
 * party for, from the verified gateway identity only (never a client-supplied
 * header — that would be spoofable). See service/dashboard/partyIdentity.js for
 * why the party id is the trade-domain org code rather than the gateway org id.
 *
 * Returns null once `next` has been called with a 403.
 */
async function party(req, next) {
    const resolved = await partyIdentity.resolveParty(req);
    if (!resolved.access.allowed) {
        next(new AppError('FORBIDDEN', 'Not authorized for the trade operations dashboard', 403, { reason: resolved.access.reason }));
        return null;
    }
    return resolved;
}

// ── GET /shipments — filtered + paginated list ───────────────────────────────
const listShipments = async (req, res, next) => {
    try {
        const p = await party(req, next);
        if (!p) return undefined;
        const acc = p.access;

        const { buyer = null, seller = null, status = null, date_from = null, date_to = null, page, limit } = req.query;
        const result = await dashboardService.listShipments({
            tenantId: callerTenantId(req),
            bypass: isBypass(req),
            access: acc,
            partyOrgIds: p.partyOrgIds,
            buyer,
            seller,
            status: status ? String(status).split(',') : null,
            dateFrom: date_from,
            dateTo: date_to,
            page,
            limit,
        });
        return sendPaginated(req, res, result);
    } catch (err) {
        return next(err);
    }
};

// ── GET /shipments/:id — detail ──────────────────────────────────────────────
const getShipment = async (req, res, next) => {
    try {
        const p = await party(req, next);
        if (!p) return undefined;
        const acc = p.access;
        const shipment = await dashboardService.getShipmentScoped(req.params.id, { access: acc, partyOrgIds: p.partyOrgIds });
        if (!shipment) return next(new AppError('NOT_FOUND', 'Shipment not found', 404));
        return sendSuccess(req, res, shipment.toJSON());
    } catch (err) {
        return next(err);
    }
};

// ── GET /shipments/:id/timeline ──────────────────────────────────────────────
const getTimeline = async (req, res, next) => {
    try {
        const p = await party(req, next);
        if (!p) return undefined;
        const acc = p.access;
        const shipment = await dashboardService.getShipmentScoped(req.params.id, { access: acc, partyOrgIds: p.partyOrgIds });
        if (!shipment) return next(new AppError('NOT_FOUND', 'Shipment not found', 404));
        const timeline = await dashboardService.getTimeline(shipment.id);
        return sendSuccess(req, res, timeline);
    } catch (err) {
        return next(err);
    }
};

// ── GET /shipments/:id/readiness ─────────────────────────────────────────────
const getReadiness = async (req, res, next) => {
    try {
        const p = await party(req, next);
        if (!p) return undefined;
        const acc = p.access;
        const shipment = await dashboardService.getShipmentScoped(req.params.id, { access: acc, partyOrgIds: p.partyOrgIds });
        if (!shipment) return next(new AppError('NOT_FOUND', 'Shipment not found', 404));
        const score = await dashboardService.computeReadiness(shipment);
        return sendSuccess(req, res, { shipment_id: shipment.id, ...score });
    } catch (err) {
        return next(err);
    }
};

// ── GET /shipments/:id/documents ─────────────────────────────────────────────
const getDocuments = async (req, res, next) => {
    try {
        const p = await party(req, next);
        if (!p) return undefined;
        const acc = p.access;
        const shipment = await dashboardService.getShipmentScoped(req.params.id, { access: acc, partyOrgIds: p.partyOrgIds });
        if (!shipment) return next(new AppError('NOT_FOUND', 'Shipment not found', 404));
        const documents = await dashboardService.getDocuments(shipment.id, acc, rbac.canSeeDocument);
        return sendSuccess(req, res, { shipment_id: shipment.id, count: documents.length, documents });
    } catch (err) {
        return next(err);
    }
};

// ── GET /shipments/:id/schedule ──────────────────────────────────────────────
// "Which ship, which ports, when." The same sailing view the operator schedule
// route serves, behind the party scope — so a buyer reads their own cargo's
// rotation without being handed the tenant's whole book.
const getSchedule = async (req, res, next) => {
    try {
        const p = await party(req, next);
        if (!p) return undefined;
        const acc = p.access;
        const shipment = await dashboardService.getShipmentScoped(req.params.id, { access: acc, partyOrgIds: p.partyOrgIds });
        if (!shipment) return next(new AppError('NOT_FOUND', 'Shipment not found', 404));
        return sendSuccess(req, res, await shipmentVoyage.scheduleForShipment(shipment));
    } catch (err) {
        return next(err);
    }
};

// ── GET /shipments/:id/clearance ─────────────────────────────────────────────
// Where the paperwork time went on this shipment: per-stage elapsed vs blocked,
// who was being waited on, and what got reworked. Party-scoped for the same
// reason the timeline is — it names the party that held things up.
const getClearance = async (req, res, next) => {
    try {
        const p = await party(req, next);
        if (!p) return undefined;
        const acc = p.access;
        const shipment = await dashboardService.getShipmentScoped(req.params.id, { access: acc, partyOrgIds: p.partyOrgIds });
        if (!shipment) return next(new AppError('NOT_FOUND', 'Shipment not found', 404));
        const view = await ledger.timeline(
            { subjectType: 'shipment', subjectId: shipment.id },
            { tenantId: isBypass(req) ? null : callerTenantId(req) },
        );
        return sendSuccess(req, res, view);
    } catch (err) {
        return next(err);
    }
};

// ── POST /shipments/:id/comments — append a comment to the timeline ──────────
const addComment = async (req, res, next) => {
    try {
        const p = await party(req, next);
        if (!p) return undefined;
        const acc = p.access;
        if (!acc.canComment) return next(new AppError('FORBIDDEN', 'Your role may not comment on shipments', 403));

        const message = (req.body && (req.body.message || req.body.comment || req.body.text) || '').toString().trim();
        if (!message) return next(new AppError('MESSAGE_REQUIRED', 'A non-empty `message` is required', 422));
        if (message.length > 4000) return next(new AppError('MESSAGE_TOO_LONG', 'Comment exceeds 4000 characters', 422));

        const shipment = await dashboardService.getShipmentScoped(req.params.id, { access: acc, partyOrgIds: p.partyOrgIds });
        if (!shipment) return next(new AppError('NOT_FOUND', 'Shipment not found', 404));

        const event = await dashboardService.addComment(shipment, {
            message,
            actor: actorOf(req),
            visibility: (req.body && req.body.visibility) || 'all',
            replyTo: (req.body && req.body.reply_to) || null,
        });
        return sendSuccess(req, res, {
            id: event.id,
            shipment_id: shipment.id,
            kind: 'comment',
            message,
            author: actorOf(req),
            at: event.occurred_at,
        }, 201);
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    listShipments,
    getShipment,
    getTimeline,
    getReadiness,
    getDocuments,
    getSchedule,
    getClearance,
    addComment,
};

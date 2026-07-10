'use strict';
/**
 * Logistics Core Foundation (Phase 3) — shipment incidents.
 * open -> investigating -> resolved -> closed (linear; no skipping investigating).
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { createIncidentSchema } = require('../validators/incident.schema');
const { auditLogistics } = require('../utils/logisticsAudit');

const VALID = {
    open: ['investigating'],
    investigating: ['resolved'],
    resolved: ['closed'],
    closed: [],
};

function assertTransition(incident, to) {
    const allowed = VALID[incident.status] || [];
    if (!allowed.includes(to)) {
        throw new AppError('INVALID_TRANSITION', `cannot ${to} an incident in '${incident.status}' state`, 409);
    }
}

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

async function fetchIncidentOwned(id, req, next) {
    const row = await db.Incident.findByPk(id);
    if (!row) { next(new AppError('NOT_FOUND', 'Incident not found', 404)); return null; }
    if (isAdmin(req)) return row;
    const tenantId = callerTenantId(req);
    if (tenantId && row.tenant_id && row.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Incident not found', 404)); return null;
    }
    return row;
}

function toApi(r) {
    return {
        id: r.id, shipmentId: r.shipment_id, containerId: r.container_id,
        incidentType: r.incident_type, severity: r.severity, status: r.status,
        description: r.description, reportedBy: r.reported_by, reportedAt: r.reported_at,
        resolvedAt: r.resolved_at, resolutionNotes: r.resolution_notes,
        metadata: r.metadata, createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'reported_at', 'severity', 'status'] });
        const where = {};
        if (req.query.shipmentId) where.shipment_id = req.query.shipmentId;
        if (req.query.incidentType) where.incident_type = req.query.incidentType;
        if (req.query.severity) where.severity = req.query.severity;
        if (req.query.status) where.status = req.query.status;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.Incident.findAndCountAll({ where, limit, offset, order });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await fetchIncidentOwned(req.params.id, req, next);
        if (!row) return undefined;
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const parsed = createIncidentSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const { shipmentId, containerId, incidentType, severity, description, metadata } = parsed.data;
        const tenantId = callerTenantId(req);
        const row = await db.Incident.create({
            shipment_id: shipmentId,
            container_id: containerId,
            incident_type: incidentType,
            severity,
            description,
            status: 'open',
            reported_by: req.auth && req.auth.userId,
            reported_at: new Date(),
            metadata: metadata ?? {},
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        await auditLogistics(req, 'incident.created', 'incident', row.id, { shipmentId, incidentType, severity });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const investigate = async (req, res, next) => {
    try {
        const row = await fetchIncidentOwned(req.params.id, req, next);
        if (!row) return undefined;
        assertTransition(row, 'investigating');
        await row.update({ status: 'investigating' });
        await auditLogistics(req, 'incident.investigating', 'incident', row.id);
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const resolve = async (req, res, next) => {
    try {
        const row = await fetchIncidentOwned(req.params.id, req, next);
        if (!row) return undefined;
        assertTransition(row, 'resolved');
        const notes = req.body && req.body.resolutionNotes;
        await row.update({ status: 'resolved', resolved_at: new Date(), resolution_notes: notes });
        await auditLogistics(req, 'incident.resolved', 'incident', row.id);
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const close = async (req, res, next) => {
    try {
        const row = await fetchIncidentOwned(req.params.id, req, next);
        if (!row) return undefined;
        assertTransition(row, 'closed');
        await row.update({ status: 'closed' });
        await auditLogistics(req, 'incident.closed', 'incident', row.id);
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, investigate, resolve, close };

'use strict';
/**
 * Logistics Core Foundation (Phase 2) — fleet assignments: links a vehicle +
 * driver to a shipment for a delivery run ("Assign Driver" / dispatch-manager
 * action). Lifecycle: assigned -> in_progress -> completed (or -> cancelled
 * from either open state), matching billOfLadingController.js's VALID-map
 * pattern for typed lifecycle transitions.
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { createFleetAssignmentSchema } = require('../validators/fleetAssignment.schema');
const { auditLogistics } = require('../utils/logisticsAudit');
const { emitLogisticsEvent } = require('../service/events/logisticsEvents');

const VALID = {
    assigned: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};

function assertTransition(a, to) {
    const allowed = VALID[a.status] || [];
    if (!allowed.includes(to)) {
        throw new AppError('INVALID_TRANSITION', `cannot ${to} a fleet assignment in '${a.status}' state`, 409);
    }
}

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

async function fetchAssignmentOwned(id, req, next) {
    const row = await db.FleetAssignment.findByPk(id);
    if (!row) { next(new AppError('NOT_FOUND', 'Fleet assignment not found', 404)); return null; }
    if (isAdmin(req)) return row;
    const tenantId = callerTenantId(req);
    if (tenantId && row.tenant_id && row.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Fleet assignment not found', 404)); return null;
    }
    return row;
}

function toApi(r) {
    return {
        id: r.id, vehicleId: r.vehicle_id, driverId: r.driver_id, shipmentId: r.shipment_id,
        status: r.status, assignedAt: r.assigned_at, startedAt: r.started_at, completedAt: r.completed_at,
        notes: r.notes, metadata: r.metadata, createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'assigned_at', 'status'] });
        const where = {};
        if (req.query.vehicleId) where.vehicle_id = req.query.vehicleId;
        if (req.query.driverId) where.driver_id = req.query.driverId;
        if (req.query.shipmentId) where.shipment_id = req.query.shipmentId;
        if (req.query.status) where.status = req.query.status;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.FleetAssignment.findAndCountAll({ where, limit, offset, order });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await fetchAssignmentOwned(req.params.id, req, next);
        if (!row) return undefined;
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const parsed = createFleetAssignmentSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const { vehicleId, driverId, shipmentId, notes, metadata } = parsed.data;
        const [vehicle, driver] = await Promise.all([db.Vehicle.findByPk(vehicleId), db.Driver.findByPk(driverId)]);
        if (!vehicle) return next(new AppError('NOT_FOUND', 'Vehicle not found', 404));
        if (!driver) return next(new AppError('NOT_FOUND', 'Driver not found', 404));
        const tenantId = callerTenantId(req);
        const row = await db.FleetAssignment.create({
            vehicle_id: vehicleId,
            driver_id: driverId,
            shipment_id: shipmentId,
            status: 'assigned',
            assigned_at: new Date(),
            notes,
            metadata: metadata ?? {},
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        await auditLogistics(req, 'fleet_assignment.created', 'fleet_assignment', row.id, { vehicleId, driverId, shipmentId });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

// assigned -> in_progress (vehicle/driver become unavailable for other assignments).
const start = async (req, res, next) => {
    try {
        const a = await fetchAssignmentOwned(req.params.id, req, next);
        if (!a) return undefined;
        assertTransition(a, 'in_progress');
        await a.update({ status: 'in_progress', started_at: new Date() });
        await Promise.all([
            db.Vehicle.update({ status: 'in_use' }, { where: { id: a.vehicle_id } }),
            db.Driver.update({ status: 'on_trip' }, { where: { id: a.driver_id } }),
        ]);
        await auditLogistics(req, 'fleet_assignment.started', 'fleet_assignment', a.id);
        await emitLogisticsEvent('logisticsFleetAssignmentStarted', {
            assignmentId: a.id, vehicleId: a.vehicle_id, driverId: a.driver_id,
            shipmentId: a.shipment_id, tenantId: a.tenant_id,
        });
        return sendSuccess(req, res, toApi(a));
    } catch (err) { return next(err); }
};

// in_progress -> completed (vehicle/driver become available again).
const complete = async (req, res, next) => {
    try {
        const a = await fetchAssignmentOwned(req.params.id, req, next);
        if (!a) return undefined;
        assertTransition(a, 'completed');
        await a.update({ status: 'completed', completed_at: new Date() });
        await Promise.all([
            db.Vehicle.update({ status: 'available' }, { where: { id: a.vehicle_id } }),
            db.Driver.update({ status: 'available' }, { where: { id: a.driver_id } }),
        ]);
        await emitLogisticsEvent('logisticsFleetAssignmentCompleted', {
            assignmentId: a.id, vehicleId: a.vehicle_id, driverId: a.driver_id,
            shipmentId: a.shipment_id, tenantId: a.tenant_id,
        });
        await auditLogistics(req, 'fleet_assignment.completed', 'fleet_assignment', a.id);
        return sendSuccess(req, res, toApi(a));
    } catch (err) { return next(err); }
};

// assigned/in_progress -> cancelled (vehicle/driver freed back up if they were locked).
const cancel = async (req, res, next) => {
    try {
        const a = await fetchAssignmentOwned(req.params.id, req, next);
        if (!a) return undefined;
        assertTransition(a, 'cancelled');
        const wasInProgress = a.status === 'in_progress';
        await a.update({ status: 'cancelled', metadata: { ...(a.metadata || {}), cancelReason: (req.body && req.body.reason) || null } });
        if (wasInProgress) {
            await Promise.all([
                db.Vehicle.update({ status: 'available' }, { where: { id: a.vehicle_id } }),
                db.Driver.update({ status: 'available' }, { where: { id: a.driver_id } }),
            ]);
        }
        await auditLogistics(req, 'fleet_assignment.cancelled', 'fleet_assignment', a.id, { reason: (req.body && req.body.reason) || null });
        return sendSuccess(req, res, toApi(a));
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, start, complete, cancel };

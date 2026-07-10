'use strict';
// Shipment Tracking & Global Visibility Platform — planned/actual multi-leg journey.
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { auditLogistics } = require('../utils/logisticsAudit');

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

function toApi(r) {
    return {
        id: r.id, shipmentId: r.shipment_id, sequence: r.sequence, legMode: r.leg_mode,
        fromLocation: r.from_location, toLocation: r.to_location,
        plannedDeparture: r.planned_departure, plannedArrival: r.planned_arrival,
        actualDeparture: r.actual_departure, actualArrival: r.actual_arrival,
        distanceKm: r.distance_km != null ? Number(r.distance_km) : null,
        polyline: r.polyline, carrierLegId: r.carrier_leg_id, metadata: r.metadata,
    };
}

const listForShipment = async (req, res, next) => {
    try {
        const { limit, offset } = parseListQuery(req.query, { allowedSort: ['sequence'] });
        const { count, rows } = await db.ShipmentRoute.findAndCountAll({
            where: { shipment_id: req.params.shipmentId }, limit, offset, order: [['sequence', 'ASC']],
        });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const { shipmentId, sequence, legMode, fromLocation, toLocation, plannedDeparture, plannedArrival, distanceKm, polyline, carrierLegId } = req.body || {};
        if (!shipmentId) return next(new AppError('BAD_REQUEST', 'shipmentId is required', 400));
        if (!legMode) return next(new AppError('BAD_REQUEST', 'legMode is required', 400));
        const tenantId = callerTenantId(req);
        const row = await db.ShipmentRoute.create({
            shipment_id: shipmentId, sequence: sequence || 0, leg_mode: legMode,
            from_location: fromLocation, to_location: toLocation,
            planned_departure: plannedDeparture, planned_arrival: plannedArrival,
            distance_km: distanceKm, polyline, carrier_leg_id: carrierLegId,
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        await auditLogistics(req, 'shipment_route.created', 'shipment_route', row.id, { shipmentId, legMode });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const row = await db.ShipmentRoute.findByPk(req.params.id);
        if (!row) return next(new AppError('NOT_FOUND', 'Shipment route leg not found', 404));
        const { actualDeparture, actualArrival, distanceKm, polyline } = req.body || {};
        await row.update({
            ...(actualDeparture != null ? { actual_departure: actualDeparture } : {}),
            ...(actualArrival != null ? { actual_arrival: actualArrival } : {}),
            ...(distanceKm != null ? { distance_km: distanceKm } : {}),
            ...(polyline != null ? { polyline } : {}),
        });
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

module.exports = { listForShipment, create, update };

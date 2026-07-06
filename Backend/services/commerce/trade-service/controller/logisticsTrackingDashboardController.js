'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — the Global Shipment
 * Tracking Dashboard's aggregate surface: per-status counts, transit-time/
 * ETA-accuracy KPIs, carrier performance, a map-overview position feed, and
 * recent events/alerts. Read-only; all mutations happen through the
 * dedicated controllers (geofence/checkpoint/alert/iot/eta/delay/pod).
 */
const { Op } = require('sequelize');
const db = require('../models');

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}
function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}
function tenantWhere(req) {
    if (isAdmin(req)) return {};
    const tenantId = callerTenantId(req);
    return tenantId ? { tenant_id: tenantId } : {};
}

const STATUS_BUCKETS = {
    active: ['booked', 'picked_up', 'in_transit', 'port_processing', 'customs_clearance', 'released'],
    delivered: ['delivered'],
    delayed: ['delayed'],
    customsHold: ['customs_hold'],
    exception: ['exception'],
    cancelled: ['cancelled'],
    inTransit: ['in_transit'],
    waitingPickup: ['booked'],
    outForDelivery: ['out_for_delivery'],
    returned: ['re_routed'],
};

// GET /tracking_dashboard/summary — the KPI tiles.
const summary = async (req, res, next) => {
    try {
        const where = tenantWhere(req);
        const counts = {};
        await Promise.all(Object.entries(STATUS_BUCKETS).map(async ([key, statuses]) => {
            counts[key] = await db.TradeShipment.count({ where: { ...where, status: { [Op.in]: statuses } } });
        }));

        const delivered = await db.TradeShipment.findAll({
            where: { ...where, status: 'delivered', actual_departure: { [Op.ne]: null }, actual_arrival: { [Op.ne]: null } },
            attributes: ['actual_departure', 'actual_arrival'],
            limit: 500,
        });
        const transitDays = delivered
            .map((s) => (new Date(s.actual_arrival).getTime() - new Date(s.actual_departure).getTime()) / 86400000)
            .filter((d) => Number.isFinite(d) && d >= 0);
        const avgTransitDays = transitDays.length
            ? Math.round((transitDays.reduce((a, b) => a + b, 0) / transitDays.length) * 10) / 10
            : null;

        const withEta = await db.TradeShipment.findAll({
            where: { ...where, status: 'delivered', estimated_arrival: { [Op.ne]: null }, actual_arrival: { [Op.ne]: null } },
            attributes: ['estimated_arrival', 'actual_arrival'],
            limit: 500,
        });
        const withinWindow = withEta.filter((s) => Math.abs(new Date(s.actual_arrival) - new Date(s.estimated_arrival)) <= 86400000);
        const etaAccuracyPct = withEta.length ? Math.round((withinWindow.length / withEta.length) * 100) : null;

        const activeAlerts = await db.ShipmentAlert.count({ where: { status: 'active' } });
        const totalShipments = await db.TradeShipment.count({ where });
        const shipmentHealthPct = totalShipments
            ? Math.round(((totalShipments - counts.delayed - counts.exception - counts.customsHold) / totalShipments) * 100)
            : null;

        return res.json({
            success: true,
            data: { ...counts, avgTransitDays, etaAccuracyPct, shipmentHealthPct, activeAlerts, totalShipments },
        });
    } catch (err) { return next(err); }
};

// GET /tracking_dashboard/carrier_performance
const carrierPerformance = async (req, res, next) => {
    try {
        const rows = await db.CarrierPerformance.findAll({
            order: [['period_end', 'DESC']], limit: Number(req.query.limit) || 20,
            include: db.CarrierDirectory ? [{ model: db.CarrierDirectory, as: 'carrier', attributes: ['id', 'name'] }] : [],
        });
        return res.json({ success: true, data: rows });
    } catch (err) { return next(err); }
};

// GET /tracking_dashboard/map_overview — last known position per active shipment.
const mapOverview = async (req, res, next) => {
    try {
        const where = { ...tenantWhere(req), status: { [Op.in]: STATUS_BUCKETS.active } };
        const shipments = await db.TradeShipment.findAll({ where, limit: 500 });
        const points = await Promise.all(shipments.map(async (s) => {
            const lastPing = await db.TrackingEvent.findOne({ where: { shipment_id: s.id }, order: [['occurred_at', 'DESC']] });
            return {
                shipmentId: s.id, shipmentNo: s.shipment_no, status: s.status,
                latitude: lastPing && lastPing.latitude != null ? Number(lastPing.latitude) : null,
                longitude: lastPing && lastPing.longitude != null ? Number(lastPing.longitude) : null,
                locationLabel: (lastPing && lastPing.location_label) || (s.metadata && s.metadata.lastKnownLocation) || null,
                lastUpdated: lastPing ? lastPing.occurred_at : null,
            };
        }));
        return res.json({ success: true, data: points.filter((p) => p.latitude != null && p.longitude != null) });
    } catch (err) { return next(err); }
};

// GET /tracking_dashboard/recent_events
const recentEvents = async (req, res, next) => {
    try {
        const limit = Number(req.query.limit) || 20;
        const rows = await db.TrackingEvent.findAll({ order: [['occurred_at', 'DESC']], limit });
        return res.json({ success: true, data: rows });
    } catch (err) { return next(err); }
};

// GET /tracking_dashboard/alerts — active alerts feed for the dashboard widget.
const alerts = async (req, res, next) => {
    try {
        const limit = Number(req.query.limit) || 20;
        const rows = await db.ShipmentAlert.findAll({ where: { status: 'active' }, order: [['triggered_at', 'DESC']], limit });
        return res.json({ success: true, data: rows });
    } catch (err) { return next(err); }
};

module.exports = { summary, carrierPerformance, mapOverview, recentEvents, alerts };

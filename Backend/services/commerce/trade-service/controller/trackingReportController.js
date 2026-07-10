'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — tracking report export
 * (delay report, carrier report, geofence report, ETA report, ...). Supports
 * `?format=csv` (default `json`). See service/tracking-platform/reportExport.js
 * for why XLSX/PDF aren't wired here yet.
 */
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { toCsv } = require('../service/tracking-platform/reportExport');

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

function respond(req, res, filenameBase, rows) {
    if (req.query.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
        return res.send(toCsv(rows.map((r) => r.toJSON())));
    }
    return res.json({ success: true, data: rows });
}

const delayReport = async (req, res, next) => {
    try {
        const where = tenantWhere(req);
        if (req.query.from || req.query.to) {
            where.detected_at = {};
            if (req.query.from) where.detected_at[Op.gte] = new Date(req.query.from);
            if (req.query.to) where.detected_at[Op.lte] = new Date(req.query.to);
        }
        const rows = await db.DelayEvent.findAll({ where, order: [['detected_at', 'DESC']], limit: 5000 });
        return respond(req, res, 'delay-report', rows);
    } catch (err) { return next(err); }
};

const carrierReport = async (req, res, next) => {
    try {
        const rows = await db.CarrierPerformance.findAll({ order: [['period_end', 'DESC']], limit: 1000 });
        return respond(req, res, 'carrier-report', rows);
    } catch (err) { return next(err); }
};

const geofenceReport = async (req, res, next) => {
    try {
        const where = {};
        if (req.query.geofenceId) where.geofence_id = req.query.geofenceId;
        const rows = await db.GeofenceEvent.findAll({ where, order: [['occurred_at', 'DESC']], limit: 5000 });
        return respond(req, res, 'geofence-report', rows);
    } catch (err) { return next(err); }
};

const etaReport = async (req, res, next) => {
    try {
        const where = {};
        if (req.query.shipmentId) where.shipment_id = req.query.shipmentId;
        const rows = await db.EtaPrediction.findAll({ where, order: [['computed_at', 'DESC']], limit: 5000 });
        return respond(req, res, 'eta-report', rows);
    } catch (err) { return next(err); }
};

const trackingHistoryReport = async (req, res, next) => {
    try {
        if (!req.query.shipmentId) return next(new AppError('BAD_REQUEST', 'shipmentId is required', 400));
        const rows = await db.TrackingEvent.findAll({
            where: { shipment_id: req.query.shipmentId }, order: [['occurred_at', 'ASC']], limit: 5000,
        });
        return respond(req, res, 'tracking-history', rows);
    } catch (err) { return next(err); }
};

module.exports = { delayReport, carrierReport, geofenceReport, etaReport, trackingHistoryReport };

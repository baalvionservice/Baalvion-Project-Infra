'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — IoT device registry +
 * sensor-reading ingestion (delegates threshold/alert logic to
 * service/tracking-platform/iotIngestEngine.js).
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { auditLogistics } = require('../utils/logisticsAudit');
const iotIngestEngine = require('../service/tracking-platform/iotIngestEngine');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}
function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

function toApi(r) {
    return {
        id: r.id, shipmentId: r.shipment_id, containerId: r.container_id, deviceType: r.device_type,
        externalDeviceId: r.external_device_id, provider: r.provider, status: r.status,
        lastSeenAt: r.last_seen_at, batteryPct: r.battery_pct != null ? Number(r.battery_pct) : null,
        metadata: r.metadata, createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset } = parseListQuery(req.query, { allowedSort: ['created_at', 'last_seen_at'] });
        const where = {};
        if (req.query.shipmentId) where.shipment_id = req.query.shipmentId;
        if (req.query.deviceType) where.device_type = req.query.deviceType;
        if (req.query.status) where.status = req.query.status;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.IotDevice.findAndCountAll({ where, limit, offset, order: [['created_at', 'DESC']] });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await db.IotDevice.findByPk(req.params.id);
        if (!row) return next(new AppError('NOT_FOUND', 'IoT device not found', 404));
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const register = async (req, res, next) => {
    try {
        const { shipmentId, containerId, deviceType, externalDeviceId, provider, metadata } = req.body || {};
        if (!deviceType) return next(new AppError('BAD_REQUEST', 'deviceType is required', 400));
        const tenantId = callerTenantId(req);
        const row = await db.IotDevice.create({
            shipment_id: shipmentId, container_id: containerId, device_type: deviceType,
            external_device_id: externalDeviceId, provider, metadata: metadata || {},
            created_by: req.auth && req.auth.userId,
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        await auditLogistics(req, 'iot_device.registered', 'iot_device', row.id, { deviceType, shipmentId });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const row = await db.IotDevice.findByPk(req.params.id);
        if (!row) return next(new AppError('NOT_FOUND', 'IoT device not found', 404));
        const { status, metadata } = req.body || {};
        await row.update({
            ...(status != null ? { status } : {}),
            ...(metadata != null ? { metadata } : {}),
            updated_by: req.auth && req.auth.userId,
        });
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

// POST /iot_devices/:id/readings — ingest one sensor reading.
const ingestReading = async (req, res, next) => {
    try {
        const { metricType, value, unit, recordedAt, rawPayload } = req.body || {};
        if (!metricType) return next(new AppError('BAD_REQUEST', 'metricType is required', 400));
        const log = await iotIngestEngine.ingestReading({
            deviceId: req.params.id, metricType, value, unit, recordedAt, rawPayload,
        });
        return sendSuccess(req, res, {
            id: log.id, deviceId: log.device_id, metricType: log.metric_type,
            value: log.value != null ? Number(log.value) : null, unit: log.unit, recordedAt: log.recorded_at,
        }, 201);
    } catch (err) {
        if (err.message === 'IoT device not found') return next(new AppError('NOT_FOUND', err.message, 404));
        if (err.message === 'metricType is required') return next(new AppError('BAD_REQUEST', err.message, 400));
        return next(err);
    }
};

const listReadings = async (req, res, next) => {
    try {
        const { limit, offset } = parseListQuery(req.query, { allowedSort: ['recorded_at'] });
        const where = { device_id: req.params.id };
        if (req.query.metricType) where.metric_type = req.query.metricType;
        const { count, rows } = await db.IotSensorLog.findAndCountAll({ where, limit, offset, order: [['recorded_at', 'DESC']] });
        return sendPaginated(req, res, {
            items: rows.map((r) => ({
                id: r.id, metricType: r.metric_type, value: r.value != null ? Number(r.value) : null,
                unit: r.unit, recordedAt: r.recorded_at,
            })),
            total: count, page: Number(req.query.page) || 1, limit,
        });
    } catch (err) { return next(err); }
};

module.exports = { list, get, register, update, ingestReading, listReadings };

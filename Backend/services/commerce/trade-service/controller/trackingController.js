'use strict';
/**
 * Logistics Core Foundation (Phase 1) — GPS/carrier tracking events. Append-only
 * (no update/delete): TrackingEvent has no `paranoid`/`updatedAt`, matching
 * ShipmentEvent's high-volume audit-log shape.
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');

const TRACKING_SOURCES = ['carrier_webhook', 'gps_device', 'manual'];

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

function toApi(r) {
    return {
        id: r.id, shipmentId: r.shipment_id, containerId: r.container_id,
        source: r.source, eventType: r.event_type, description: r.description,
        latitude: r.latitude != null ? Number(r.latitude) : null,
        longitude: r.longitude != null ? Number(r.longitude) : null,
        locationLabel: r.location_label, occurredAt: r.occurred_at,
        rawPayload: r.raw_payload, createdAt: r.created_at,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset } = parseListQuery(req.query, { allowedSort: ['occurred_at'] });
        const where = {};
        if (req.query.shipmentId) where.shipment_id = req.query.shipmentId;
        if (req.query.containerId) where.container_id = req.query.containerId;
        if (req.query.source) where.source = req.query.source;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.TrackingEvent.findAndCountAll({
            where, limit, offset, order: [['occurred_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await db.TrackingEvent.findByPk(req.params.id);
        if (!row) return next(new AppError('NOT_FOUND', 'Tracking event not found', 404));
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId && row.tenant_id && row.tenant_id !== tenantId) {
                return next(new AppError('NOT_FOUND', 'Tracking event not found', 404));
            }
        }
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const b = req.body || {};
        if (!b.shipmentId && !b.shipment_id) return next(new AppError('BAD_REQUEST', 'shipmentId is required', 400));
        const source = b.source || 'manual';
        if (!TRACKING_SOURCES.includes(source)) {
            return next(new AppError('VALIDATION_ERROR', `source must be one of: ${TRACKING_SOURCES.join(', ')}`, 400));
        }
        if (!b.eventType && !b.event_type) return next(new AppError('BAD_REQUEST', 'eventType is required', 400));
        const tenantId = callerTenantId(req);
        const row = await db.TrackingEvent.create({
            shipment_id: b.shipmentId ?? b.shipment_id,
            container_id: b.containerId ?? b.container_id,
            source,
            event_type: b.eventType ?? b.event_type,
            description: b.description,
            latitude: b.latitude,
            longitude: b.longitude,
            location_label: b.locationLabel ?? b.location_label,
            occurred_at: b.occurredAt ?? b.occurred_at ?? new Date(),
            raw_payload: b.rawPayload ?? b.raw_payload ?? {},
            created_by: req.auth && req.auth.userId,
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        // Best-effort: keep the shipment's headline location current.
        if (row.latitude != null || row.longitude != null || row.location_label) {
            try {
                const shipment = await db.TradeShipment.findByPk(row.shipment_id);
                if (shipment) {
                    await shipment.update({
                        metadata: { ...(shipment.metadata || {}), lastKnownLocation: row.location_label || `${row.latitude},${row.longitude}`, lastTrackedAt: row.occurred_at },
                    });
                }
            } catch { /* non-fatal */ }
        }
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

module.exports = { list, get, create };

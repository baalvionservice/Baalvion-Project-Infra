'use strict';
/**
 * Logistics Core Foundation — GPS/carrier tracking events. Append-only
 * (no update/delete): TrackingEvent has no `paranoid`/`updatedAt`, matching
 * ShipmentEvent's high-volume audit-log shape. `create` (Phase 1) writes
 * synchronously; `ingest` (Phase 2) enqueues onto the `tracking_sync` BullMQ
 * queue for bulk/async ingestion — both funnel through the same
 * service/tracking/trackingEngine.js logic.
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { recordTrackingEvent } = require('../service/tracking/trackingEngine');
const { enqueue } = require('../queue');

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

// Synchronous single-event write — low-volume, needs an immediate confirmed
// response (e.g. a dispatcher manually logging a checkpoint).
const create = async (req, res, next) => {
    try {
        const b = req.body || {};
        const tenantId = callerTenantId(req);
        const row = await recordTrackingEvent({ ...b, tenantId, createdBy: req.auth && req.auth.userId });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) {
        if (err.message === 'shipmentId is required' || err.message === 'eventType is required') {
            return next(new AppError('BAD_REQUEST', err.message, 400));
        }
        if (err.message.startsWith('source must be one of')) {
            return next(new AppError('VALIDATION_ERROR', err.message, 400));
        }
        return next(err);
    }
};

// Async batch ingestion — enqueues each ping onto the `tracking_sync` BullMQ
// queue (queue/index.js + queue/workers.js) instead of writing N rows inline,
// so a bulk carrier-integration job (or a webhook receiver upstream of this
// service) isn't blocked on synchronous DB writes per ping.
const ingest = async (req, res, next) => {
    try {
        const events = Array.isArray(req.body) ? req.body : (req.body && req.body.events);
        if (!Array.isArray(events) || events.length === 0) {
            return next(new AppError('BAD_REQUEST', 'events must be a non-empty array', 400));
        }
        const tenantId = callerTenantId(req);
        const createdBy = req.auth && req.auth.userId;
        const jobs = await Promise.all(
            events.map((e) => enqueue('tracking_sync', 'record', { ...e, tenantId, createdBy })),
        );
        return sendSuccess(req, res, { queued: jobs.length }, 202);
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, ingest };

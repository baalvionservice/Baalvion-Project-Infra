'use strict';
/**
 * Logistics Core Foundation (Phase 1) — shipping containers. CRUD + soft
 * delete, tenant-scoped (belt-and-suspenders on top of the models/index.js
 * tenant hooks, matching billOfLadingController.js's fetch-owned pattern).
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { createContainerSchema, updateContainerSchema } = require('../validators/container.schema');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

async function fetchContainerOwned(id, req, next) {
    const row = await db.Container.findByPk(id);
    if (!row) { next(new AppError('NOT_FOUND', 'Container not found', 404)); return null; }
    if (isAdmin(req)) return row;
    const tenantId = callerTenantId(req);
    if (tenantId && row.tenant_id && row.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Container not found', 404)); return null;
    }
    return row;
}

function toApi(r) {
    return {
        id: r.id, shipmentId: r.shipment_id, containerNumber: r.container_number,
        isoCode: r.iso_code, containerType: r.container_type, sealNumber: r.seal_number,
        carrierId: r.carrier_id, owner: r.owner, status: r.status,
        currentLocation: r.current_location,
        capacityKg: r.capacity_kg != null ? Number(r.capacity_kg) : null,
        weightKg: r.weight_kg != null ? Number(r.weight_kg) : null,
        temperatureC: r.temperature_c != null ? Number(r.temperature_c) : null,
        metadata: r.metadata, createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

function fromApi(v) {
    return {
        shipment_id: v.shipmentId,
        container_number: v.containerNumber,
        iso_code: v.isoCode,
        container_type: v.containerType,
        seal_number: v.sealNumber,
        carrier_id: v.carrierId,
        owner: v.owner,
        status: v.status,
        current_location: v.currentLocation,
        capacity_kg: v.capacityKg,
        weight_kg: v.weightKg,
        temperature_c: v.temperatureC,
        metadata: v.metadata,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'container_number', 'status'] });
        const where = {};
        if (req.query.shipmentId) where.shipment_id = req.query.shipmentId;
        if (req.query.status) where.status = req.query.status;
        if (req.query.containerType) where.container_type = req.query.containerType;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.Container.findAndCountAll({ where, limit, offset, order });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await fetchContainerOwned(req.params.id, req, next);
        if (!row) return undefined;
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const parsed = createContainerSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const tenantId = callerTenantId(req);
        const row = await db.Container.create({
            ...fromApi(parsed.data),
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const row = await fetchContainerOwned(req.params.id, req, next);
        if (!row) return undefined;
        const parsed = updateContainerSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const updates = fromApi(parsed.data);
        Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
        await row.update(updates);
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
    try {
        const row = await fetchContainerOwned(req.params.id, req, next);
        if (!row) return undefined;
        await row.destroy(); // paranoid: soft delete
        return sendSuccess(req, res, { id: row.id, deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, update, remove };

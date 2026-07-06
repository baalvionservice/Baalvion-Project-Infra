'use strict';
/**
 * Freight Management — Carrier Directory (Phase 3, Prompt 2). CRUD + soft delete
 * for the DYNAMIC carrier registry (tradeops.carriers, migration 047), following the
 * same pattern as containerController.js. Global reference data (no tenant scoping —
 * every tenant reads the same carrier catalog); writes are gated by
 * FREIGHT_CARRIER_MANAGE at the route layer, not by tenant ownership.
 *
 * Distinct from:
 *   - GET /v1/carriers            — legacy read-only shim (trade.carriers)
 *   - GET /v1/freight/carriers    — marketplace descriptor (the 4 coded connectors)
 * This is the admin-manageable directory "any carrier" onboards into.
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const {
    createCarrierSchema, updateCarrierSchema, createCarrierServiceSchema, createCarrierRegionSchema,
} = require('../validators/carrier.schema');
const { auditLogistics } = require('../utils/logisticsAudit');

function actorOf(req) {
    return (req.auth && (req.auth.userId || req.auth.email)) || 'system';
}

async function fetchCarrier(id, next) {
    const row = await db.CarrierDirectory.findByPk(id, {
        include: [{ model: db.CarrierService, as: 'carrierServices' }, { model: db.CarrierRegion, as: 'carrierRegions' }],
    });
    if (!row) { next(new AppError('NOT_FOUND', 'Carrier not found', 404)); return null; }
    return row;
}

function toApi(r) {
    const services = (r.carrierServices || []).map((s) => ({
        id: s.id, serviceType: s.service_type, transportMode: s.transport_mode,
        transitTimeDays: s.transit_time_days,
        baseFee: s.base_fee != null ? Number(s.base_fee) : null,
        ratePerKg: s.rate_per_kg != null ? Number(s.rate_per_kg) : null,
        active: s.active,
    }));
    const regions = (r.carrierRegions || []).map((g) => ({
        id: g.id, regionType: g.region_type, originCode: g.origin_code, destinationCode: g.destination_code, active: g.active,
    }));
    return {
        id: r.id, code: r.code, name: r.name, logoUrl: r.logo_url, country: r.country,
        connectorKey: r.connector_key, credentialEnvPrefix: r.credential_env_prefix,
        services, coverage: r.coverage, fleet: r.fleet, modes: r.modes,
        rating: r.rating != null ? Number(r.rating) : null,
        reliabilityScore: r.reliability_score,
        insurance: r.insurance, certifications: r.certifications,
        trackingApiSupported: r.tracking_api_supported, bookingApiSupported: r.booking_api_supported,
        pricingApiSupported: r.pricing_api_supported, availabilityStatus: r.availability_status,
        operatingRegions: r.operating_regions, supportContact: r.support_contact, documents: r.documents,
        status: r.status, performanceScore: r.performance_score != null ? Number(r.performance_score) : null,
        carrierServices: services, carrierRegions: regions,
        createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

function fromApi(v) {
    const out = {
        code: v.code, name: v.name, logo_url: v.logoUrl, country: v.country,
        connector_key: v.connectorKey, credential_env_prefix: v.credentialEnvPrefix,
        coverage: v.coverage, fleet: v.fleet, modes: v.modes, rating: v.rating,
        reliability_score: v.reliabilityScore, insurance: v.insurance, certifications: v.certifications,
        tracking_api_supported: v.trackingApiSupported, booking_api_supported: v.bookingApiSupported,
        pricing_api_supported: v.pricingApiSupported, availability_status: v.availabilityStatus,
        operating_regions: v.operatingRegions, support_contact: v.supportContact, documents: v.documents,
        status: v.status,
    };
    Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
    return out;
}

const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'name', 'rating', 'performance_score'] });
        const where = {};
        if (req.query.status) where.status = req.query.status;
        if (req.query.availabilityStatus) where.availability_status = req.query.availabilityStatus;
        if (req.query.country) where.country = req.query.country;
        const { count, rows } = await db.CarrierDirectory.findAndCountAll({
            where, limit, offset, order,
            include: [{ model: db.CarrierService, as: 'carrierServices' }, { model: db.CarrierRegion, as: 'carrierRegions' }],
            distinct: true,
        });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await fetchCarrier(req.params.id, next);
        if (!row) return undefined;
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const parsed = createCarrierSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const row = await db.CarrierDirectory.create({ ...fromApi(parsed.data), created_by: actorOf(req) });
        await auditLogistics(req, 'freight_carrier.created', 'carrier', row.id, { code: row.code });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) {
        if (err && err.name === 'SequelizeUniqueConstraintError') {
            return next(new AppError('CONFLICT', `Carrier code '${req.body && req.body.code}' already exists`, 409));
        }
        return next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const row = await fetchCarrier(req.params.id, next);
        if (!row) return undefined;
        const parsed = updateCarrierSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const updates = fromApi(parsed.data);
        await row.update({ ...updates, updated_by: actorOf(req) });
        await auditLogistics(req, 'freight_carrier.updated', 'carrier', row.id, { fields: Object.keys(updates) });
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
    try {
        const row = await fetchCarrier(req.params.id, next);
        if (!row) return undefined;
        await row.update({ deleted_by: actorOf(req) });
        await row.destroy(); // paranoid: soft delete
        await auditLogistics(req, 'freight_carrier.deleted', 'carrier', row.id);
        return sendSuccess(req, res, { id: row.id, deleted: true });
    } catch (err) { return next(err); }
};

// ── Nested: carrier_services ──────────────────────────────────────────────────

const addService = async (req, res, next) => {
    try {
        const row = await fetchCarrier(req.params.id, next);
        if (!row) return undefined;
        const parsed = createCarrierServiceSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const svc = await db.CarrierService.create({
            carrier_id: row.id,
            service_type: parsed.data.serviceType,
            transport_mode: parsed.data.transportMode,
            transit_time_days: parsed.data.transitTimeDays,
            base_fee: parsed.data.baseFee,
            rate_per_kg: parsed.data.ratePerKg,
            active: parsed.data.active,
        });
        await auditLogistics(req, 'freight_carrier.service_added', 'carrier', row.id, { serviceId: svc.id });
        return sendSuccess(req, res, {
            id: svc.id, serviceType: svc.service_type, transportMode: svc.transport_mode,
            transitTimeDays: svc.transit_time_days,
            baseFee: svc.base_fee != null ? Number(svc.base_fee) : null,
            ratePerKg: svc.rate_per_kg != null ? Number(svc.rate_per_kg) : null,
            active: svc.active,
        }, 201);
    } catch (err) { return next(err); }
};

const removeService = async (req, res, next) => {
    try {
        const svc = await db.CarrierService.findOne({ where: { id: req.params.serviceId, carrier_id: req.params.id } });
        if (!svc) return next(new AppError('NOT_FOUND', 'Carrier service not found', 404));
        await svc.destroy();
        await auditLogistics(req, 'freight_carrier.service_removed', 'carrier', req.params.id, { serviceId: req.params.serviceId });
        return sendSuccess(req, res, { id: req.params.serviceId, deleted: true });
    } catch (err) { return next(err); }
};

// ── Nested: carrier_regions ───────────────────────────────────────────────────

const addRegion = async (req, res, next) => {
    try {
        const row = await fetchCarrier(req.params.id, next);
        if (!row) return undefined;
        const parsed = createCarrierRegionSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const reg = await db.CarrierRegion.create({
            carrier_id: row.id,
            region_type: parsed.data.regionType,
            origin_code: parsed.data.originCode,
            destination_code: parsed.data.destinationCode,
            active: parsed.data.active,
        });
        await auditLogistics(req, 'freight_carrier.region_added', 'carrier', row.id, { regionId: reg.id });
        return sendSuccess(req, res, {
            id: reg.id, regionType: reg.region_type, originCode: reg.origin_code, destinationCode: reg.destination_code, active: reg.active,
        }, 201);
    } catch (err) { return next(err); }
};

const removeRegion = async (req, res, next) => {
    try {
        const reg = await db.CarrierRegion.findOne({ where: { id: req.params.regionId, carrier_id: req.params.id } });
        if (!reg) return next(new AppError('NOT_FOUND', 'Carrier region not found', 404));
        await reg.destroy();
        await auditLogistics(req, 'freight_carrier.region_removed', 'carrier', req.params.id, { regionId: req.params.regionId });
        return sendSuccess(req, res, { id: req.params.regionId, deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, update, remove, addService, removeService, addRegion, removeRegion };

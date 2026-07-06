'use strict';
/** Logistics Core Foundation (Phase 1) — logistics address book. Same shape as containerController.js. */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { createAddressSchema, updateAddressSchema } = require('../validators/address.schema');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

async function fetchAddressOwned(id, req, next) {
    const row = await db.LogisticsAddress.findByPk(id);
    if (!row) { next(new AppError('NOT_FOUND', 'Address not found', 404)); return null; }
    if (isAdmin(req)) return row;
    const tenantId = callerTenantId(req);
    if (tenantId && row.tenant_id && row.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Address not found', 404)); return null;
    }
    return row;
}

function toApi(r) {
    return {
        id: r.id, addressType: r.address_type, companyName: r.company_name,
        contactName: r.contact_name, contactPhone: r.contact_phone,
        line1: r.line1, line2: r.line2, city: r.city, stateProvince: r.state_province,
        postalCode: r.postal_code, countryCode: r.country_code,
        latitude: r.latitude != null ? Number(r.latitude) : null,
        longitude: r.longitude != null ? Number(r.longitude) : null,
        timezone: r.timezone, validatedAt: r.validated_at, validationSource: r.validation_source,
        metadata: r.metadata, createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

function fromApi(v) {
    return {
        address_type: v.addressType,
        company_name: v.companyName,
        contact_name: v.contactName,
        contact_phone: v.contactPhone,
        line1: v.line1,
        line2: v.line2,
        city: v.city,
        state_province: v.stateProvince,
        postal_code: v.postalCode,
        country_code: v.countryCode ? v.countryCode.toUpperCase() : v.countryCode,
        latitude: v.latitude,
        longitude: v.longitude,
        timezone: v.timezone,
        metadata: v.metadata,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'city', 'address_type'] });
        const where = {};
        if (req.query.addressType) where.address_type = req.query.addressType;
        if (req.query.countryCode) where.country_code = String(req.query.countryCode).toUpperCase();
        if (req.query.city) where.city = req.query.city;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.LogisticsAddress.findAndCountAll({ where, limit, offset, order });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await fetchAddressOwned(req.params.id, req, next);
        if (!row) return undefined;
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const parsed = createAddressSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const tenantId = callerTenantId(req);
        const row = await db.LogisticsAddress.create({
            ...fromApi(parsed.data),
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const row = await fetchAddressOwned(req.params.id, req, next);
        if (!row) return undefined;
        const parsed = updateAddressSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const updates = fromApi(parsed.data);
        Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
        await row.update(updates);
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
    try {
        const row = await fetchAddressOwned(req.params.id, req, next);
        if (!row) return undefined;
        await row.destroy();
        return sendSuccess(req, res, { id: row.id, deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, update, remove };

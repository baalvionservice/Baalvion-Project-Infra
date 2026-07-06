'use strict';
/**
 * Freight Management — Rate Engine (Phase 3, Prompt 2). CRUD for persisted,
 * admin-editable pricing rules (tradeops.freight_rate_rules, migration 048) + a
 * stateless rate-preview endpoint over service/freight/rateEngine.js. Tenant-scoped
 * (RLS + models/index.js tenant hooks) — a tenant's negotiated contract/discount
 * rates are private, mirroring freightMarketplaceController.js's ownership pattern.
 */
const db = require('../models');
const rateEngine = require('../service/freight/rateEngine');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { createFreightRateRuleSchema, updateFreightRateRuleSchema, ratePreviewSchema } = require('../validators/freightRateRule.schema');
const { auditLogistics } = require('../utils/logisticsAudit');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}
function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}
function actorOf(req) {
    return (req.auth && (req.auth.userId || req.auth.email)) || 'system';
}

async function fetchRuleOwned(id, req, next) {
    const row = await db.FreightRateRule.findByPk(id);
    if (!row) { next(new AppError('NOT_FOUND', 'Freight rate rule not found', 404)); return null; }
    if (isAdmin(req)) return row;
    const tenantId = callerTenantId(req);
    if (tenantId && row.tenant_id && row.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Freight rate rule not found', 404)); return null;
    }
    return row;
}

function toApi(r) {
    return {
        id: r.id, ruleType: r.rule_type, carrierId: r.carrier_id,
        originCode: r.origin_code, destinationCode: r.destination_code, mode: r.mode,
        minWeightKg: r.min_weight_kg != null ? Number(r.min_weight_kg) : null,
        maxWeightKg: r.max_weight_kg != null ? Number(r.max_weight_kg) : null,
        minVolumeCbm: r.min_volume_cbm != null ? Number(r.min_volume_cbm) : null,
        maxVolumeCbm: r.max_volume_cbm != null ? Number(r.max_volume_cbm) : null,
        validFrom: r.valid_from, validTo: r.valid_to, currency: r.currency,
        adjustmentType: r.adjustment_type,
        adjustmentValue: r.adjustment_value != null ? Number(r.adjustment_value) : null,
        priority: r.priority, active: r.active,
        createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

function fromApi(v) {
    const out = {
        rule_type: v.ruleType, carrier_id: v.carrierId, origin_code: v.originCode,
        destination_code: v.destinationCode, mode: v.mode,
        min_weight_kg: v.minWeightKg, max_weight_kg: v.maxWeightKg,
        min_volume_cbm: v.minVolumeCbm, max_volume_cbm: v.maxVolumeCbm,
        valid_from: v.validFrom, valid_to: v.validTo, currency: v.currency,
        adjustment_type: v.adjustmentType, adjustment_value: v.adjustmentValue,
        priority: v.priority, active: v.active,
    };
    Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
    return out;
}

const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'priority'] });
        const where = {};
        if (req.query.ruleType) where.rule_type = req.query.ruleType;
        if (req.query.carrierId) where.carrier_id = req.query.carrierId;
        if (req.query.active != null) where.active = req.query.active === 'true';
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.FreightRateRule.findAndCountAll({ where, limit, offset, order });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await fetchRuleOwned(req.params.id, req, next);
        if (!row) return undefined;
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const parsed = createFreightRateRuleSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const tenantId = callerTenantId(req);
        const row = await db.FreightRateRule.create({
            ...fromApi(parsed.data),
            ...(tenantId ? { tenant_id: tenantId } : {}),
            created_by: actorOf(req),
        });
        await auditLogistics(req, 'freight_rate_rule.created', 'freight_rate_rule', row.id, { ruleType: row.rule_type });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const row = await fetchRuleOwned(req.params.id, req, next);
        if (!row) return undefined;
        const parsed = updateFreightRateRuleSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const updates = fromApi(parsed.data);
        await row.update({ ...updates, updated_by: actorOf(req) });
        await auditLogistics(req, 'freight_rate_rule.updated', 'freight_rate_rule', row.id, { fields: Object.keys(updates) });
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
    try {
        const row = await fetchRuleOwned(req.params.id, req, next);
        if (!row) return undefined;
        await row.update({ deleted_by: actorOf(req) });
        await row.destroy(); // paranoid: soft delete
        await auditLogistics(req, 'freight_rate_rule.deleted', 'freight_rate_rule', row.id);
        return sendSuccess(req, res, { id: row.id, deleted: true });
    } catch (err) { return next(err); }
};

// ── POST /v1/freight/rate-preview ────────────────────────────────────────────
const preview = async (req, res, next) => {
    try {
        const parsed = ratePreviewSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const tenantId = callerTenantId(req);
        const result = await rateEngine.previewRate({
            tenantId,
            carrierId: parsed.data.carrierId || null,
            originCode: parsed.data.originCode || null,
            destinationCode: parsed.data.destinationCode || null,
            mode: parsed.data.mode || null,
            baseRate: parsed.data.baseRate,
            weightKg: parsed.data.weightKg,
            volumeCbm: parsed.data.volumeCbm,
            fuelPct: parsed.data.fuelPct,
            date: parsed.data.date || null,
        });
        return sendSuccess(req, res, { ...result, currency: parsed.data.currency });
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, update, remove, preview };

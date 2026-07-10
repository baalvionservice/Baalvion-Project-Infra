'use strict';
/**
 * Logistics Core Foundation (Phase 3) — itemized shipment cost ledger.
 * pending -> approved (COST_APPROVE) -> invoiced -> paid, or -> disputed from
 * any non-terminal state.
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { createShipmentChargeSchema } = require('../validators/shipmentCharge.schema');
const { auditLogistics } = require('../utils/logisticsAudit');
const { emitLogisticsEvent } = require('../service/events/logisticsEvents');

const VALID = {
    pending: ['approved', 'disputed'],
    approved: ['invoiced', 'disputed'],
    invoiced: ['paid', 'disputed'],
    paid: [],
    disputed: [],
};

function assertTransition(charge, to) {
    const allowed = VALID[charge.status] || [];
    if (!allowed.includes(to)) {
        throw new AppError('INVALID_TRANSITION', `cannot ${to} a charge in '${charge.status}' state`, 409);
    }
}

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

async function fetchChargeOwned(id, req, next) {
    const row = await db.ShipmentCharge.findByPk(id);
    if (!row) { next(new AppError('NOT_FOUND', 'Shipment charge not found', 404)); return null; }
    if (isAdmin(req)) return row;
    const tenantId = callerTenantId(req);
    if (tenantId && row.tenant_id && row.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Shipment charge not found', 404)); return null;
    }
    return row;
}

function toApi(r) {
    return {
        id: r.id, shipmentId: r.shipment_id, chargeType: r.charge_type, description: r.description,
        amount: Number(r.amount), currency: r.currency, status: r.status,
        referenceType: r.reference_type, referenceId: r.reference_id,
        approvedBy: r.approved_by, approvedAt: r.approved_at,
        metadata: r.metadata, createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'amount', 'status'] });
        const where = {};
        if (req.query.shipmentId) where.shipment_id = req.query.shipmentId;
        if (req.query.chargeType) where.charge_type = req.query.chargeType;
        if (req.query.status) where.status = req.query.status;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.ShipmentCharge.findAndCountAll({ where, limit, offset, order });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await fetchChargeOwned(req.params.id, req, next);
        if (!row) return undefined;
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const parsed = createShipmentChargeSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const { shipmentId, chargeType, description, amount, currency, referenceType, referenceId, metadata } = parsed.data;
        const tenantId = callerTenantId(req);
        const row = await db.ShipmentCharge.create({
            shipment_id: shipmentId,
            charge_type: chargeType,
            description,
            amount,
            currency,
            reference_type: referenceType,
            reference_id: referenceId,
            metadata: metadata ?? {},
            status: 'pending',
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        await auditLogistics(req, 'shipment_charge.created', 'shipment_charge', row.id, { shipmentId, chargeType, amount });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

// pending -> approved (records who approved it — the COST_APPROVE action).
const approve = async (req, res, next) => {
    try {
        const row = await fetchChargeOwned(req.params.id, req, next);
        if (!row) return undefined;
        assertTransition(row, 'approved');
        await row.update({ status: 'approved', approved_by: req.auth && req.auth.userId, approved_at: new Date() });
        await auditLogistics(req, 'shipment_charge.approved', 'shipment_charge', row.id);
        await emitLogisticsEvent('logisticsShipmentChargeApproved', {
            chargeId: row.id, shipmentId: row.shipment_id, chargeType: row.charge_type,
            amount: Number(row.amount), currency: row.currency, tenantId: row.tenant_id,
        });
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const markInvoiced = async (req, res, next) => {
    try {
        const row = await fetchChargeOwned(req.params.id, req, next);
        if (!row) return undefined;
        assertTransition(row, 'invoiced');
        await row.update({ status: 'invoiced' });
        await auditLogistics(req, 'shipment_charge.invoiced', 'shipment_charge', row.id);
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const markPaid = async (req, res, next) => {
    try {
        const row = await fetchChargeOwned(req.params.id, req, next);
        if (!row) return undefined;
        assertTransition(row, 'paid');
        await row.update({ status: 'paid' });
        await auditLogistics(req, 'shipment_charge.paid', 'shipment_charge', row.id);
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const dispute = async (req, res, next) => {
    try {
        const row = await fetchChargeOwned(req.params.id, req, next);
        if (!row) return undefined;
        assertTransition(row, 'disputed');
        await row.update({ status: 'disputed', metadata: { ...(row.metadata || {}), disputeReason: (req.body && req.body.reason) || null } });
        await auditLogistics(req, 'shipment_charge.disputed', 'shipment_charge', row.id, { reason: (req.body && req.body.reason) || null });
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, approve, markInvoiced, markPaid, dispute };

'use strict';
/**
 * Logistics Core Foundation (Phase 3) — RMA returns against a delivered shipment.
 * requested -> approved -> in_transit -> received -> refunded, or -> rejected
 * from either open state.
 */
const crypto = require('crypto');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { createReturnSchema } = require('../validators/return.schema');
const { auditLogistics } = require('../utils/logisticsAudit');

const VALID = {
    requested: ['approved', 'rejected'],
    approved: ['in_transit', 'rejected'],
    in_transit: ['received'],
    received: ['refunded'],
    refunded: [],
    rejected: [],
};

function assertTransition(ret, to) {
    const allowed = VALID[ret.status] || [];
    if (!allowed.includes(to)) {
        throw new AppError('INVALID_TRANSITION', `cannot ${to} a return in '${ret.status}' state`, 409);
    }
}

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

async function fetchReturnOwned(id, req, next) {
    const row = await db.ShipmentReturn.findByPk(id);
    if (!row) { next(new AppError('NOT_FOUND', 'Return not found', 404)); return null; }
    if (isAdmin(req)) return row;
    const tenantId = callerTenantId(req);
    if (tenantId && row.tenant_id && row.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Return not found', 404)); return null;
    }
    return row;
}

function toApi(r) {
    return {
        id: r.id, shipmentId: r.shipment_id, rmaNumber: r.rma_number, reason: r.reason,
        status: r.status, quantity: r.quantity, requestedBy: r.requested_by, requestedAt: r.requested_at,
        approvedAt: r.approved_at, receivedAt: r.received_at,
        refundAmount: r.refund_amount != null ? Number(r.refund_amount) : null,
        notes: r.notes, metadata: r.metadata, createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

const genRmaNumber = () => `RMA-${crypto.randomInt(10000000, 99999999)}`;

const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'requested_at', 'status'] });
        const where = {};
        if (req.query.shipmentId) where.shipment_id = req.query.shipmentId;
        if (req.query.reason) where.reason = req.query.reason;
        if (req.query.status) where.status = req.query.status;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.ShipmentReturn.findAndCountAll({ where, limit, offset, order });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await fetchReturnOwned(req.params.id, req, next);
        if (!row) return undefined;
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const parsed = createReturnSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const { shipmentId, reason, quantity, notes, metadata } = parsed.data;
        const tenantId = callerTenantId(req);
        const row = await db.ShipmentReturn.create({
            shipment_id: shipmentId,
            rma_number: genRmaNumber(),
            reason,
            quantity,
            notes,
            metadata: metadata ?? {},
            status: 'requested',
            requested_by: req.auth && req.auth.userId,
            requested_at: new Date(),
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        await auditLogistics(req, 'return.created', 'return', row.id, { shipmentId, reason, rmaNumber: row.rma_number });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const approve = async (req, res, next) => {
    try {
        const row = await fetchReturnOwned(req.params.id, req, next);
        if (!row) return undefined;
        assertTransition(row, 'approved');
        await row.update({ status: 'approved', approved_at: new Date() });
        await auditLogistics(req, 'return.approved', 'return', row.id);
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const ship = async (req, res, next) => {
    try {
        const row = await fetchReturnOwned(req.params.id, req, next);
        if (!row) return undefined;
        assertTransition(row, 'in_transit');
        await row.update({ status: 'in_transit' });
        await auditLogistics(req, 'return.shipped', 'return', row.id);
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const receive = async (req, res, next) => {
    try {
        const row = await fetchReturnOwned(req.params.id, req, next);
        if (!row) return undefined;
        assertTransition(row, 'received');
        await row.update({ status: 'received', received_at: new Date() });
        await auditLogistics(req, 'return.received', 'return', row.id);
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const refund = async (req, res, next) => {
    try {
        const row = await fetchReturnOwned(req.params.id, req, next);
        if (!row) return undefined;
        assertTransition(row, 'refunded');
        const amount = req.body && req.body.refundAmount != null ? Number(req.body.refundAmount) : null;
        await row.update({ status: 'refunded', refund_amount: amount });
        await auditLogistics(req, 'return.refunded', 'return', row.id, { amount });
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const reject = async (req, res, next) => {
    try {
        const row = await fetchReturnOwned(req.params.id, req, next);
        if (!row) return undefined;
        assertTransition(row, 'rejected');
        await row.update({ status: 'rejected', notes: (req.body && req.body.reason) || row.notes });
        await auditLogistics(req, 'return.rejected', 'return', row.id);
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, approve, ship, receive, refund, reject };

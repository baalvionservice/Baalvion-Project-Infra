'use strict';
const crypto = require('crypto');
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

function callerOrgCode(req) {
    return (req.auth && (req.auth.orgCode || req.auth.orgId)) || null;
}

function callerUserId(req) {
    return (req.auth && req.auth.userId) || null;
}

// Purchase orders are private buyer/seller party data (like Orders/Payments), so
// every route requires auth and ownership is enforced on every fetch.
async function fetchPoOwned(id, req, next) {
    const po = await db.PurchaseOrder.findByPk(id);
    if (!po) { next(new AppError('NOT_FOUND', 'Purchase order not found', 404)); return null; }
    if (isAdmin(req)) return po;
    const tenantId = callerTenantId(req);
    const org = callerOrgCode(req);
    const isParty = (tenantId && po.tenant_id === tenantId)
        || (org && (po.buyer_org_id === org || po.seller_org_id === org));
    if (!isParty) { next(new AppError('NOT_FOUND', 'Purchase order not found', 404)); return null; }
    return po;
}

// Server computes totals from line items — never trust client-supplied totals.
function computeTotals(lineItems) {
    const items = Array.isArray(lineItems) ? lineItems : [];
    let subtotal = 0;
    let taxTotal = 0;
    const normalized = items.map((item) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unit_price ?? item.unitPrice) || 0;
        const taxRate = Number(item.tax_rate ?? item.taxRate) || 0;
        const lineSubtotal = quantity * unitPrice;
        const lineTax = lineSubtotal * (taxRate / 100);
        subtotal += lineSubtotal;
        taxTotal += lineTax;
        return {
            product: item.product || item.description || '',
            description: item.description || '',
            quantity,
            unit_price: unitPrice,
            tax_rate: taxRate,
            line_total: Number((lineSubtotal + lineTax).toFixed(2)),
        };
    });
    return {
        lineItems: normalized,
        subtotal: Number(subtotal.toFixed(2)),
        taxTotal: Number(taxTotal.toFixed(2)),
        totalValue: Number((subtotal + taxTotal).toFixed(2)),
    };
}

function generatePoNumber(tenantId) {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    const prefix = String(tenantId || 'T-DEMO').replace(/[^A-Z0-9]/gi, '').slice(0, 8).toUpperCase() || 'PO';
    return `PO-${prefix}-${stamp}-${rand}`;
}

async function notify({ tenantId, recipientOrgId, type, title, message, entityId }) {
    if (!recipientOrgId) return;
    await db.Notification.create({
        tenant_id: tenantId, recipient_org_id: recipientOrgId, type, title, message,
        entity_type: 'purchase_order', entity_id: entityId,
    });
}

const listPurchaseOrders = async (req, res, next) => {
    try {
        const {
            status, buyer_org_id, seller_org_id, deal_id, page = 1, limit = 20,
        } = req.query;
        const where = {};
        if (status) where.status = status;
        if (deal_id) where.deal_id = deal_id;
        if (buyer_org_id) where.buyer_org_id = buyer_org_id;
        if (seller_org_id) where.seller_org_id = seller_org_id;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            const org = callerOrgCode(req);
            const orClauses = [];
            if (tenantId) orClauses.push({ tenant_id: tenantId });
            if (org) orClauses.push({ buyer_org_id: org }, { seller_org_id: org });
            where[Op.or] = orClauses.length ? orClauses : [{ tenant_id: '__none__' }];
        }
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.PurchaseOrder.findAndCountAll({
            where, limit: Number(limit), offset, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

const getPurchaseOrder = async (req, res, next) => {
    try {
        const po = await fetchPoOwned(req.params.id, req, next);
        if (!po) return undefined;
        return sendSuccess(req, res, po);
    } catch (err) {
        return next(err);
    }
};

const createPurchaseOrder = async (req, res, next) => {
    try {
        const {
            tenant_id: _ignored, status: _ignoredStatus, po_number: _ignoredNumber,
            order_id: _ignoredOrder, subtotal: _s, tax_total: _t, total_value: _tv,
            ...body
        } = req.body || {};
        if (!body.buyer_org_id || !body.seller_org_id) {
            return next(new AppError('BAD_REQUEST', 'buyer_org_id and seller_org_id are required', 400));
        }
        const tenantId = callerTenantId(req);
        const { lineItems, subtotal, taxTotal, totalValue } = computeTotals(body.line_items);
        const po = await db.PurchaseOrder.create({
            ...body,
            line_items: lineItems,
            subtotal,
            tax_total: taxTotal,
            total_value: totalValue,
            po_number: generatePoNumber(tenantId),
            status: 'draft',
            ...(tenantId ? { tenant_id: tenantId } : {}),
            created_by_user_id: callerUserId(req),
        });
        return sendSuccess(req, res, po, 201);
    } catch (err) {
        return next(err);
    }
};

const updatePurchaseOrder = async (req, res, next) => {
    try {
        const po = await fetchPoOwned(req.params.id, req, next);
        if (!po) return undefined;
        if (po.status !== 'draft') {
            return next(new AppError('CONFLICT', 'Only a draft purchase order can be edited', 409));
        }
        const {
            tenant_id: _ignored, status: _ignoredStatus, po_number: _ignoredNumber,
            order_id: _ignoredOrder, subtotal: _s, tax_total: _t, total_value: _tv,
            ...updates
        } = req.body || {};
        if (updates.line_items) {
            const { lineItems, subtotal, taxTotal, totalValue } = computeTotals(updates.line_items);
            updates.line_items = lineItems;
            updates.subtotal = subtotal;
            updates.tax_total = taxTotal;
            updates.total_value = totalValue;
        }
        await po.update(updates);
        return sendSuccess(req, res, po);
    } catch (err) {
        return next(err);
    }
};

// Buyer issues a draft PO to the seller for review.
const issuePurchaseOrder = async (req, res, next) => {
    try {
        const po = await fetchPoOwned(req.params.id, req, next);
        if (!po) return undefined;
        if (po.status !== 'draft') {
            return next(new AppError('CONFLICT', `Cannot issue a purchase order in status '${po.status}'`, 409));
        }
        await po.update({ status: 'issued', issued_at: new Date() });
        await notify({
            tenantId: po.tenant_id, recipientOrgId: po.seller_org_id, type: 'po_issued',
            title: 'New purchase order received', message: `Purchase order ${po.po_number} awaits your response`,
            entityId: po.id,
        });
        return sendSuccess(req, res, po);
    } catch (err) {
        return next(err);
    }
};

// Seller accepts an issued PO — creates the linked fulfillment Order (trade.orders).
const acceptPurchaseOrder = async (req, res, next) => {
    try {
        const po = await fetchPoOwned(req.params.id, req, next);
        if (!po) return undefined;
        if (po.status !== 'issued') {
            return next(new AppError('CONFLICT', `Cannot accept a purchase order in status '${po.status}'`, 409));
        }
        const firstProduct = (Array.isArray(po.line_items) && po.line_items[0] && po.line_items[0].product) || 'Purchase order goods';
        const totalQuantity = (Array.isArray(po.line_items) ? po.line_items : [])
            .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        const order = await db.Order.create({
            tenant_id: po.tenant_id,
            deal_id: po.deal_id,
            buyer_org_id: po.buyer_org_id,
            seller_org_id: po.seller_org_id,
            product: firstProduct,
            quantity: totalQuantity || null,
            price: po.line_items?.[0]?.unit_price ?? null,
            total_value: po.total_value,
            currency: po.currency,
            status: 'confirmed',
            due_date: po.delivery_date,
        });
        await po.update({ status: 'accepted', responded_at: new Date(), order_id: String(order.id) });
        await notify({
            tenantId: po.tenant_id, recipientOrgId: po.buyer_org_id, type: 'po_accepted',
            title: 'Purchase order accepted', message: `${po.po_number} was accepted and order #${order.id} was created`,
            entityId: po.id,
        });
        return sendSuccess(req, res, po);
    } catch (err) {
        return next(err);
    }
};

const rejectPurchaseOrder = async (req, res, next) => {
    try {
        const po = await fetchPoOwned(req.params.id, req, next);
        if (!po) return undefined;
        if (po.status !== 'issued') {
            return next(new AppError('CONFLICT', `Cannot reject a purchase order in status '${po.status}'`, 409));
        }
        const { reason } = req.body || {};
        await po.update({ status: 'rejected', responded_at: new Date(), notes: reason || po.notes });
        await notify({
            tenantId: po.tenant_id, recipientOrgId: po.buyer_org_id, type: 'po_rejected',
            title: 'Purchase order rejected', message: `${po.po_number} was rejected by the seller`,
            entityId: po.id,
        });
        return sendSuccess(req, res, po);
    } catch (err) {
        return next(err);
    }
};

const cancelPurchaseOrder = async (req, res, next) => {
    try {
        const po = await fetchPoOwned(req.params.id, req, next);
        if (!po) return undefined;
        if (!['draft', 'issued'].includes(po.status)) {
            return next(new AppError('CONFLICT', `Cannot cancel a purchase order in status '${po.status}'`, 409));
        }
        await po.update({ status: 'cancelled', responded_at: new Date() });
        return sendSuccess(req, res, po);
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    listPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder,
    issuePurchaseOrder, acceptPurchaseOrder, rejectPurchaseOrder, cancelPurchaseOrder,
};

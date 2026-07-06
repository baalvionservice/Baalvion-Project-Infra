'use strict';
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

// Accept/reject/counter are buyer actions: only the org that owns the RFQ the
// quotation responds to may act on it (mirrors rfqController.fetchRfqOwned).
async function fetchQuotationForBuyerAction(id, req, next) {
    const quotation = await db.Quotation.findByPk(id);
    if (!quotation) { next(new AppError('NOT_FOUND', 'Quotation not found', 404)); return null; }
    if (isAdmin(req)) return quotation;
    const rfq = quotation.rfqId ? await db.Rfq.findByPk(quotation.rfqId) : null;
    const tenantId = callerTenantId(req);
    if (rfq && rfq.tenant_id && tenantId && rfq.tenant_id !== tenantId) {
        next(new AppError('FORBIDDEN', 'Only the RFQ owner can act on this quotation', 403)); return null;
    }
    return quotation;
}

async function notifySeller(quotation, { type, title, message }) {
    if (!quotation.sellerId) return;
    await db.Notification.create({
        tenant_id: quotation.tenantId, recipient_org_id: quotation.sellerId, type, title, message,
        entity_type: 'quotation', entity_id: quotation.id,
    });
}

const listQuotations = async (req, res, next) => {
    try {
        const { rfqId, sellerId, status, page = 1, limit = 50 } = req.query;
        const org = req.auth && req.auth.orgCode;
        const isAdmin = req.auth && req.auth.role === 'admin';
        const where = {};
        if (rfqId) where.rfqId = rfqId;            // buyer viewing responses to an RFQ
        if (status) where.status = status;
        // Seller-ownership: a sellerId filter must match the caller's own org.
        if (sellerId) {
            if (!isAdmin && org && sellerId !== org) return next(new AppError('FORBIDDEN', 'Cannot view another seller\'s quotations', 403));
            where.sellerId = sellerId;
        } else if (!rfqId && !isAdmin) {
            // No rfq context + not admin → restrict to the caller's own quotes.
            where.sellerId = org || '__none__';
        }
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Quotation.findAndCountAll({
            where, limit: Number(limit), offset, order: [['price', 'ASC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

const getQuotation = async (req, res, next) => {
    try {
        const quotation = await db.Quotation.findByPk(req.params.id);
        if (!quotation) return next(new AppError('NOT_FOUND', 'Quotation not found', 404));
        return sendSuccess(req, res, quotation);
    } catch (err) {
        return next(err);
    }
};

const createQuotation = async (req, res, next) => {
    try {
        const payload = { ...req.body };
        // Stamp the submitting seller's org so participant filtering is reliable.
        if (req.auth?.orgCode) payload.sellerId = String(req.auth.orgCode);
        else if (req.auth?.orgId) payload.sellerId = String(req.auth.orgId);
        const quotation = await db.Quotation.create(payload);
        if (quotation.rfqId) {
            const rfq = await db.Rfq.findByPk(quotation.rfqId);
            if (rfq && rfq.tenant_id) {
                await db.Notification.create({
                    tenant_id: rfq.tenant_id,
                    recipient_org_id: String(rfq.buyer_org_id ?? rfq.tenant_id),
                    type: 'quotation_received',
                    title: 'New quotation received',
                    message: `${quotation.sellerName || quotation.sellerId} responded to your RFQ`,
                    entity_type: 'quotation',
                    entity_id: quotation.id,
                });
            }
        }
        return sendSuccess(req, res, quotation, 201);
    } catch (err) {
        return next(err);
    }
};

const updateQuotation = async (req, res, next) => {
    try {
        const quotation = await db.Quotation.findByPk(req.params.id);
        if (!quotation) return next(new AppError('NOT_FOUND', 'Quotation not found', 404));
        await quotation.update(req.body);
        return sendSuccess(req, res, quotation);
    } catch (err) {
        return next(err);
    }
};

// Buyer accepts a seller's quotation.
const acceptQuotation = async (req, res, next) => {
    try {
        const quotation = await fetchQuotationForBuyerAction(req.params.id, req, next);
        if (!quotation) return undefined;
        if (quotation.status !== 'pending' && quotation.status !== 'countered') {
            return next(new AppError('CONFLICT', `Cannot accept a quotation in status '${quotation.status}'`, 409));
        }
        await quotation.update({ status: 'accepted' });
        await notifySeller(quotation, {
            type: 'quotation_accepted', title: 'Quotation accepted',
            message: `Your quotation for RFQ ${quotation.rfqId} was accepted`,
        });
        return sendSuccess(req, res, quotation);
    } catch (err) {
        return next(err);
    }
};

// Buyer rejects a seller's quotation.
const rejectQuotation = async (req, res, next) => {
    try {
        const quotation = await fetchQuotationForBuyerAction(req.params.id, req, next);
        if (!quotation) return undefined;
        if (quotation.status !== 'pending' && quotation.status !== 'countered') {
            return next(new AppError('CONFLICT', `Cannot reject a quotation in status '${quotation.status}'`, 409));
        }
        await quotation.update({ status: 'rejected' });
        await notifySeller(quotation, {
            type: 'quotation_rejected', title: 'Quotation rejected',
            message: `Your quotation for RFQ ${quotation.rfqId} was rejected`,
        });
        return sendSuccess(req, res, quotation);
    } catch (err) {
        return next(err);
    }
};

// Buyer counters a seller's quotation with revised price/quantity/terms.
const counterQuotation = async (req, res, next) => {
    try {
        const quotation = await fetchQuotationForBuyerAction(req.params.id, req, next);
        if (!quotation) return undefined;
        if (quotation.status !== 'pending' && quotation.status !== 'countered') {
            return next(new AppError('CONFLICT', `Cannot counter a quotation in status '${quotation.status}'`, 409));
        }
        const { price, quantity, deliveryTime, paymentTerms, message } = req.body || {};
        if (price == null && quantity == null) {
            return next(new AppError('BAD_REQUEST', 'price or quantity is required to counter', 400));
        }
        const updates = { status: 'countered' };
        if (price != null) updates.price = price;
        if (quantity != null) updates.quantity = quantity;
        if (deliveryTime != null) updates.deliveryTime = deliveryTime;
        if (paymentTerms != null) updates.paymentTerms = paymentTerms;
        if (message != null) updates.message = message;
        await quotation.update(updates);
        await notifySeller(quotation, {
            type: 'quotation_countered', title: 'Buyer countered your quotation',
            message: `New terms proposed for RFQ ${quotation.rfqId}`,
        });
        return sendSuccess(req, res, quotation);
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    listQuotations, getQuotation, createQuotation, updateQuotation,
    acceptQuotation, rejectQuotation, counterQuotation,
};

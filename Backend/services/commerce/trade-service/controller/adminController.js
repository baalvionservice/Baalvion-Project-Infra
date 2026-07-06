'use strict';
const { Op, fn, col, literal } = require('sequelize');
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const dashboard = async (req, res, next) => {
    try {
        const [
            orgCount, rfqCount, dealCount, orderCount,
            escrowCount, shipmentCount, paymentCount,
            complianceCount, disputeCount, paymentVolume,
        ] = await Promise.all([
            db.Organization.count(),
            db.Rfq.count(),
            db.Deal.count(),
            db.Order.count(),
            db.Escrow.count(),
            db.Shipment.count(),
            db.Payment.count(),
            db.ComplianceCase.count(),
            db.Dispute.count(),
            db.Payment.findOne({
                attributes: [[fn('SUM', col('amount')), 'total_volume']],
                where: { status: 'completed' },
                raw: true,
            }),
        ]);

        return sendSuccess(req, res, {
            counts: {
                organizations: orgCount,
                rfqs: rfqCount,
                deals: dealCount,
                orders: orderCount,
                escrows: escrowCount,
                shipments: shipmentCount,
                payments: paymentCount,
                compliance_cases: complianceCount,
                disputes: disputeCount,
            },
            total_payment_volume_usd: paymentVolume ? Number(paymentVolume.total_volume || 0) : 0,
        });
    } catch (err) {
        return next(err);
    }
};

const analytics = async (req, res, next) => {
    try {
        const [dealsByStatus, ordersByFulfillment, paymentsByCurrency, shipmentsByStatus] = await Promise.all([
            db.Deal.findAll({
                attributes: ['status', [fn('COUNT', col('id')), 'count']],
                group: ['status'],
                raw: true,
            }),
            db.Order.findAll({
                attributes: ['fulfillment_state', [fn('COUNT', col('id')), 'count']],
                group: ['fulfillment_state'],
                raw: true,
            }),
            db.Payment.findAll({
                attributes: ['currency', [fn('SUM', col('amount')), 'total'], [fn('COUNT', col('id')), 'count']],
                group: ['currency'],
                raw: true,
            }),
            db.Shipment.findAll({
                attributes: ['status', [fn('COUNT', col('id')), 'count']],
                group: ['status'],
                raw: true,
            }),
        ]);

        return sendSuccess(req, res, {
            deals_by_status: dealsByStatus,
            orders_by_fulfillment_state: ordersByFulfillment,
            payments_by_currency: paymentsByCurrency,
            shipments_by_status: shipmentsByStatus,
        });
    } catch (err) {
        return next(err);
    }
};

const listAdminOrgs = async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Organization.findAndCountAll({
            limit: Number(limit), offset, order: [['created_at', 'DESC']],
        });
        return sendSuccess(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

// ── Generic paginated cross-tenant list, shared by every admin resource below. ──
const paginate = async (model, { where = {}, order = [['created_at', 'DESC']], attributes } = {}, req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await model.findAndCountAll({
            where, limit: Number(limit), offset, order, ...(attributes ? { attributes } : {}),
        });
        return sendSuccess(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

// -- Users ------------------------------------------------------------------
const listAdminUsers = async (req, res, next) => {
    const { role, tenant_id, search } = req.query;
    const where = {};
    if (role) where.role = role;
    if (tenant_id) where.tenant_id = tenant_id;
    if (search) where.email = { [Op.iLike]: `%${search}%` };
    return paginate(db.User, {
        where, order: [['created_at', 'DESC']],
        attributes: { exclude: ['password_hash', 'mfa_secret', 'mfa_backup_codes'] },
    }, req, res, next);
};

// Moderation only — role/is_active. Never accepts a password/email change here.
const updateAdminUser = async (req, res, next) => {
    try {
        const user = await db.User.findByPk(req.params.id);
        if (!user) return next(new AppError('NOT_FOUND', 'User not found', 404));
        const { role, is_active } = req.body || {};
        const updates = {};
        if (role !== undefined) updates.role = role;
        if (is_active !== undefined) updates.is_active = is_active;
        await user.update(updates);
        const { password_hash, mfa_secret, mfa_backup_codes, ...safe } = user.toJSON();
        return sendSuccess(req, res, safe);
    } catch (err) {
        return next(err);
    }
};

// -- Products (marketplace listings) -----------------------------------------
const listAdminListings = async (req, res, next) => {
    const { status, category, companyId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (companyId) where.companyId = companyId;
    return paginate(db.Listing, { where, order: [['createdAt', 'DESC']] }, req, res, next);
};

// Moderation only — takes a listing down / republishes it.
const updateAdminListingStatus = async (req, res, next) => {
    try {
        const listing = await db.Listing.findByPk(req.params.id);
        if (!listing) return next(new AppError('NOT_FOUND', 'Listing not found', 404));
        const { status } = req.body || {};
        if (!status) return next(new AppError('BAD_REQUEST', 'status is required', 400));
        await listing.update({ status });
        return sendSuccess(req, res, listing);
    } catch (err) {
        return next(err);
    }
};

const deleteAdminListing = async (req, res, next) => {
    try {
        const listing = await db.Listing.findByPk(req.params.id);
        if (!listing) return next(new AppError('NOT_FOUND', 'Listing not found', 404));
        await listing.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) {
        return next(err);
    }
};

// -- RFQs ---------------------------------------------------------------------
const listAdminRfqs = async (req, res, next) => {
    const { status, buyer_org_id } = req.query;
    const where = {};
    if (status) where.status = status;
    if (buyer_org_id) where.buyer_org_id = buyer_org_id;
    return paginate(db.Rfq, { where }, req, res, next);
};

// Moderation only — force-close/cancel an RFQ.
const updateAdminRfqStatus = async (req, res, next) => {
    try {
        const rfq = await db.Rfq.findByPk(req.params.id);
        if (!rfq) return next(new AppError('NOT_FOUND', 'RFQ not found', 404));
        const { status } = req.body || {};
        if (!status) return next(new AppError('BAD_REQUEST', 'status is required', 400));
        await rfq.update({ status });
        return sendSuccess(req, res, rfq);
    } catch (err) {
        return next(err);
    }
};

// -- Purchase Orders ------------------------------------------------------------
const listAdminPurchaseOrders = async (req, res, next) => {
    const { status, buyer_org_id, seller_org_id } = req.query;
    const where = {};
    if (status) where.status = status;
    if (buyer_org_id) where.buyer_org_id = buyer_org_id;
    if (seller_org_id) where.seller_org_id = seller_org_id;
    return paginate(db.PurchaseOrder, { where }, req, res, next);
};

// -- Orders / Payments (READ-ONLY) --------------------------------------------
// Order/Payment WRITE surfaces are intentionally retired (see orderRoutes.js /
// paymentRoutes.js) — the fulfillment/money system of record has moved to
// order-execution-service + the Java payment-service. Admin gets read/audit
// visibility over trade-service's local projection only; it must not gain a
// write path here (that would reintroduce the divergent-state risk those
// retirements were built to prevent).
const listAdminOrders = async (req, res, next) => {
    const { status, buyer_org_id, seller_org_id } = req.query;
    const where = {};
    if (status) where.status = status;
    if (buyer_org_id) where.buyer_org_id = buyer_org_id;
    if (seller_org_id) where.seller_org_id = seller_org_id;
    return paginate(db.Order, { where }, req, res, next);
};

const listAdminPayments = async (req, res, next) => {
    const { status, payer_org_id, payee_org_id } = req.query;
    const where = {};
    if (status) where.status = status;
    if (payer_org_id) where.payer_org_id = payer_org_id;
    if (payee_org_id) where.payee_org_id = payee_org_id;
    return paginate(db.Payment, { where }, req, res, next);
};

// -- Documents (READ-ONLY) -----------------------------------------------------
const listAdminDocuments = async (req, res, next) => {
    const { doc_type, status, entity_type } = req.query;
    const where = {};
    if (doc_type) where.doc_type = doc_type;
    if (status) where.status = status;
    if (entity_type) where.entity_type = entity_type;
    return paginate(db.Document, { where }, req, res, next);
};

module.exports = {
    dashboard, analytics, listAdminOrgs,
    listAdminUsers, updateAdminUser,
    listAdminListings, updateAdminListingStatus, deleteAdminListing,
    listAdminRfqs, updateAdminRfqStatus,
    listAdminPurchaseOrders,
    listAdminOrders, listAdminPayments, listAdminDocuments,
};

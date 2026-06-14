'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listRfqs = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const where = { org_id: req.user.orgId };
        if (req.query.status) where.status = req.query.status;
        const { count, rows } = await db.Rfq.findAndCountAll({ where, limit, offset, order: [['created_at', 'DESC']] });
        return sendPaginated(req, res, { items: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
    } catch (err) { return next(err); }
};

const createRfq = async (req, res, next) => {
    try {
        // Mass-assignment: explicit allowlist — identity fields always from server token
        const {
            listing_id,
            quantity_mt,
            target_price,
            currency,
            delivery_port,
            required_by,
            message,
        } = req.body;
        if (listing_id) {
            const listing = await db.MineralListing.findByPk(listing_id);
            if (!listing) return next(new AppError('NOT_FOUND', 'Listing not found', 404));
        }
        const rfq = await db.Rfq.create({
            listing_id,
            quantity_mt,
            target_price,
            currency,
            delivery_port,
            required_by,
            message,
            buyer_id: req.user.id,
            org_id: req.user.orgId,
            buyer_org_id: req.user.orgId,
        });
        return sendSuccess(req, res, rfq, 201);
    } catch (err) { return next(err); }
};

const getRfq = async (req, res, next) => {
    try {
        const rfq = await db.Rfq.findByPk(req.params.id, { include: [{ model: db.Bid, as: 'bids' }] });
        if (!rfq) return next(new AppError('NOT_FOUND', 'RFQ not found', 404));
        return sendSuccess(req, res, rfq);
    } catch (err) { return next(err); }
};

const listBids = async (req, res, next) => {
    try {
        const bids = await db.Bid.findAll({ where: { rfq_id: req.params.id }, order: [['created_at', 'DESC']] });
        return sendSuccess(req, res, bids);
    } catch (err) { return next(err); }
};

const submitBid = async (req, res, next) => {
    try {
        const rfq = await db.Rfq.findByPk(req.params.id);
        if (!rfq) return next(new AppError('NOT_FOUND', 'RFQ not found', 404));
        if (rfq.status !== 'open') return next(new AppError('CONFLICT', 'RFQ is not open for bids', 409));
        // Mass-assignment: explicit allowlist — identity fields always from server token
        const {
            price_per_unit,
            total_price,
            currency,
            delivery_days,
            notes,
        } = req.body;
        const bid = await db.Bid.create({
            price_per_unit,
            total_price,
            currency,
            delivery_days,
            notes,
            rfq_id: req.params.id,
            bidder_id: req.user.id,
            org_id: req.user.orgId,
            bidder_org_id: req.user.orgId,
        });
        return sendSuccess(req, res, bid, 201);
    } catch (err) { return next(err); }
};

const awardBid = async (req, res, next) => {
    try {
        const rfq = await db.Rfq.findByPk(req.params.id, { include: [{ model: db.Bid, as: 'bids' }] });
        if (!rfq) return next(new AppError('NOT_FOUND', 'RFQ not found', 404));
        // IDOR: only the buyer who created the RFQ (or admin) may award a bid
        const roles = req.auth.roles || [];
        const isAdmin = roles.some((r) => ['admin', 'owner', 'super_admin'].includes(r));
        if (!isAdmin && rfq.buyer_id !== req.user.id) {
            return next(new AppError('FORBIDDEN', 'Not authorized to award bids on this RFQ', 403));
        }
        const bid = rfq.bids.find(b => b.id == req.params.bidId);
        if (!bid) return next(new AppError('NOT_FOUND', 'Bid not found', 404));
        await bid.update({ status: 'accepted' });
        await db.Bid.update({ status: 'rejected' }, { where: { rfq_id: rfq.id, id: { [Op.ne]: bid.id } } });
        await rfq.update({ status: 'awarded' });
        const order = await db.Order.create({
            org_id: req.user.orgId,
            listing_id: rfq.listing_id,
            rfq_id: rfq.id,
            buyer_id: rfq.buyer_id,
            seller_id: bid.bidder_id,
            quantity_mt: rfq.quantity_mt,
            unit_price: bid.price_per_unit,
            total_price: bid.total_price,
            total_amount: bid.total_price,
            currency: bid.currency || rfq.currency,
            status: 'pending',
            payment_status: 'unpaid',
            delivery_port: rfq.delivery_port,
        });
        return sendSuccess(req, res, { bid, rfq, order });
    } catch (err) { return next(err); }
};

const rejectBid = async (req, res, next) => {
    try {
        const rfq = await db.Rfq.findByPk(req.params.id);
        if (!rfq) return next(new AppError('NOT_FOUND', 'RFQ not found', 404));
        // IDOR: only the buyer who created the RFQ (or admin) may reject a bid
        const roles = req.auth.roles || [];
        const isAdmin = roles.some((r) => ['admin', 'owner', 'super_admin'].includes(r));
        if (!isAdmin && rfq.buyer_id !== req.user.id) {
            return next(new AppError('FORBIDDEN', 'Not authorized to reject bids on this RFQ', 403));
        }
        const bid = await db.Bid.findOne({ where: { id: req.params.bidId, rfq_id: req.params.id } });
        if (!bid) return next(new AppError('NOT_FOUND', 'Bid not found', 404));
        await bid.update({ status: 'rejected' });
        return sendSuccess(req, res, bid);
    } catch (err) { return next(err); }
};

module.exports = { listRfqs, createRfq, getRfq, listBids, submitBid, awardBid, rejectBid };

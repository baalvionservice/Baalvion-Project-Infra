'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listListings = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const where = {};
        if (req.query.mineral_type) where.mineral_type = req.query.mineral_type;
        if (req.query.status) where.status = req.query.status;
        if (req.query.country) where.origin_country = req.query.country;
        if (req.query.min_price || req.query.max_price) {
            where.price_per_unit = {};
            if (req.query.min_price) where.price_per_unit[Op.gte] = parseFloat(req.query.min_price);
            if (req.query.max_price) where.price_per_unit[Op.lte] = parseFloat(req.query.max_price);
        }
        const { count, rows } = await db.MineralListing.findAndCountAll({ where, limit, offset, order: [['created_at', 'DESC']] });
        return sendPaginated(req, res, { items: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
    } catch (err) { return next(err); }
};

const createListing = async (req, res, next) => {
    try {
        const { title, mineral_type, quantity_mt, price_per_unit } = req.body;
        if (!title || !mineral_type || !quantity_mt || !price_per_unit) {
            return next(new AppError('VALIDATION_ERROR', 'title, mineral_type, quantity_mt, price_per_unit are required', 422));
        }
        const listing = await db.MineralListing.create({
            ...req.body,
            seller_id: req.user.id,
            org_id: req.user.orgId,
            seller_org_id: req.user.orgId,
        });
        return sendSuccess(req, res, listing, 201);
    } catch (err) { return next(err); }
};

const getListing = async (req, res, next) => {
    try {
        const listing = await db.MineralListing.findByPk(req.params.id);
        if (!listing) return next(new AppError('NOT_FOUND', 'Listing not found', 404));
        listing.increment('views_count').catch(() => {});
        return sendSuccess(req, res, listing);
    } catch (err) { return next(err); }
};

const updateListing = async (req, res, next) => {
    try {
        const listing = await db.MineralListing.findByPk(req.params.id);
        if (!listing) return next(new AppError('NOT_FOUND', 'Listing not found', 404));
        if (listing.seller_id !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('FORBIDDEN', 'Not authorized to update this listing', 403));
        }
        await listing.update(req.body);
        return sendSuccess(req, res, listing);
    } catch (err) { return next(err); }
};

const deleteListing = async (req, res, next) => {
    try {
        const listing = await db.MineralListing.findByPk(req.params.id);
        if (!listing) return next(new AppError('NOT_FOUND', 'Listing not found', 404));
        if (listing.seller_id !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('FORBIDDEN', 'Not authorized to delete this listing', 403));
        }
        await listing.update({ status: 'expired' });
        return sendSuccess(req, res, { id: listing.id, status: 'expired' });
    } catch (err) { return next(err); }
};

const publishListing = async (req, res, next) => {
    try {
        const listing = await db.MineralListing.findByPk(req.params.id);
        if (!listing) return next(new AppError('NOT_FOUND', 'Listing not found', 404));
        if (listing.seller_id !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('FORBIDDEN', 'Not authorized', 403));
        }
        await listing.update({ status: 'active' });
        return sendSuccess(req, res, listing);
    } catch (err) { return next(err); }
};

const featureListing = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return next(new AppError('FORBIDDEN', 'Admin only', 403));
        const listing = await db.MineralListing.findByPk(req.params.id);
        if (!listing) return next(new AppError('NOT_FOUND', 'Listing not found', 404));
        await listing.update({ is_featured: true });
        return sendSuccess(req, res, listing);
    } catch (err) { return next(err); }
};

module.exports = { listListings, createListing, getListing, updateListing, deleteListing, publishListing, featureListing };

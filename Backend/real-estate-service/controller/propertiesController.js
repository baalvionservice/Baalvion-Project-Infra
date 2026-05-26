'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');

const buildPagination = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
});

const listProperties = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const { property_type, listing_type, country, city, min_price, max_price, bedrooms, status } = req.query;
        const where = {};
        if (property_type) where.property_type = property_type;
        if (listing_type) where.listing_type = listing_type;
        if (country) where.country = { [Op.iLike]: `%${country}%` };
        if (city) where.city = { [Op.iLike]: `%${city}%` };
        if (min_price || max_price) {
            where.price = {};
            if (min_price) where.price[Op.gte] = parseFloat(min_price);
            if (max_price) where.price[Op.lte] = parseFloat(max_price);
        }
        if (bedrooms) where.bedrooms = parseInt(bedrooms);
        if (status) where.status = status;
        else where.status = 'active';
        const { count, rows } = await db.Property.findAndCountAll({
            where,
            include: [
                { model: db.PropertyImage, as: 'images', where: { is_cover: true }, required: false },
                { model: db.Agent, as: 'agent', attributes: ['id', 'name', 'email', 'phone', 'avatar_url', 'rating'], required: false },
            ],
            limit,
            offset,
            order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows, pagination: buildPagination(count, page, limit) });
    } catch (e) { return next(e); }
};

const createProperty = async (req, res, next) => {
    try {
        const property = await db.Property.create({ ...req.body, org_id: req.user.orgId });
        return sendSuccess(req, res, property, 201);
    } catch (e) { return next(e); }
};

const getProperty = async (req, res, next) => {
    try {
        const property = await db.Property.findByPk(req.params.id, {
            include: [
                { model: db.PropertyImage, as: 'images', order: [['display_order', 'ASC']] },
                { model: db.Agent, as: 'agent', attributes: ['id', 'name', 'email', 'phone', 'avatar_url', 'rating', 'review_count'], required: false },
            ],
        });
        if (!property) return next(new AppError('NOT_FOUND', 'Property not found', 404));
        await property.increment('views_count', { by: 1 });
        return sendSuccess(req, res, property);
    } catch (e) { return next(e); }
};

const updateProperty = async (req, res, next) => {
    try {
        const property = await db.Property.findByPk(req.params.id);
        if (!property) return next(new AppError('NOT_FOUND', 'Property not found', 404));
        if (req.user.role !== 'admin' && String(property.org_id) !== String(req.user.orgId)) {
            return next(new AppError('FORBIDDEN', 'Access denied', 403));
        }
        await property.update(req.body);
        return sendSuccess(req, res, property);
    } catch (e) { return next(e); }
};

const deleteProperty = async (req, res, next) => {
    try {
        const property = await db.Property.findByPk(req.params.id);
        if (!property) return next(new AppError('NOT_FOUND', 'Property not found', 404));
        if (req.user.role !== 'admin' && String(property.org_id) !== String(req.user.orgId)) {
            return next(new AppError('FORBIDDEN', 'Access denied', 403));
        }
        await property.update({ status: 'archived' });
        return sendSuccess(req, res, { message: 'Property archived' });
    } catch (e) { return next(e); }
};

const publishProperty = async (req, res, next) => {
    try {
        const property = await db.Property.findByPk(req.params.id);
        if (!property) return next(new AppError('NOT_FOUND', 'Property not found', 404));
        if (req.user.role !== 'admin' && String(property.org_id) !== String(req.user.orgId)) {
            return next(new AppError('FORBIDDEN', 'Access denied', 403));
        }
        await property.update({ status: 'active' });
        return sendSuccess(req, res, property);
    } catch (e) { return next(e); }
};

const featureProperty = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return next(new AppError('FORBIDDEN', 'Admin only', 403));
        const property = await db.Property.findByPk(req.params.id);
        if (!property) return next(new AppError('NOT_FOUND', 'Property not found', 404));
        await property.update({ is_featured: true });
        return sendSuccess(req, res, property);
    } catch (e) { return next(e); }
};

const addImages = async (req, res, next) => {
    try {
        const property = await db.Property.findByPk(req.params.id);
        if (!property) return next(new AppError('NOT_FOUND', 'Property not found', 404));
        const images = req.body.images;
        if (!Array.isArray(images) || images.length === 0) {
            return next(new AppError('VALIDATION_ERROR', 'images must be a non-empty array', 400));
        }
        const records = images.map(img => ({ property_id: property.id, ...img }));
        const created = await db.PropertyImage.bulkCreate(records, { returning: true });
        return sendSuccess(req, res, created, 201);
    } catch (e) { return next(e); }
};

const getPropertyAnalytics = async (req, res, next) => {
    try {
        const { sequelize } = db;
        const viewsByDate = await db.Property.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                [sequelize.fn('SUM', sequelize.col('views_count')), 'total_views'],
            ],
            where: req.user.orgId ? { org_id: req.user.orgId } : {},
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'DESC']],
            limit: 30,
            raw: true,
        });
        const inquiryByType = await db.Property.findAll({
            attributes: [
                'property_type',
                [sequelize.fn('SUM', sequelize.col('inquiry_count')), 'total_inquiries'],
            ],
            where: req.user.orgId ? { org_id: req.user.orgId } : {},
            group: ['property_type'],
            raw: true,
        });
        return sendSuccess(req, res, { views_by_date: viewsByDate, inquiry_by_type: inquiryByType });
    } catch (e) { return next(e); }
};

module.exports = {
    listProperties,
    createProperty,
    getProperty,
    updateProperty,
    deleteProperty,
    publishProperty,
    featureProperty,
    addImages,
    getPropertyAnalytics,
};

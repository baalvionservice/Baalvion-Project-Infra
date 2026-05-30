'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const ADMIN_ROLES = ['admin', 'owner', 'super_admin', 'system'];
const isAdmin = (req) => (req.auth?.roles || []).some((r) => ADMIN_ROLES.includes(r));

// Flatten type-specific `attributes` back to top-level so the frontend receives a flat
// entity (CompanyEntity/CountryEntity/…). Emit snake_case timestamps the UI expects.
const serialize = (row) => {
    const j = row.toJSON ? row.toJSON() : row;
    const { attributes, createdAt, updatedAt, created_at, updated_at, ...base } = j;
    return {
        ...base,
        ...(attributes || {}),
        created_at: created_at || createdAt,
        updated_at: updated_at || updatedAt,
    };
};

const buildPagination = (total, page, limit) => ({ total, page, limit, totalPages: Math.ceil(total / limit) });

// GET /entities?type=&search=&country=&industry=&category=&page=&limit=  (public)
const listEntities = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 50));
        const offset = (page - 1) * limit;
        const where = {};

        if (req.query.type) where.type = req.query.type;
        if (req.query.country) where.country = req.query.country;
        if (req.query.industry) where.industry = req.query.industry;
        if (req.query.category) where.category = req.query.category;
        if (req.query.search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${req.query.search}%` } },
                { description: { [Op.iLike]: `%${req.query.search}%` } },
            ];
        }

        const { count, rows } = await db.Entity.findAndCountAll({ where, limit, offset, order: [['name', 'ASC']] });
        return sendPaginated(req, res, { items: rows.map(serialize), pagination: buildPagination(count, page, limit) });
    } catch (err) { return next(err); }
};

// GET /entities/:type/:slug  (public)
const getEntity = async (req, res, next) => {
    try {
        const entity = await db.Entity.findOne({ where: { type: req.params.type, slug: req.params.slug } });
        if (!entity) return next(new AppError('NOT_FOUND', 'Entity not found', 404));
        return sendSuccess(req, res, serialize(entity));
    } catch (err) { return next(err); }
};

// POST /entities  (admin) — upsert by (type, slug)
const upsertEntity = async (req, res, next) => {
    try {
        if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin access required', 403));

        const { type, name, slug, description, category, country, industry, image, tags, ...rest } = req.body;
        if (!type || !name || !slug) return next(new AppError('VALIDATION_ERROR', 'type, name and slug are required', 400));

        // Anything that isn't a base column is type-specific → attributes.
        const attributes = rest.attributes && typeof rest.attributes === 'object' ? rest.attributes : rest;
        const base = { type, name, slug, description, category, country, industry, image, tags: tags || [], attributes };

        const existing = await db.Entity.findOne({ where: { type, slug } });
        if (existing) {
            await existing.update(base);
            return sendSuccess(req, res, serialize(existing), 200);
        }
        const created = await db.Entity.create(base);
        return sendSuccess(req, res, serialize(created), 201);
    } catch (err) { return next(err); }
};

// DELETE /entities/:type/:slug  (admin)
const deleteEntity = async (req, res, next) => {
    try {
        if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin access required', 403));
        const entity = await db.Entity.findOne({ where: { type: req.params.type, slug: req.params.slug } });
        if (!entity) return next(new AppError('NOT_FOUND', 'Entity not found', 404));
        await entity.destroy();
        return sendSuccess(req, res, { message: 'Entity deleted' });
    } catch (err) { return next(err); }
};

module.exports = { listEntities, getEntity, upsertEntity, deleteEntity };

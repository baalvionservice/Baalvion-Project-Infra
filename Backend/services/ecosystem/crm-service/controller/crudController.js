'use strict';
// Generic CRUD controller factory shared by every CRM entity. Each entity is brand-scoped
// (multi-tenant) via `brandId`; list/read default to the configured default brand so the
// storefront's public surfaces work without a token, while writes are mounted behind auth
// in routes/v1.js. Keeps the six entities DRY instead of six near-identical controllers.
const { Op } = require('sequelize');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');

const DEFAULT_BRAND = process.env.CRM_DEFAULT_BRAND || 'amarise-luxe';

const clampLimit = (v, max = 200, def = 50) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return def;
    return Math.min(Math.floor(n), max);
};

/**
 * @param {object} Model        Sequelize model
 * @param {object} opts
 * @param {string[]} [opts.searchable]  columns matched against ?search=
 * @param {string}  [opts.defaultOrder] column to order by (default created_at desc)
 */
function makeController(Model, opts = {}) {
    const searchable = opts.searchable || [];
    const orderCol = opts.defaultOrder || 'created_at';

    const list = async (req, res) => {
        const brandId = req.query.brandId || DEFAULT_BRAND;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = clampLimit(req.query.limit);
        const where = { brandId };
        if (req.query.status) where.status = String(req.query.status);
        if (req.query.search && searchable.length) {
            where[Op.or] = searchable.map((c) => ({ [c]: { [Op.iLike]: `%${req.query.search}%` } }));
        }
        const { rows, count } = await Model.findAndCountAll({
            where,
            order: [[orderCol, 'DESC']],
            limit,
            offset: (page - 1) * limit,
        });
        return sendPaginated(req, res, {
            items: rows,
            total: count,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(count / limit)),
        });
    };

    const getOne = async (req, res) => {
        const row = await Model.findByPk(req.params.id);
        if (!row) throw new AppError('NOT_FOUND', `${Model.name} not found`, 404);
        return sendSuccess(req, res, row);
    };

    const create = async (req, res) => {
        const body = { ...req.body };
        if (!body.brandId) body.brandId = DEFAULT_BRAND;
        delete body.id; // server-assigned
        const row = await Model.create(body);
        return sendSuccess(req, res, row, 201);
    };

    const update = async (req, res) => {
        const row = await Model.findByPk(req.params.id);
        if (!row) throw new AppError('NOT_FOUND', `${Model.name} not found`, 404);
        const body = { ...req.body };
        delete body.id;
        delete body.brandId; // brand is immutable once created
        await row.update(body);
        return sendSuccess(req, res, row);
    };

    const remove = async (req, res) => {
        const row = await Model.findByPk(req.params.id);
        if (!row) throw new AppError('NOT_FOUND', `${Model.name} not found`, 404);
        await row.destroy();
        return sendSuccess(req, res, { id: req.params.id, deleted: true });
    };

    return { list, getOne, create, update, remove };
}

module.exports = { makeController, DEFAULT_BRAND };

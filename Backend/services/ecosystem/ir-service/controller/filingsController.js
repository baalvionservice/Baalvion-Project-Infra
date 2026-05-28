'use strict';
const db = require('../models');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listFilings = async (req, res, next) => {
    try {
        const { org_id, filing_type, regulator, year, page = 1, limit = 20 } = req.query;
        const where = {};
        if (org_id) where.org_id = org_id;
        if (filing_type) where.filing_type = filing_type;
        if (regulator) where.regulator = regulator;
        if (year) {
            const { Op } = require('sequelize');
            where.filing_date = {
                [Op.between]: [`${year}-01-01`, `${year}-12-31`],
            };
        }

        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Filing.findAndCountAll({
            where,
            order: [['filing_date', 'DESC']],
            limit: Number(limit),
            offset,
        });

        return sendPaginated(req, res, {
            items: rows,
            pagination: {
                total: count,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(count / Number(limit)),
            },
        });
    } catch (err) { return next(err); }
};

const createFiling = async (req, res, next) => {
    try {
        const filing = await db.Filing.create({ ...req.body, created_by: req.user.id });
        return sendSuccess(req, res, filing, 201);
    } catch (err) { return next(err); }
};

const getFiling = async (req, res, next) => {
    try {
        const filing = await db.Filing.findByPk(req.params.id);
        if (!filing) return next(new AppError('NOT_FOUND', 'Filing not found', 404));
        return sendSuccess(req, res, filing);
    } catch (err) { return next(err); }
};

const updateFiling = async (req, res, next) => {
    try {
        const filing = await db.Filing.findByPk(req.params.id);
        if (!filing) return next(new AppError('NOT_FOUND', 'Filing not found', 404));
        await filing.update(req.body);
        return sendSuccess(req, res, filing);
    } catch (err) { return next(err); }
};

const deleteFiling = async (req, res, next) => {
    try {
        const filing = await db.Filing.findByPk(req.params.id);
        if (!filing) return next(new AppError('NOT_FOUND', 'Filing not found', 404));
        await filing.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listFilings, createFiling, getFiling, updateFiling, deleteFiling };

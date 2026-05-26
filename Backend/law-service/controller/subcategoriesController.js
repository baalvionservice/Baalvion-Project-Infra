'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listSubcategories = async (req, res, next) => {
    try {
        const where = {};
        if (req.query.categoryId) where.category_id = Number(req.query.categoryId);
        if (req.query.isActive !== 'false') where.is_active = true;
        const subcategories = await db.Subcategory.findAll({
            where,
            order: [['name', 'ASC']],
        });
        return sendSuccess(req, res, subcategories);
    } catch (err) { return next(err); }
};

const getSubcategory = async (req, res, next) => {
    try {
        const subcategory = await db.Subcategory.findByPk(req.params.id);
        if (!subcategory) return next(new AppError('NOT_FOUND', 'Subcategory not found', 404));
        return sendSuccess(req, res, subcategory);
    } catch (err) { return next(err); }
};

const createSubcategory = async (req, res, next) => {
    try {
        const { name, slug, category_id } = req.body;
        if (!name || !slug || !category_id) return next(new AppError('BAD_REQUEST', 'name, slug, category_id are required', 400));
        const subcategory = await db.Subcategory.create({ name, slug, category_id });
        return sendSuccess(req, res, subcategory, 201);
    } catch (err) { return next(err); }
};

module.exports = { listSubcategories, getSubcategory, createSubcategory };

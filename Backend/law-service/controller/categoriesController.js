'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listCategories = async (req, res, next) => {
    try {
        const where = {};
        if (req.query.isActive !== 'false') where.is_active = true;
        const categories = await db.Category.findAll({
            where,
            order: [['name', 'ASC']],
            include: [{ model: db.Subcategory, as: 'subcategories', where: { is_active: true }, required: false }],
        });
        return sendSuccess(req, res, categories);
    } catch (err) { return next(err); }
};

const getCategory = async (req, res, next) => {
    try {
        const { slugOrId } = req.params;
        const where = isNaN(slugOrId) ? { slug: slugOrId } : { id: Number(slugOrId) };
        const category = await db.Category.findOne({
            where,
            include: [{ model: db.Subcategory, as: 'subcategories', where: { is_active: true }, required: false }],
        });
        if (!category) return next(new AppError('NOT_FOUND', 'Category not found', 404));
        return sendSuccess(req, res, category);
    } catch (err) { return next(err); }
};

const createCategory = async (req, res, next) => {
    try {
        const { name, slug, description, icon } = req.body;
        if (!name || !slug) return next(new AppError('BAD_REQUEST', 'name and slug are required', 400));
        const category = await db.Category.create({ name, slug, description, icon });
        return sendSuccess(req, res, category, 201);
    } catch (err) { return next(err); }
};

const updateCategory = async (req, res, next) => {
    try {
        const category = await db.Category.findByPk(req.params.id);
        if (!category) return next(new AppError('NOT_FOUND', 'Category not found', 404));
        await category.update(req.body);
        return sendSuccess(req, res, category);
    } catch (err) { return next(err); }
};

module.exports = { listCategories, getCategory, createCategory, updateCategory };

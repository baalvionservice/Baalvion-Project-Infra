'use strict';
const { sendSuccess } = require('../utils/response');
const categoryService = require('../service/categoryService');

const listCategories = async (req, res, next) => {
    try {
        const tree = await categoryService.listCategories(req.params.storeId);
        return sendSuccess(req, res, tree);
    } catch (err) { return next(err); }
};

const createCategory = async (req, res, next) => {
    try {
        const cat = await categoryService.createCategory(req.params.storeId, req.validated);
        return sendSuccess(req, res, cat, 201);
    } catch (err) { return next(err); }
};

const updateCategory = async (req, res, next) => {
    try {
        const cat = await categoryService.updateCategory(req.params.storeId, req.params.categoryId, req.validated);
        return sendSuccess(req, res, cat);
    } catch (err) { return next(err); }
};

const deleteCategory = async (req, res, next) => {
    try {
        await categoryService.deleteCategory(req.params.storeId, req.params.categoryId);
        return sendSuccess(req, res, null, 204);
    } catch (err) { return next(err); }
};

const reorderCategories = async (req, res, next) => {
    try {
        await categoryService.reorderCategories(req.params.storeId, req.validated.order);
        return sendSuccess(req, res, { message: 'Categories reordered' });
    } catch (err) { return next(err); }
};

module.exports = { listCategories, createCategory, updateCategory, deleteCategory, reorderCategories };

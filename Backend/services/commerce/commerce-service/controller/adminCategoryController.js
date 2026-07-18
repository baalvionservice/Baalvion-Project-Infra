'use strict';
// Cross-store category administration — for platform admins ("superadmin sees every detailing
// thing"). All mutations delegate to the SAME categoryService functions the store-scoped routes
// use (categoryRoutes.js/categoryController.js), just called with a storeId sourced from the
// request instead of the URL. This is not a parallel category system — one model, one service,
// two authorization paths (per-store content_editor/commerce_manager vs. platform admin).
const { sendSuccess, sendPaginated } = require('../utils/response');
const categoryService = require('../service/categoryService');

const listCategories = async (req, res, next) => {
    try {
        // Matches storeController.listStores' response shape exactly ({ success, data, pagination,
        // meta }) — same admin-list convention used across this service.
        const result = await categoryService.listCategoriesAcrossStores(req.validatedQuery || {});
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const createCategory = async (req, res, next) => {
    try {
        const { storeId, ...body } = req.validated;
        const cat = await categoryService.createCategory(storeId, body);
        return sendSuccess(req, res, cat, 201);
    } catch (err) { return next(err); }
};

const updateCategory = async (req, res, next) => {
    try {
        const { storeId, ...body } = req.validated;
        const cat = await categoryService.updateCategory(storeId, req.params.categoryId, body);
        return sendSuccess(req, res, cat);
    } catch (err) { return next(err); }
};

const deleteCategory = async (req, res, next) => {
    try {
        await categoryService.deleteCategory(req.validatedQuery.storeId, req.params.categoryId);
        return sendSuccess(req, res, null, 204);
    } catch (err) { return next(err); }
};

const reorderCategories = async (req, res, next) => {
    try {
        const { storeId, order } = req.validated;
        await categoryService.reorderCategories(storeId, order);
        return sendSuccess(req, res, { message: 'Categories reordered' });
    } catch (err) { return next(err); }
};

module.exports = { listCategories, createCategory, updateCategory, deleteCategory, reorderCategories };

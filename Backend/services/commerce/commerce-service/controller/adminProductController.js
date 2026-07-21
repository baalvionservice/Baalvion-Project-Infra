'use strict';
// Cross-store (platform-admin) product oversight. Read-only — mirrors adminCategoryController.js's
// listCategories exactly, just for products. Mutations still go through the store-scoped
// productRoutes.js (a platform admin acting on one store's catalog uses that route, same as any
// store_admin — there is no separate cross-store write path here, by design).
const { sendPaginated, sendSuccess } = require('../utils/response');
const productService = require('../service/productService');

const listProducts = async (req, res, next) => {
    try {
        const result = await productService.listProductsAcrossStores(req.validatedQuery || {});
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const listPending = async (req, res, next) => {
    try {
        const result = await productService.listPendingModeration(req.validatedQuery || {});
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const moderate = async (req, res, next) => {
    try {
        const { storeId, action, reason } = req.validated;
        const product = await productService.moderateProduct(storeId, req.params.productId, req.auth.userId, { action, reason });
        return sendSuccess(req, res, product);
    } catch (err) { return next(err); }
};

module.exports = { listProducts, listPending, moderate };

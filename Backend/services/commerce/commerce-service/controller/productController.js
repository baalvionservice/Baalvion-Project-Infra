'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const productService = require('../service/productService');
const { isMarketplaceSeller } = require('../middleware/marketplaceGuard');

const listProducts = async (req, res, next) => {
    try {
        // Never trust a client-supplied owner filter; on the marketplace a seller's list is always their own.
        const query = { ...req.query };
        delete query.ownerUserId;
        if (isMarketplaceSeller(req)) query.ownerUserId = String(req.auth.userId);
        const result = await productService.listProducts(req.params.storeId, query);
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getProduct = async (req, res, next) => {
    try {
        const product = await productService.getProduct(req.params.storeId, req.params.productId);
        return sendSuccess(req, res, product);
    } catch (err) { return next(err); }
};

const createProduct = async (req, res, next) => {
    try {
        const product = await productService.createProduct(req.params.storeId, req.auth.userId, req.validated);
        return sendSuccess(req, res, product, 201);
    } catch (err) { return next(err); }
};

const updateProduct = async (req, res, next) => {
    try {
        const product = await productService.updateProduct(req.params.storeId, req.params.productId, req.auth.userId, req.validated);
        return sendSuccess(req, res, product);
    } catch (err) { return next(err); }
};

const deleteProduct = async (req, res, next) => {
    try {
        await productService.deleteProduct(req.params.storeId, req.params.productId);
        return sendSuccess(req, res, null, 204);
    } catch (err) { return next(err); }
};

const publishProduct = async (req, res, next) => {
    try {
        const product = await productService.publishProduct(req.params.storeId, req.params.productId, req.auth.userId);
        return sendSuccess(req, res, product);
    } catch (err) { return next(err); }
};

const duplicateProduct = async (req, res, next) => {
    try {
        const product = await productService.duplicateProduct(req.params.storeId, req.params.productId, req.auth.userId);
        return sendSuccess(req, res, product, 201);
    } catch (err) { return next(err); }
};

const bulkUpdate = async (req, res, next) => {
    try {
        const result = await productService.bulkUpdate(req.params.storeId, req.auth.userId, req.validated, isMarketplaceSeller(req) ? { ownerUserId: req.auth.userId } : {});
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const importProducts = async (req, res, next) => {
    try {
        const result = await productService.importProducts(req.params.storeId, req.auth.userId, req.validated.rows);
        return sendSuccess(req, res, result, 201);
    } catch (err) { return next(err); }
};

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, publishProduct, duplicateProduct, bulkUpdate, importProducts };

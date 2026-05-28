'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const productService = require('../service/productService');

const listProducts = async (req, res, next) => {
    try {
        const result = await productService.listProducts(req.params.storeId, req.query);
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
        const result = await productService.bulkUpdate(req.params.storeId, req.auth.userId, req.validated);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, publishProduct, duplicateProduct, bulkUpdate };

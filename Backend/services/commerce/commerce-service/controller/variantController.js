'use strict';
const { sendSuccess } = require('../utils/response');
const variantService = require('../service/variantService');

const listVariants = async (req, res, next) => {
    try {
        const variants = await variantService.listVariants(req.params.storeId, req.params.productId);
        return sendSuccess(req, res, variants);
    } catch (err) { return next(err); }
};

const createVariant = async (req, res, next) => {
    try {
        const variant = await variantService.createVariant(req.params.storeId, req.params.productId, req.validated);
        return sendSuccess(req, res, variant, 201);
    } catch (err) { return next(err); }
};

const updateVariant = async (req, res, next) => {
    try {
        const variant = await variantService.updateVariant(req.params.storeId, req.params.productId, req.params.variantId, req.validated);
        return sendSuccess(req, res, variant);
    } catch (err) { return next(err); }
};

const deleteVariant = async (req, res, next) => {
    try {
        await variantService.deleteVariant(req.params.storeId, req.params.productId, req.params.variantId);
        return sendSuccess(req, res, null, 204);
    } catch (err) { return next(err); }
};

const upsertPricing = async (req, res, next) => {
    try {
        const pricing = await variantService.upsertPricing(req.params.storeId, req.params.productId, req.params.variantId || null, req.validated);
        return sendSuccess(req, res, pricing);
    } catch (err) { return next(err); }
};

module.exports = { listVariants, createVariant, updateVariant, deleteVariant, upsertPricing };

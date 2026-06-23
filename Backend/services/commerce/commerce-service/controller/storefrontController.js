'use strict';
const { sendSuccess } = require('../utils/response');
const storefront = require('../service/storefrontService');
const reviewService = require('../service/reviewService');
const presence = require('../service/presenceService');

const listProducts = async (req, res, next) => {
    try { return sendSuccess(req, res, await storefront.listProducts(req.params.storeId, req.query)); }
    catch (err) { return next(err); }
};

const getProduct = async (req, res, next) => {
    try { return sendSuccess(req, res, await storefront.getProduct(req.params.storeId, req.params.idOrSlug, req.query)); }
    catch (err) { return next(err); }
};

const listDepartments = async (req, res, next) => {
    try { return sendSuccess(req, res, await storefront.listDepartments(req.params.storeId)); }
    catch (err) { return next(err); }
};

const listCategories = async (req, res, next) => {
    try { return sendSuccess(req, res, await storefront.listCategories(req.params.storeId)); }
    catch (err) { return next(err); }
};

const listCollections = async (req, res, next) => {
    try { return sendSuccess(req, res, await storefront.listCollections(req.params.storeId)); }
    catch (err) { return next(err); }
};

const listReviews = async (req, res, next) => {
    try { return sendSuccess(req, res, await reviewService.listProductReviews(req.params.storeId, req.params.idOrSlug, req.query)); }
    catch (err) { return next(err); }
};

const listRelated = async (req, res, next) => {
    try { return sendSuccess(req, res, await storefront.listRelated(req.params.storeId, req.params.idOrSlug, req.query)); }
    catch (err) { return next(err); }
};

// Anonymous promo-code preview (no store role). Body is schema-validated upstream (req.validated).
const previewDiscount = async (req, res, next) => {
    try { return sendSuccess(req, res, await storefront.previewDiscount(req.params.storeId, req.validated)); }
    catch (err) { return next(err); }
};

// Anonymous live-presence beacon: record one visitor heartbeat, return the store's live count.
// Body is schema-validated upstream (req.validated.visitorId). Never errors over Redis (count→0).
const presenceHeartbeat = async (req, res, next) => {
    try { return sendSuccess(req, res, await presence.heartbeat(req.params.storeId, req.validated.visitorId)); }
    catch (err) { return next(err); }
};

// Current live visitor count for a store (read-only) — polled by the admin dashboard.
const presenceCount = async (req, res, next) => {
    try { return sendSuccess(req, res, await presence.count(req.params.storeId)); }
    catch (err) { return next(err); }
};

module.exports = { listProducts, getProduct, listDepartments, listCategories, listCollections, listReviews, listRelated, previewDiscount, presenceHeartbeat, presenceCount };

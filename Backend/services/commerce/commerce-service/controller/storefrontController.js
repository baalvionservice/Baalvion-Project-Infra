'use strict';
const { sendSuccess } = require('../utils/response');
const storefront = require('../service/storefrontService');

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

module.exports = { listProducts, getProduct, listDepartments, listCategories, listCollections };

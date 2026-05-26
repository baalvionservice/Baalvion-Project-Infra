'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const collectionService = require('../service/collectionService');

const listCollections = async (req, res, next) => {
    try {
        const result = await collectionService.listCollections(req.params.storeId, req.query);
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getCollection = async (req, res, next) => {
    try {
        const col = await collectionService.getCollection(req.params.storeId, req.params.collectionId);
        return sendSuccess(req, res, col);
    } catch (err) { return next(err); }
};

const createCollection = async (req, res, next) => {
    try {
        const col = await collectionService.createCollection(req.params.storeId, req.validated);
        return sendSuccess(req, res, col, 201);
    } catch (err) { return next(err); }
};

const updateCollection = async (req, res, next) => {
    try {
        const col = await collectionService.updateCollection(req.params.storeId, req.params.collectionId, req.validated);
        return sendSuccess(req, res, col);
    } catch (err) { return next(err); }
};

const deleteCollection = async (req, res, next) => {
    try {
        await collectionService.deleteCollection(req.params.storeId, req.params.collectionId);
        return sendSuccess(req, res, null, 204);
    } catch (err) { return next(err); }
};

const addProduct = async (req, res, next) => {
    try {
        const result = await collectionService.addProduct(req.params.storeId, req.params.collectionId, req.params.productId);
        return sendSuccess(req, res, result, 201);
    } catch (err) { return next(err); }
};

const removeProduct = async (req, res, next) => {
    try {
        await collectionService.removeProduct(req.params.storeId, req.params.collectionId, req.params.productId);
        return sendSuccess(req, res, null, 204);
    } catch (err) { return next(err); }
};

module.exports = { listCollections, getCollection, createCollection, updateCollection, deleteCollection, addProduct, removeProduct };

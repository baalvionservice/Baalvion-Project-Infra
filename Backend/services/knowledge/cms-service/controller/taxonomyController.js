'use strict';
const taxonomyService = require('../service/taxonomyService');
const { sendSuccess } = require('../utils/response');

const listCategories = async (req, res, next) => {
    try {
        const tree = await taxonomyService.listCategories(req.params.websiteId);
        return sendSuccess(req, res, tree);
    } catch (err) { return next(err); }
};

const createCategory = async (req, res, next) => {
    try {
        const cat = await taxonomyService.createCategory(req.params.websiteId, req.validated);
        return sendSuccess(req, res, cat, 201);
    } catch (err) { return next(err); }
};

const updateCategory = async (req, res, next) => {
    try {
        const cat = await taxonomyService.updateCategory(req.params.websiteId, req.params.categoryId, req.validated);
        return sendSuccess(req, res, cat);
    } catch (err) { return next(err); }
};

const deleteCategory = async (req, res, next) => {
    try {
        await taxonomyService.deleteCategory(req.params.websiteId, req.params.categoryId);
        return sendSuccess(req, res, null);
    } catch (err) { return next(err); }
};

const reorderCategories = async (req, res, next) => {
    try {
        await taxonomyService.reorderCategories(req.params.websiteId, req.validated.order);
        return sendSuccess(req, res, null);
    } catch (err) { return next(err); }
};

const listTags = async (req, res, next) => {
    try {
        const tags = await taxonomyService.listTags(req.params.websiteId);
        return sendSuccess(req, res, tags);
    } catch (err) { return next(err); }
};

const createTag = async (req, res, next) => {
    try {
        const tag = await taxonomyService.createTag(req.params.websiteId, req.validated);
        return sendSuccess(req, res, tag, 201);
    } catch (err) { return next(err); }
};

const updateTag = async (req, res, next) => {
    try {
        const tag = await taxonomyService.updateTag(req.params.websiteId, req.params.tagId, req.validated);
        return sendSuccess(req, res, tag);
    } catch (err) { return next(err); }
};

const deleteTag = async (req, res, next) => {
    try {
        await taxonomyService.deleteTag(req.params.websiteId, req.params.tagId);
        return sendSuccess(req, res, null);
    } catch (err) { return next(err); }
};

module.exports = { listCategories, createCategory, updateCategory, deleteCategory, reorderCategories, listTags, createTag, updateTag, deleteTag };

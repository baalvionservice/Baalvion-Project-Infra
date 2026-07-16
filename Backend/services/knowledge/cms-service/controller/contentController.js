'use strict';
const contentService = require('../service/contentService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const list = async (req, res, next) => {
    try {
        const result = await contentService.listContent(req.params.websiteId, req.query);
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const content = await contentService.createContent(req.params.websiteId, req.user.id, req.validated);
        return sendSuccess(req, res, content, 201);
    } catch (err) { return next(err); }
};

const getOne = async (req, res, next) => {
    try {
        const content = await contentService.getContent(req.params.websiteId, req.params.contentId);
        return sendSuccess(req, res, content);
    } catch (err) { return next(err); }
};

const getPreviewToken = async (req, res, next) => {
    try {
        const result = await contentService.getPreviewToken(req.params.websiteId, req.params.contentId);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const content = await contentService.updateContent(req.params.websiteId, req.params.contentId, req.user.id, req.validated);
        return sendSuccess(req, res, content);
    } catch (err) { return next(err); }
};

const autosave = async (req, res, next) => {
    try {
        const result = await contentService.autosaveContent(req.params.websiteId, req.params.contentId, req.user.id, req.validated);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const duplicate = async (req, res, next) => {
    try {
        const content = await contentService.duplicateContent(req.params.websiteId, req.params.contentId, req.user.id);
        return sendSuccess(req, res, content, 201);
    } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
    try {
        await contentService.deleteContent(req.params.websiteId, req.params.contentId);
        return sendSuccess(req, res, null);
    } catch (err) { return next(err); }
};

const bulk = async (req, res, next) => {
    try {
        const result = await contentService.bulkUpdate(req.params.websiteId, req.user.id, req.validated);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const listDeletionRequests = async (req, res, next) => {
    try {
        const result = await contentService.listDeletionRequests(req.params.websiteId);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const requestDeletion = async (req, res, next) => {
    try {
        const content = await contentService.requestDeletion(req.params.websiteId, req.params.contentId, req.user.id, req.validated?.note);
        return sendSuccess(req, res, content);
    } catch (err) { return next(err); }
};

const dismissDeletionRequest = async (req, res, next) => {
    try {
        const content = await contentService.dismissDeletionRequest(req.params.websiteId, req.params.contentId);
        return sendSuccess(req, res, content);
    } catch (err) { return next(err); }
};

module.exports = {
    list, create, getOne, getPreviewToken, update, autosave, duplicate, remove, bulk,
    listDeletionRequests, requestDeletion, dismissDeletionRequest,
};

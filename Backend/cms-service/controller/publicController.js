'use strict';
const publicService = require('../service/publicService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getWebsiteInfo = async (req, res, next) => {
    try {
        const info = await publicService.getPublicWebsiteInfo(req.params.websiteSlug);
        return sendSuccess(req, res, info);
    } catch (err) { return next(err); }
};

const listContent = async (req, res, next) => {
    try {
        const result = await publicService.listPublicContent(req.params.websiteSlug, req.query);
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getContent = async (req, res, next) => {
    try {
        const content = await publicService.getPublicContent(req.params.websiteSlug, req.params.slug);
        return sendSuccess(req, res, content);
    } catch (err) { return next(err); }
};

const getCategory = async (req, res, next) => {
    try {
        const category = await publicService.getPublicCategory(req.params.websiteSlug, req.params.categorySlug);
        return sendSuccess(req, res, category);
    } catch (err) { return next(err); }
};

module.exports = { getWebsiteInfo, listContent, getContent, getCategory };

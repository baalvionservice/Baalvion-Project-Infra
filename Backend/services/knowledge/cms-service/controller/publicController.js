'use strict';
const publicService = require('../service/publicService');
const engagementService = require('../service/engagementService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getWebsiteInfo = async (req, res, next) => {
    try {
        const info = await publicService.getPublicWebsiteInfo(req.params.websiteSlug);
        return sendSuccess(req, res, info);
    } catch (err) { return next(err); }
};

const listContent = async (req, res, next) => {
    try {
        const callerId = req.auth && req.auth.userId;
        const result = await publicService.listPublicContent(req.params.websiteSlug, req.query, { callerId });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getContent = async (req, res, next) => {
    try {
        const callerId = req.auth && req.auth.userId;
        const content = await publicService.getPublicContent(req.params.websiteSlug, req.params.slug, { callerId });
        return sendSuccess(req, res, content);
    } catch (err) { return next(err); }
};

const getPreviewContent = async (req, res, next) => {
    try {
        const { exp, token } = req.query;
        const content = await publicService.getPreviewContent(req.params.websiteSlug, req.params.slug, exp, token);
        return sendSuccess(req, res, content);
    } catch (err) { return next(err); }
};

const getCategory = async (req, res, next) => {
    try {
        const category = await publicService.getPublicCategory(req.params.websiteSlug, req.params.categorySlug);
        return sendSuccess(req, res, category);
    } catch (err) { return next(err); }
};

const listAuthors = async (req, res, next) => {
    try {
        const authors = await publicService.listPublicAuthors(req.params.websiteSlug);
        return sendSuccess(req, res, authors);
    } catch (err) { return next(err); }
};

const getAuthor = async (req, res, next) => {
    try {
        const author = await publicService.getPublicAuthor(req.params.websiteSlug, req.params.slug);
        return sendSuccess(req, res, author);
    } catch (err) { return next(err); }
};

const listComments = async (req, res, next) => {
    try {
        const comments = await engagementService.listComments(req.params.websiteSlug, req.params.slug);
        return sendSuccess(req, res, comments);
    } catch (err) { return next(err); }
};

const submitComment = async (req, res, next) => {
    try {
        const result = await engagementService.submitComment(req.params.websiteSlug, req.params.slug, req.validated);
        return sendSuccess(req, res, result, 201);
    } catch (err) { return next(err); }
};

const getFeedback = async (req, res, next) => {
    try {
        const summary = await engagementService.getFeedbackSummary(req.params.websiteSlug, req.params.slug);
        return sendSuccess(req, res, summary);
    } catch (err) { return next(err); }
};

const submitFeedback = async (req, res, next) => {
    try {
        const summary = await engagementService.submitFeedback(req.params.websiteSlug, req.params.slug, req.validated);
        return sendSuccess(req, res, summary);
    } catch (err) { return next(err); }
};

module.exports = {
    getWebsiteInfo, listContent, getContent, getPreviewContent, getCategory, listAuthors, getAuthor,
    listComments, submitComment, getFeedback, submitFeedback,
};

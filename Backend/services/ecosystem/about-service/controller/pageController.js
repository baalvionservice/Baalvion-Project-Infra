'use strict';
const pageService = require('../service/pageService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createPageSchema, updatePageSchema, paginationSchema } = require('../validators/schemas');

const listPages = async (req, res, next) => {
    try {
        const parsed = paginationSchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await pageService.listPages(parsed.data);
        return sendPaginated(req, res, data);
    } catch (err) { return next(err); }
};

const createPage = async (req, res, next) => {
    try {
        const parsed = createPageSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await pageService.createPage(req.user.id, parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

const getPageBySlug = async (req, res, next) => {
    try {
        const data = await pageService.getPageBySlug(req.params.slug);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const getPageById = async (req, res, next) => {
    try {
        const data = await pageService.getPageById(req.params.id);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const updatePage = async (req, res, next) => {
    try {
        const parsed = updatePageSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await pageService.updatePage(req.params.id, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const deletePage = async (req, res, next) => {
    try {
        await pageService.deletePage(req.params.id);
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

const publishPage = async (req, res, next) => {
    try {
        const data = await pageService.publishPage(req.params.id);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

module.exports = { listPages, createPage, getPageBySlug, getPageById, updatePage, deletePage, publishPage };

'use strict';
const newsService = require('../service/newsService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createNewsPostSchema, updateNewsPostSchema, newsListQuerySchema } = require('../validators/schemas');

const listNewsPosts = async (req, res, next) => {
    try {
        const parsed = newsListQuerySchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await newsService.listNewsPosts(parsed.data);
        return sendPaginated(req, res, data);
    } catch (err) { return next(err); }
};

const createNewsPost = async (req, res, next) => {
    try {
        const parsed = createNewsPostSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await newsService.createNewsPost(req.user.id, parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

const getPostBySlug = async (req, res, next) => {
    try {
        const data = await newsService.getPostBySlug(req.params.slug);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const getPostById = async (req, res, next) => {
    try {
        const data = await newsService.getPostById(req.params.id);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const updatePost = async (req, res, next) => {
    try {
        const parsed = updateNewsPostSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await newsService.updatePost(req.params.id, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const deletePost = async (req, res, next) => {
    try {
        await newsService.deletePost(req.params.id);
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

const publishPost = async (req, res, next) => {
    try {
        const data = await newsService.publishPost(req.params.id);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

module.exports = { listNewsPosts, createNewsPost, getPostBySlug, getPostById, updatePost, deletePost, publishPost };

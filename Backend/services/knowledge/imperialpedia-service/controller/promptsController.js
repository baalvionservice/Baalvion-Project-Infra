'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createPromptSchema, updatePromptSchema } = require('../validators/schemas');

const PRIVILEGED_ROLES = ['admin', 'owner', 'super_admin'];
const isPrivilegedCaller = (req) => ((req.auth && req.auth.roles) || []).some((r) => PRIVILEGED_ROLES.includes(r));

const buildPagination = (total, page, limit) => ({ total, page, limit, totalPages: Math.ceil(total / limit) });

const validate = (schema, data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
        const err = new AppError('VALIDATION_ERROR', 'Validation failed', 400);
        err.details = result.error.flatten();
        throw err;
    }
    return result.data;
};

// GET /prompts — powers both /prompts (full directory) and /trending-prompts (?trending=true)
// on the site; public sees only active, staff (admin/owner/super_admin) can pass ?status=all
// for moderation. ?trending=true orders by trending_order (curated), otherwise newest first.
const listPrompts = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 24));
        const offset = (page - 1) * limit;
        const where = {};

        const isPrivileged = isPrivilegedCaller(req);
        if (req.query.status && isPrivileged) {
            const requestedStatus = String(req.query.status);
            if (requestedStatus !== 'all') where.status = requestedStatus;
        } else {
            where.status = 'active';
        }
        if (req.query.category) where.category = req.query.category;
        if (req.query.tag) where.tags = { [Op.contains]: [req.query.tag] };

        const trendingOnly = String(req.query.trending).toLowerCase() === 'true';
        const order = trendingOnly
            ? [['trending_order', 'ASC'], ['created_at', 'DESC']]
            : [['created_at', 'DESC']];
        if (trendingOnly) where.is_trending = true;

        const { count, rows } = await db.Prompt.findAndCountAll({ where, limit, offset, order });

        return sendPaginated(req, res, { items: rows, pagination: buildPagination(count, page, limit) });
    } catch (err) { return next(err); }
};

// GET /prompts/:slug — public roundup-post detail page (all `items` inline). Bumps
// views_count (best-effort, not awaited-blocking the response) same as a lightweight
// page-view counter, not a unique-visitor metric.
const getPromptBySlug = async (req, res, next) => {
    try {
        const isPrivileged = isPrivilegedCaller(req);
        const where = { slug: req.params.slug };
        if (!isPrivileged) where.status = 'active';

        const prompt = await db.Prompt.findOne({ where });
        if (!prompt) return next(new AppError('NOT_FOUND', 'Prompt not found', 404));

        prompt.increment('views_count').catch(() => {});
        return sendSuccess(req, res, prompt);
    } catch (err) { return next(err); }
};

// POST /prompts/:slug/copy — public, fire-and-forget copy counter for the "Copy prompt" button.
// Not broken out per item within the post — see copies_count on the model.
const recordPromptCopy = async (req, res, next) => {
    try {
        const prompt = await db.Prompt.findOne({ where: { slug: req.params.slug, status: 'active' } });
        if (!prompt) return next(new AppError('NOT_FOUND', 'Prompt not found', 404));
        await prompt.increment('copies_count');
        return sendSuccess(req, res, { copies_count: prompt.copies_count + 1 });
    } catch (err) { return next(err); }
};

// POST /prompts — staff only, same editorial-only reasoning as affiliate products.
const createPrompt = async (req, res, next) => {
    try {
        if (!isPrivilegedCaller(req)) return next(new AppError('FORBIDDEN', 'Not authorized', 403));
        const data = validate(createPromptSchema, req.body);
        const prompt = await db.Prompt.create(data);
        return sendSuccess(req, res, prompt, 201);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return next(new AppError('CONFLICT', 'A prompt with this slug already exists', 409));
        }
        return next(err);
    }
};

// GET /prompts/id/:id — staff only lookup by primary key, for the admin edit form.
const getPromptById = async (req, res, next) => {
    try {
        if (!isPrivilegedCaller(req)) return next(new AppError('FORBIDDEN', 'Not authorized', 403));
        const prompt = await db.Prompt.findByPk(req.params.id);
        if (!prompt) return next(new AppError('NOT_FOUND', 'Prompt not found', 404));
        return sendSuccess(req, res, prompt);
    } catch (err) { return next(err); }
};

// PATCH /prompts/:id — staff only.
const updatePrompt = async (req, res, next) => {
    try {
        if (!isPrivilegedCaller(req)) return next(new AppError('FORBIDDEN', 'Not authorized', 403));
        const prompt = await db.Prompt.findByPk(req.params.id);
        if (!prompt) return next(new AppError('NOT_FOUND', 'Prompt not found', 404));

        const data = validate(updatePromptSchema, req.body);
        await prompt.update(data);
        return sendSuccess(req, res, prompt);
    } catch (err) { return next(err); }
};

// DELETE /prompts/:id — staff only, soft (archive) — mirrors deleteAffiliateProduct.
const deletePrompt = async (req, res, next) => {
    try {
        if (!isPrivilegedCaller(req)) return next(new AppError('FORBIDDEN', 'Not authorized', 403));
        const prompt = await db.Prompt.findByPk(req.params.id);
        if (!prompt) return next(new AppError('NOT_FOUND', 'Prompt not found', 404));

        await prompt.update({ status: 'archived' });
        return sendSuccess(req, res, { message: 'Prompt archived' });
    } catch (err) { return next(err); }
};

module.exports = {
    listPrompts,
    getPromptBySlug,
    recordPromptCopy,
    createPrompt,
    getPromptById,
    updatePrompt,
    deletePrompt,
};

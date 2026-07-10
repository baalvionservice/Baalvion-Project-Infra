'use strict';
const { z } = require('zod');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

const CATEGORIES = ['AI', 'Technology', 'Business', 'Finance', 'Startups', 'Cybersecurity', 'World', 'Science'];

const createSchema = z.object({
    name: z.string().trim().min(1).max(200),
    type: z.enum(['rss', 'press_release', 'government']).default('rss'),
    feed_url: z.string().trim().url(),
    country: z.string().trim().length(2).optional(),
    language: z.string().trim().max(10).default('en'),
    default_category: z.enum(CATEGORIES),
    poll_interval_minutes: z.coerce.number().int().min(1).max(1440).default(15),
});

const updateSchema = createSchema.partial().extend({
    is_active: z.boolean().optional(),
});

async function list(req, res, next) {
    try {
        const sources = await db.Source.findAll({ order: [['name', 'ASC']] });
        return sendSuccess(req, res, sources);
    } catch (err) {
        return next(err);
    }
}

async function create(req, res, next) {
    try {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError('INVALID_BODY', 'Invalid source payload', 400, parsed.error.flatten());
        const source = await db.Source.create(parsed.data);
        return sendSuccess(req, res, source, 201);
    } catch (err) {
        return next(err);
    }
}

async function update(req, res, next) {
    try {
        const parsed = updateSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError('INVALID_BODY', 'Invalid source payload', 400, parsed.error.flatten());
        const source = await db.Source.findByPk(req.params.id);
        if (!source) throw new AppError('NOT_FOUND', 'Source not found', 404);
        await source.update(parsed.data);
        return sendSuccess(req, res, source);
    } catch (err) {
        return next(err);
    }
}

async function remove(req, res, next) {
    try {
        const source = await db.Source.findByPk(req.params.id);
        if (!source) throw new AppError('NOT_FOUND', 'Source not found', 404);
        await source.destroy();
        return sendSuccess(req, res, { id: req.params.id });
    } catch (err) {
        return next(err);
    }
}

module.exports = { list, create, update, remove };

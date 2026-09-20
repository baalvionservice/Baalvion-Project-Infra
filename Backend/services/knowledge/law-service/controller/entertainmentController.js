'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const publicWhere = { published: true, archived: false };
const cache = (res) => res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

const listPublished = async (req, res, next) => {
    try {
        const rows = await db.EntertainmentEntity.findAll({ where: publicWhere, order: [['title', 'ASC']], limit: 5000 });
        cache(res);
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

const getPublished = async (req, res, next) => {
    try {
        const row = await db.EntertainmentEntity.findOne({ where: { ...publicWhere, slug: req.params.slug } });
        if (!row) return next(new AppError('NOT_FOUND', 'Entry not found', 404));
        cache(res);
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
};

/** Slugs an editor has archived; the site hides its bundled copy of these. */
const hiddenSlugs = async (req, res, next) => {
    try {
        const rows = await db.EntertainmentEntity.findAll({ where: { archived: true }, attributes: ['slug'] });
        cache(res);
        return sendSuccess(req, res, rows.map((r) => r.slug));
    } catch (err) { return next(err); }
};

module.exports = { listPublished, getPublished, hiddenSlugs };

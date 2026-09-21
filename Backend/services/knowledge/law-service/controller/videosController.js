'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const live = { published: true, archived: false };
const cache = (res) => res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

/** One call for the whole hub: live shows plus live videos, newest first. */
const hub = async (req, res, next) => {
    try {
        const [shows, videos] = await Promise.all([
            db.VideoShow.findAll({ where: live, order: [['sort_order', 'ASC'], ['name', 'ASC']], limit: 500 }),
            db.VideoItem.findAll({ where: live, order: [['published_at', 'DESC NULLS LAST'], ['id', 'DESC']], limit: 2000 }),
        ]);
        cache(res); return sendSuccess(req, res, { shows, videos });
    } catch (err) { return next(err); }
};
const getVideo = async (req, res, next) => {
    try {
        const row = await db.VideoItem.findOne({ where: { ...live, slug: req.params.slug } });
        if (!row) return next(new AppError('NOT_FOUND', 'Video not found', 404));
        cache(res); return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
};

module.exports = { hub, getVideo };

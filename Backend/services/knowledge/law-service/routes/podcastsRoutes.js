'use strict';
const router = require('express').Router();
const db = require('../models');
const { sendSuccess } = require('../utils/response');

// Public, unauthenticated read of published shows only: ranked first, then A–Z.
router.get('/', async (req, res, next) => {
    try {
        const rows = await db.PodcastShow.findAll({ where: { published: true, archived: false }, order: [['rank', 'ASC NULLS LAST'], ['title', 'ASC']], limit: 500 });
        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
});

module.exports = router;

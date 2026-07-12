'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess } = require('../utils/response');

// Real counts + a real recent-article list with their actual extracted source image URLs
// (or null) — no CDN, no placeholder thumbnails. See collectors/feedParser.js for the real
// enclosure/media:content/media:thumbnail/<img> extraction that populates image_url.
async function getOverview(req, res, next) {
    try {
        const [withImage, withoutImage, recent] = await Promise.all([
            db.Article.count({ where: { image_url: { [Op.not]: null } } }),
            db.Article.count({ where: { image_url: { [Op.is]: null } } }),
            db.Article.findAll({
                order: [['ingested_at', 'DESC']],
                limit: 60,
                attributes: ['id', 'title', 'url', 'image_url', 'category', 'published_at'],
            }),
        ]);

        return sendSuccess(req, res, {
            withImage,
            withoutImage,
            coveragePct: withImage + withoutImage > 0 ? Math.round((withImage / (withImage + withoutImage)) * 1000) / 10 : 0,
            recent: recent.map((a) => ({
                id: a.id,
                title: a.title,
                url: a.url,
                imageUrl: a.image_url,
                category: a.category,
                publishedAt: a.published_at,
            })),
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = { getOverview };

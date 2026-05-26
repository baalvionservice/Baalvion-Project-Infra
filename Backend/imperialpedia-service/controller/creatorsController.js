'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const buildPagination = (total, page, limit) => ({
    total, page, limit, totalPages: Math.ceil(total / limit),
});

// GET /creators — public, ordered by reputation_score DESC
const listCreators = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const where = {};

        if (req.query.is_verified !== undefined) {
            where.is_verified = req.query.is_verified === 'true';
        }

        const { count, rows } = await db.CreatorProfile.findAndCountAll({
            where,
            limit,
            offset,
            order: [['reputation_score', 'DESC']],
        });

        return sendPaginated(req, res, { items: rows, pagination: buildPagination(count, page, limit) });
    } catch (err) { return next(err); }
};

// GET /creators/:userId — public
const getCreator = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.userId);
        const creator = await db.CreatorProfile.findOne({ where: { user_id: userId } });
        if (!creator) return next(new AppError('NOT_FOUND', 'Creator profile not found', 404));

        // Include recent articles
        const recentArticles = await db.Article.findAll({
            where: { author_id: userId, status: 'published' },
            limit: 5,
            order: [['published_at', 'DESC']],
        });

        return sendSuccess(req, res, { ...creator.toJSON(), recent_articles: recentArticles });
    } catch (err) { return next(err); }
};

// POST /creators/me — auth, upsert creator profile for req.user.id
const updateCreator = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { display_name, bio, avatar_url, specialization, social_links } = req.body;

        const [profile, created] = await db.CreatorProfile.findOrCreate({
            where: { user_id: userId },
            defaults: {
                user_id: userId,
                display_name: display_name || null,
                bio: bio || null,
                avatar_url: avatar_url || null,
                specialization: specialization || [],
                social_links: social_links || {},
            },
        });

        if (!created) {
            const updates = {};
            if (display_name !== undefined) updates.display_name = display_name;
            if (bio !== undefined) updates.bio = bio;
            if (avatar_url !== undefined) updates.avatar_url = avatar_url;
            if (specialization !== undefined) updates.specialization = specialization;
            if (social_links !== undefined) updates.social_links = social_links;
            await profile.update(updates);
        }

        return sendSuccess(req, res, profile, created ? 201 : 200);
    } catch (err) { return next(err); }
};

// GET /creators/:userId/articles — public
const getCreatorArticles = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.userId);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;

        const { count, rows } = await db.Article.findAndCountAll({
            where: { author_id: userId, status: 'published' },
            limit,
            offset,
            order: [['published_at', 'DESC']],
        });

        return sendPaginated(req, res, { items: rows, pagination: buildPagination(count, page, limit) });
    } catch (err) { return next(err); }
};

module.exports = { listCreators, getCreator, updateCreator, getCreatorArticles };

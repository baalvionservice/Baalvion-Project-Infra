'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

// GET /leaderboard — public
const getLeaderboard = async (req, res, next) => {
    try {
        const period = req.query.period || 'monthly';
        const validPeriods = ['weekly', 'monthly', 'alltime'];
        if (!validPeriods.includes(period)) {
            return next(new AppError('VALIDATION_ERROR', 'Invalid period. Must be weekly, monthly, or alltime', 400));
        }

        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));

        const entries = await db.LeaderboardEntry.findAll({
            where: { period },
            order: [['rank', 'ASC']],
            limit,
        });

        return sendSuccess(req, res, { period, entries });
    } catch (err) { return next(err); }
};

// POST /leaderboard/refresh — auth, admin only
const refreshLeaderboard = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return next(new AppError('FORBIDDEN', 'Admin access required', 403));
        }

        const period = req.body.period || 'monthly';
        const validPeriods = ['weekly', 'monthly', 'alltime'];
        if (!validPeriods.includes(period)) {
            return next(new AppError('VALIDATION_ERROR', 'Invalid period', 400));
        }

        // Build date filter for period
        const now = new Date();
        let dateFilter = {};
        if (period === 'weekly') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFilter = { published_at: { [Op.gte]: weekAgo } };
        } else if (period === 'monthly') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            dateFilter = { published_at: { [Op.gte]: monthAgo } };
        }
        // alltime: no filter

        // Aggregate articles by author_id
        const [results] = await db.sequelize.query(`
            SELECT
                author_id AS user_id,
                author_name AS display_name,
                COUNT(*) AS articles_count,
                COALESCE(SUM(views_count), 0) AS views_total,
                COALESCE(SUM(likes_count), 0) AS likes_total,
                COALESCE(SUM(views_count), 0) * 1.0 + COALESCE(SUM(likes_count), 0) * 5.0 AS score
            FROM imperialpedia.articles
            WHERE status = 'published'
            ${period === 'weekly' ? "AND published_at >= NOW() - INTERVAL '7 days'" : ''}
            ${period === 'monthly' ? "AND published_at >= NOW() - INTERVAL '30 days'" : ''}
            GROUP BY author_id, author_name
            ORDER BY score DESC
            LIMIT 100
        `);

        let rank = 1;
        for (const row of results) {
            if (!row.user_id) continue;

            // Try to get avatar from creator profile
            const creator = await db.CreatorProfile.findOne({ where: { user_id: row.user_id } });

            await db.LeaderboardEntry.upsert({
                user_id: row.user_id,
                display_name: creator ? creator.display_name : (row.display_name || null),
                avatar_url: creator ? creator.avatar_url : null,
                period,
                score: parseFloat(row.score) || 0,
                rank,
                articles_count: parseInt(row.articles_count) || 0,
                views_total: parseInt(row.views_total) || 0,
                likes_total: parseInt(row.likes_total) || 0,
            });
            rank++;
        }

        return sendSuccess(req, res, { message: `Leaderboard refreshed for period: ${period}`, count: results.length });
    } catch (err) { return next(err); }
};

module.exports = { getLeaderboard, refreshLeaderboard };

'use strict';
const { Op, fn, col, literal } = require('sequelize');
const db = require('../models');
const { sendSuccess } = require('../utils/response');

// GET /analytics/content — auth
const getContentAnalytics = async (req, res, next) => {
    try {
        // Article count by category
        const [byCategory] = await db.sequelize.query(`
            SELECT category, COUNT(*) AS count
            FROM imperialpedia.articles
            WHERE status = 'published'
            GROUP BY category
            ORDER BY count DESC
        `);

        // Top articles by views
        const topByViews = await db.Article.findAll({
            where: { status: 'published' },
            order: [['views_count', 'DESC']],
            limit: 10,
            attributes: ['id', 'title', 'slug', 'category', 'views_count', 'likes_count', 'author_name', 'published_at'],
        });

        // Top articles by likes
        const topByLikes = await db.Article.findAll({
            where: { status: 'published' },
            order: [['likes_count', 'DESC']],
            limit: 10,
            attributes: ['id', 'title', 'slug', 'category', 'views_count', 'likes_count', 'author_name', 'published_at'],
        });

        // Recent articles
        const recent = await db.Article.findAll({
            where: { status: 'published' },
            order: [['published_at', 'DESC']],
            limit: 10,
            attributes: ['id', 'title', 'slug', 'category', 'views_count', 'likes_count', 'author_name', 'published_at'],
        });

        // Total stats
        const [[totals]] = await db.sequelize.query(`
            SELECT
                COUNT(*) AS total_articles,
                COALESCE(SUM(views_count), 0) AS total_views,
                COALESCE(SUM(likes_count), 0) AS total_likes
            FROM imperialpedia.articles
            WHERE status = 'published'
        `);

        return sendSuccess(req, res, {
            totals: {
                articles: parseInt(totals.total_articles) || 0,
                views: parseInt(totals.total_views) || 0,
                likes: parseInt(totals.total_likes) || 0,
            },
            by_category: byCategory,
            top_by_views: topByViews,
            top_by_likes: topByLikes,
            recent_activity: recent,
        });
    } catch (err) { return next(err); }
};

// GET /analytics/community — auth
const getCommunityAnalytics = async (req, res, next) => {
    try {
        // Posts count by category
        const [byCategory] = await db.sequelize.query(`
            SELECT category, COUNT(*) AS count
            FROM imperialpedia.community_posts
            WHERE status = 'active'
            GROUP BY category
            ORDER BY count DESC
        `);

        // Average votes per post
        const [[voteStats]] = await db.sequelize.query(`
            SELECT
                COUNT(*) AS total_posts,
                COALESCE(AVG(upvotes), 0) AS avg_upvotes,
                COALESCE(AVG(downvotes), 0) AS avg_downvotes,
                COALESCE(AVG(comments_count), 0) AS avg_comments
            FROM imperialpedia.community_posts
            WHERE status = 'active'
        `);

        // Active users (unique authors in last 30 days)
        const [[activeUsers]] = await db.sequelize.query(`
            SELECT COUNT(DISTINCT author_id) AS active_users
            FROM imperialpedia.community_posts
            WHERE status = 'active'
            AND created_at >= NOW() - INTERVAL '30 days'
        `);

        // Most active posts
        const topPosts = await db.CommunityPost.findAll({
            where: { status: 'active' },
            order: [['upvotes', 'DESC'], ['comments_count', 'DESC']],
            limit: 10,
            attributes: ['id', 'title', 'category', 'upvotes', 'downvotes', 'comments_count', 'author_name', 'created_at'],
        });

        // Recent posts
        const recentPosts = await db.CommunityPost.findAll({
            where: { status: 'active' },
            order: [['created_at', 'DESC']],
            limit: 10,
            attributes: ['id', 'title', 'category', 'upvotes', 'comments_count', 'author_name', 'created_at'],
        });

        return sendSuccess(req, res, {
            totals: {
                posts: parseInt(voteStats.total_posts) || 0,
                active_users_30d: parseInt(activeUsers.active_users) || 0,
                avg_upvotes: parseFloat(parseFloat(voteStats.avg_upvotes).toFixed(2)),
                avg_downvotes: parseFloat(parseFloat(voteStats.avg_downvotes).toFixed(2)),
                avg_comments: parseFloat(parseFloat(voteStats.avg_comments).toFixed(2)),
            },
            by_category: byCategory,
            top_posts: topPosts,
            recent_posts: recentPosts,
        });
    } catch (err) { return next(err); }
};

module.exports = { getContentAnalytics, getCommunityAnalytics };

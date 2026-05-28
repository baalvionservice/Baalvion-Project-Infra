'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { MarketNews } = db;
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');

const listNews = async (req, res, next) => {
    try {
        const { categories, symbols, sentiment, page = 1, limit = 20 } = req.query;
        const where = {};
        if (sentiment) where.sentiment = sentiment;
        if (categories) where.categories = { [Op.contains]: Array.isArray(categories) ? categories : [categories] };
        if (symbols) {
            const symList = Array.isArray(symbols) ? symbols : [symbols];
            where.symbols = { [Op.contains]: symList };
        }
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await MarketNews.findAndCountAll({
            where,
            order: [['published_at', 'DESC']],
            limit: parseInt(limit),
            offset,
        });
        const totalPages = Math.ceil(count / parseInt(limit));
        return sendPaginated(req, res, { items: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages } });
    } catch (err) { return next(err); }
};

const createNews = async (req, res, next) => {
    try {
        const { headline, summary, source, url, symbols, categories, sentiment, published_at } = req.body;
        if (!headline || !published_at) return next(new AppError('VALIDATION_ERROR', 'headline and published_at are required', 400));
        const news = await MarketNews.create({
            headline, summary, source, url,
            symbols: symbols || [],
            categories: categories || [],
            sentiment: sentiment || 'neutral',
            published_at: new Date(published_at),
        });
        return sendSuccess(req, res, news, 201);
    } catch (err) { return next(err); }
};

const getNews = async (req, res, next) => {
    try {
        const news = await MarketNews.findByPk(req.params.id);
        if (!news) return next(new AppError('NOT_FOUND', 'News not found', 404));
        return sendSuccess(req, res, news);
    } catch (err) { return next(err); }
};

module.exports = { listNews, createNews, getNews };

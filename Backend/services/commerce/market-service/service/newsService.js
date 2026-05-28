'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');

const listNews = async ({ page, limit, symbol, category }) => {
    const offset = (page - 1) * limit;
    const where = {};
    if (symbol) {
        where.related_symbols = { [Op.contains]: [symbol] };
    }
    if (category) {
        where.categories = { [Op.contains]: [category] };
    }
    const { count, rows } = await db.MarketNews.findAndCountAll({
        where,
        order: [['published_at', 'DESC']],
        limit,
        offset,
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const createNews = async (data) => {
    return db.MarketNews.create(data);
};

module.exports = { listNews, createNews };

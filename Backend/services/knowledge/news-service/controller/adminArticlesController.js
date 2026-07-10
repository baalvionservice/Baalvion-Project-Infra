'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

// list/getTrending reuse the exact same query logic as the public API (controller/newsController.js) —
// neither depends on req.apiKey, so no duplication needed. remove() is admin-only moderation.
async function remove(req, res, next) {
    try {
        const article = await db.Article.findByPk(req.params.id);
        if (!article) throw new AppError('NOT_FOUND', 'Article not found', 404);
        await article.destroy();
        return sendSuccess(req, res, { id: req.params.id });
    } catch (err) {
        return next(err);
    }
}

module.exports = { remove };

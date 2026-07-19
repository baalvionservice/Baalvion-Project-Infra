'use strict';
const { listContentFeed } = require('../service/contentFeedService');
const { sendSuccess } = require('../utils/response');

// INTERNAL — see service/contentFeedService.js for why this is unredacted and internal-only.
const getContentFeed = async (req, res, next) => {
    try {
        const result = await listContentFeed(req.params.websiteSlug, { limit: req.query.limit, offset: req.query.offset });
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

module.exports = { getContentFeed };

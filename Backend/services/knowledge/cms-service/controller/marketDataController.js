'use strict';
const marketDataService = require('../service/marketDataService');
const { sendSuccess } = require('../utils/response');

const getOverview = async (req, res, next) => {
    try {
        // Optional — when provided, stock cards get their top 3 related Imperialpedia
        // articles attached. Omitted entirely degrades gracefully (relatedNews: []).
        const data = await marketDataService.getOverview(req.query.websiteId);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const getQuote = async (req, res, next) => {
    try {
        const data = await marketDataService.getQuote(req.params.symbol, req.query.websiteId, req.query.range);
        if (!data) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Unknown symbol: ${req.params.symbol}` } });
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

module.exports = { getOverview, getQuote };

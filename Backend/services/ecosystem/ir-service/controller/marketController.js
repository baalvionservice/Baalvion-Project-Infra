'use strict';
const { sendSuccess } = require('../utils/response');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { marketSnapshotSchema } = require('../validators/schemas');
const feed = require('../service/marketFeedService');

const DEFAULT_ORG_ID = process.env.IR_DEFAULT_ORG_ID || '11111111-1111-1111-1111-111111111111';
const orgOf = (req) => req.user?.orgId || DEFAULT_ORG_ID;
const FEED_TTL_SEC = Number(process.env.MARKET_FEED_TTL_SEC || 900);

// GET /market — current stock/market snapshot (public read; singleton per org).
// When a live feed is configured (MARKET_FEED_SYMBOL) and the snapshot is stale, refresh
// it from the provider on a best-effort basis (failure keeps the existing values).
const get = async (req, res, next) => {
    try {
        const [row] = await db.MarketSnapshot.findOrCreate({ where: { org_id: orgOf(req) }, defaults: { org_id: orgOf(req) } });
        if (feed.isConfigured()) {
            const ageSec = (Date.now() - new Date(row.updated_at).getTime()) / 1000;
            if (ageSec > FEED_TTL_SEC) {
                try { const q = await feed.fetchQuote(); if (q) await row.update(q); } catch { /* keep manual values */ }
            }
        }
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
};

// POST /market/refresh — admin pulls a fresh quote from the live feed now.
const refresh = async (req, res, next) => {
    try {
        if (!feed.isConfigured()) return next(new AppError('NOT_CONFIGURED', 'No live market feed configured — set MARKET_FEED_SYMBOL on ir-service.', 400));
        const q = await feed.fetchQuote();
        if (!q) return next(new AppError('FEED_ERROR', 'Market feed returned no quote', 502));
        const [row] = await db.MarketSnapshot.findOrCreate({ where: { org_id: req.user.orgId }, defaults: { org_id: req.user.orgId } });
        await row.update(q);
        return sendSuccess(req, res, row);
    } catch (err) { return next(new AppError('FEED_ERROR', `Market feed error: ${err.message}`, 502)); }
};

// PUT /market — admin updates the snapshot (manual entry until a live feed is wired).
const update = async (req, res, next) => {
    try {
        const parsed = marketSnapshotSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const [row] = await db.MarketSnapshot.findOrCreate({ where: { org_id: req.user.orgId }, defaults: { org_id: req.user.orgId } });
        await row.update({ ...parsed.data, as_of: parsed.data.as_of ? new Date(parsed.data.as_of) : new Date() });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
};

module.exports = { get, update, refresh };

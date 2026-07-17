'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const marketSyncService = require('../service/marketSyncService');

const buildPagination = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
});

// GET /assets — public
const listAssets = async (req, res, next) => {
    try {
        await marketSyncService.ensureFresh();
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const where = {};

        if (req.query.asset_type) where.asset_type = req.query.asset_type;
        if (req.query.exchange) where.exchange = req.query.exchange;
        if (req.query.sentiment) where.sentiment = req.query.sentiment;
        if (req.query.search) {
            where[Op.or] = [
                { symbol: { [Op.iLike]: `%${req.query.search}%` } },
                { name: { [Op.iLike]: `%${req.query.search}%` } },
            ];
        }

        const { count, rows } = await db.AssetSummary.findAndCountAll({
            where,
            limit,
            offset,
            order: [['symbol', 'ASC']],
        });

        return sendPaginated(req, res, {
            items: rows,
            pagination: buildPagination(count, page, limit),
        });
    } catch (err) { return next(err); }
};

// GET /assets/:symbol — public
const getAsset = async (req, res, next) => {
    try {
        await marketSyncService.ensureFresh();
        const asset = await db.AssetSummary.findOne({
            where: { symbol: req.params.symbol.toUpperCase() },
        });
        if (!asset) return next(new AppError('NOT_FOUND', 'Asset not found', 404));

        return sendSuccess(req, res, asset);
    } catch (err) { return next(err); }
};

// POST /assets — auth (admin/system) — upsert by symbol
const upsertAsset = async (req, res, next) => {
    try {
        if (!(req.auth.roles || []).some((r) => ['admin', 'owner', 'super_admin', 'system'].includes(r))) {
            return next(new AppError('FORBIDDEN', 'Admin access required', 403));
        }

        const { symbol, name, asset_type, exchange, current_price, change_pct_24h,
            market_cap, volume_24h, ai_summary, sentiment, key_metrics } = req.body;

        if (!symbol) return next(new AppError('VALIDATION_ERROR', 'Symbol is required', 400));

        const [asset, created] = await db.AssetSummary.findOrCreate({
            where: { symbol: symbol.toUpperCase() },
            defaults: {
                symbol: symbol.toUpperCase(), name, asset_type, exchange,
                current_price, change_pct_24h, market_cap, volume_24h,
                ai_summary, sentiment: sentiment || 'neutral',
                key_metrics: key_metrics || {},
                last_updated_at: new Date(),
            },
        });

        if (!created) {
            await asset.update({
                name: name ?? asset.name,
                asset_type: asset_type ?? asset.asset_type,
                exchange: exchange ?? asset.exchange,
                current_price: current_price ?? asset.current_price,
                change_pct_24h: change_pct_24h ?? asset.change_pct_24h,
                market_cap: market_cap ?? asset.market_cap,
                volume_24h: volume_24h ?? asset.volume_24h,
                ai_summary: ai_summary ?? asset.ai_summary,
                sentiment: sentiment ?? asset.sentiment,
                key_metrics: key_metrics ?? asset.key_metrics,
                last_updated_at: new Date(),
            });
        }

        return sendSuccess(req, res, asset, created ? 201 : 200);
    } catch (err) { return next(err); }
};

// GET /assets/:symbol/detail?range=1D|5D|1M|6M|YTD|1Y|5Y|MAX — public
// Merges the local AssetSummary row with cms-service's richer per-symbol detail
// (chart/indicators/performance/fundamentals, lazily pulled + cached) and this
// service's OWN articles (imperialpedia-service is the single public API — the
// frontend never calls cms-service directly for this).
const getAssetDetail = async (req, res, next) => {
    try {
        await marketSyncService.ensureFresh();
        const symbol = req.params.symbol.toUpperCase();
        const range = typeof req.query.range === 'string' ? req.query.range : '1M';

        const asset = await db.AssetSummary.findOne({ where: { symbol } });
        if (!asset) return next(new AppError('NOT_FOUND', 'Asset not found', 404));

        const detail = await marketSyncService.fetchAssetDetail(symbol, range);

        const relatedArticles = await db.Article.findAll({
            where: {
                status: 'published',
                [Op.or]: [
                    { title: { [Op.iLike]: `%${asset.name}%` } },
                    { tags: { [Op.contains]: [asset.name] } },
                ],
            },
            order: [['published_at', 'DESC']],
            limit: 3,
            attributes: ['id', 'title', 'slug', 'published_at'],
        }).catch(() => []);

        return sendSuccess(req, res, {
            symbol: asset.symbol,
            name: asset.name,
            asset_type: asset.asset_type,
            exchange: asset.exchange,
            current_price: asset.current_price,
            change_pct_24h: asset.change_pct_24h,
            market_cap: asset.market_cap,
            volume_24h: asset.volume_24h,
            ai_summary: asset.ai_summary,
            sentiment: asset.sentiment,
            last_updated_at: asset.last_updated_at,
            marketStatus: detail?.marketStatus ?? null,
            volume: detail?.volume ?? null,
            chart: detail?.chart ?? [],
            historical: detail?.historical ?? [],
            performance: detail?.performance ?? null,
            indicators: detail?.indicators ?? null,
            fundamentals: detail?.fundamentals ?? null,
            relatedCompanies: detail?.relatedCompanies ?? [],
            relatedArticles,
        });
    } catch (err) { return next(err); }
};

// GET /assets/:symbol/summary — public
const getAssetSummary = async (req, res, next) => {
    try {
        const asset = await db.AssetSummary.findOne({
            where: { symbol: req.params.symbol.toUpperCase() },
            attributes: ['symbol', 'name', 'ai_summary', 'sentiment', 'key_metrics', 'last_updated_at'],
        });
        if (!asset) return next(new AppError('NOT_FOUND', 'Asset summary not found', 404));

        return sendSuccess(req, res, {
            symbol: asset.symbol,
            name: asset.name,
            ai_summary: asset.ai_summary,
            sentiment: asset.sentiment,
            key_metrics: asset.key_metrics,
            last_updated_at: asset.last_updated_at,
        });
    } catch (err) { return next(err); }
};

module.exports = { listAssets, getAsset, upsertAsset, getAssetSummary, getAssetDetail };

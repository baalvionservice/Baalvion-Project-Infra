'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

// Load the live asset map (symbol → asset_summary) for the given symbols.
async function assetMap(symbols) {
    if (!symbols.length) return {};
    const rows = await db.AssetSummary.findAll({ where: { symbol: { [Op.in]: symbols } } });
    return Object.fromEntries(rows.map((r) => [r.symbol, r]));
}

const fmtUsd = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (n) => `${n >= 0 ? '+' : ''}${Number(n || 0).toFixed(2)}%`;
const sentLabel = (s) => (s === 'bullish' ? 'Bullish' : s === 'bearish' ? 'Bearish' : 'Neutral');
const fmtVol = (n) => {
    n = Number(n || 0);
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
};

// Shape a watchlist row into the frontend WatchlistItem.
function toWatchlistItem(w, asset) {
    const chg = asset ? Number(asset.change_pct_24h) : 0;
    return {
        id: w.id,
        asset: asset ? asset.name : w.symbol,
        symbol: w.symbol,
        currentValue: asset ? fmtUsd(asset.current_price) : '—',
        change: fmtPct(chg),
        isPositive: chg >= 0,
        sentiment: sentLabel(asset && asset.sentiment),
        volume: asset ? fmtVol(asset.volume_24h) : undefined,
    };
}

// 30-day synthetic performance series ending at `total`, trending with portfolio P&L.
function history(total, gainPct) {
    const start = total / (1 + gainPct / 100 || 1);
    return Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const v = start + ((total - start) * i) / 29;
        return { date: d.toISOString().split('T')[0], value: Math.round(v) };
    });
}

// ── Watchlist ──────────────────────────────────────────────────────────────
const getWatchlist = async (req, res, next) => {
    try {
        const rows = await db.WatchlistItem.findAll({ where: { user_id: req.user.id }, order: [['created_at', 'ASC']] });
        const assets = await assetMap(rows.map((r) => r.symbol));
        return sendSuccess(req, res, rows.map((r) => toWatchlistItem(r, assets[r.symbol])));
    } catch (err) { return next(err); }
};

const addWatchlist = async (req, res, next) => {
    try {
        const symbol = String(req.body.symbol || '').toUpperCase().trim();
        if (!symbol) return next(new AppError('VALIDATION_ERROR', 'symbol is required', 400));
        const [row] = await db.WatchlistItem.findOrCreate({
            where: { user_id: req.user.id, symbol },
            defaults: { user_id: req.user.id, symbol, group_name: req.body.group_name || 'My Watchlist' },
        });
        const assets = await assetMap([symbol]);
        return sendSuccess(req, res, toWatchlistItem(row, assets[symbol]), 201);
    } catch (err) { return next(err); }
};

const removeWatchlist = async (req, res, next) => {
    try {
        const n = await db.WatchlistItem.destroy({ where: { user_id: req.user.id, symbol: String(req.params.symbol).toUpperCase() } });
        return sendSuccess(req, res, { removed: n });
    } catch (err) { return next(err); }
};

// ── Portfolio ──────────────────────────────────────────────────────────────
const getPortfolio = async (req, res, next) => {
    try {
        const holdings = await db.PortfolioHolding.findAll({ where: { user_id: req.user.id }, order: [['created_at', 'ASC']] });
        const assets = await assetMap(holdings.map((h) => h.symbol));

        let totalValue = 0;
        let totalCost = 0;
        const positions = holdings.map((h) => {
            const a = assets[h.symbol];
            const qty = Number(h.quantity);
            const avg = Number(h.avg_cost);
            const price = a ? Number(a.current_price) : avg;
            const marketValue = qty * price;
            const costBasis = qty * avg;
            totalValue += marketValue;
            totalCost += costBasis;
            const gl = marketValue - costBasis;
            return {
                id: h.id, symbol: h.symbol, asset: a ? a.name : h.symbol, asset_type: a ? a.asset_type : null,
                quantity: qty, avg_cost: avg, current_price: price,
                market_value: Math.round(marketValue * 100) / 100,
                cost_basis: Math.round(costBasis * 100) / 100,
                gain_loss: Math.round(gl * 100) / 100,
                gain_loss_percent: costBasis ? Math.round((gl / costBasis) * 10000) / 100 : 0,
                sentiment: sentLabel(a && a.sentiment),
            };
        });

        const totalGl = totalValue - totalCost;
        const totalGlPct = totalCost ? (totalGl / totalCost) * 100 : 0;

        // Allocation by asset_type (Equities/Crypto/Commodity/etc.), with a Cash sliver.
        const byType = {};
        for (const p of positions) {
            const key = p.asset_type === 'stock' || p.asset_type === 'etf' || p.asset_type === 'index' ? 'Equities'
                : p.asset_type === 'crypto' ? 'Crypto'
                    : p.asset_type === 'commodity' ? 'Commodities' : 'Other';
            byType[key] = (byType[key] || 0) + p.market_value;
        }
        const allocation = Object.entries(byType).map(([asset, value]) => ({
            asset, value: Math.round(value), percentage: totalValue ? Math.round((value / totalValue) * 100) : 0,
        }));

        const summary = {
            total_value: fmtUsd(totalValue),
            gain_loss: `${totalGl >= 0 ? '+' : ''}${fmtUsd(totalGl)}`,
            gain_loss_percent: fmtPct(totalGlPct),
            total_gain_loss: `${totalGl >= 0 ? '+' : ''}${fmtUsd(totalGl)}`,
            total_gain_loss_percent: fmtPct(totalGlPct),
            allocation,
            history: history(totalValue, totalGlPct),
            performance_chart_data: history(totalValue, totalGlPct),
            totals: { value: totalValue, cost: totalCost, gain_loss: totalGl, gain_loss_percent: totalGlPct },
        };
        return sendSuccess(req, res, { positions, summary });
    } catch (err) { return next(err); }
};

const upsertHolding = async (req, res, next) => {
    try {
        const symbol = String(req.body.symbol || '').toUpperCase().trim();
        const quantity = Number(req.body.quantity);
        const avg_cost = Number(req.body.avg_cost);
        if (!symbol || !Number.isFinite(quantity) || !Number.isFinite(avg_cost)) {
            return next(new AppError('VALIDATION_ERROR', 'symbol, quantity and avg_cost are required', 400));
        }
        const [row, created] = await db.PortfolioHolding.findOrCreate({
            where: { user_id: req.user.id, symbol },
            defaults: { user_id: req.user.id, symbol, quantity, avg_cost },
        });
        if (!created) await row.update({ quantity, avg_cost });
        return sendSuccess(req, res, row, created ? 201 : 200);
    } catch (err) { return next(err); }
};

const removeHolding = async (req, res, next) => {
    try {
        const n = await db.PortfolioHolding.destroy({ where: { user_id: req.user.id, symbol: String(req.params.symbol).toUpperCase() } });
        return sendSuccess(req, res, { removed: n });
    } catch (err) { return next(err); }
};

module.exports = { getWatchlist, addWatchlist, removeWatchlist, getPortfolio, upsertHolding, removeHolding };

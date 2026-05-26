'use strict';
const db = require('../models');
const { Watchlist, WatchlistItem } = db;
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');

const listWatchlists = async (req, res, next) => {
    try {
        const watchlists = await Watchlist.findAll({
            where: { user_id: req.user.id },
            include: [{ model: WatchlistItem, as: 'items', attributes: ['id'] }],
            order: [['created_at', 'DESC']],
        });
        const result = watchlists.map(w => {
            const plain = w.toJSON();
            plain.items_count = plain.items ? plain.items.length : 0;
            delete plain.items;
            return plain;
        });
        return sendPaginated(req, res, { items: result, pagination: { total: result.length, page: 1, limit: result.length, totalPages: 1 } });
    } catch (err) { return next(err); }
};

const createWatchlist = async (req, res, next) => {
    try {
        const { name, description, is_default } = req.body;
        if (!name) return next(new AppError('VALIDATION_ERROR', 'name is required', 400));
        if (is_default) {
            await Watchlist.update({ is_default: false }, { where: { user_id: req.user.id } });
        }
        const watchlist = await Watchlist.create({ user_id: req.user.id, name, description, is_default: is_default || false });
        return sendSuccess(req, res, watchlist, 201);
    } catch (err) { return next(err); }
};

const getWatchlist = async (req, res, next) => {
    try {
        const watchlist = await Watchlist.findOne({
            where: { id: req.params.id, user_id: req.user.id },
            include: [{ model: WatchlistItem, as: 'items', order: [['added_at', 'DESC']] }],
        });
        if (!watchlist) return next(new AppError('NOT_FOUND', 'Watchlist not found', 404));
        return sendSuccess(req, res, watchlist);
    } catch (err) { return next(err); }
};

const updateWatchlist = async (req, res, next) => {
    try {
        const watchlist = await Watchlist.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!watchlist) return next(new AppError('NOT_FOUND', 'Watchlist not found', 404));
        const allowed = ['name', 'description', 'is_default'];
        const updates = {};
        for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
        if (updates.is_default) {
            await Watchlist.update({ is_default: false }, { where: { user_id: req.user.id } });
        }
        await watchlist.update(updates);
        return sendSuccess(req, res, watchlist);
    } catch (err) { return next(err); }
};

const deleteWatchlist = async (req, res, next) => {
    try {
        const watchlist = await Watchlist.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!watchlist) return next(new AppError('NOT_FOUND', 'Watchlist not found', 404));
        await watchlist.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

const addItem = async (req, res, next) => {
    try {
        const watchlist = await Watchlist.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!watchlist) return next(new AppError('NOT_FOUND', 'Watchlist not found', 404));
        const { symbol, name, asset_type, notes } = req.body;
        if (!symbol) return next(new AppError('VALIDATION_ERROR', 'symbol is required', 400));
        const [item, created] = await WatchlistItem.findOrCreate({
            where: { watchlist_id: watchlist.id, symbol: symbol.toUpperCase() },
            defaults: { watchlist_id: watchlist.id, symbol: symbol.toUpperCase(), name, asset_type, notes, added_at: new Date() },
        });
        if (!created && notes !== undefined) {
            await item.update({ notes });
        }
        return sendSuccess(req, res, item, created ? 201 : 200);
    } catch (err) { return next(err); }
};

const removeItem = async (req, res, next) => {
    try {
        const watchlist = await Watchlist.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!watchlist) return next(new AppError('NOT_FOUND', 'Watchlist not found', 404));
        const deleted = await WatchlistItem.destroy({ where: { watchlist_id: watchlist.id, symbol: req.params.symbol.toUpperCase() } });
        if (!deleted) return next(new AppError('NOT_FOUND', 'Item not found in watchlist', 404));
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

const updateItemPrice = async (req, res, next) => {
    try {
        const watchlist = await Watchlist.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!watchlist) return next(new AppError('NOT_FOUND', 'Watchlist not found', 404));
        const { prices } = req.body;
        if (!Array.isArray(prices)) return next(new AppError('VALIDATION_ERROR', 'prices must be an array of {symbol, current_price, change_pct}', 400));
        const updates = await Promise.all(prices.map(p =>
            WatchlistItem.update(
                { current_price: p.current_price, change_pct: p.change_pct || 0 },
                { where: { watchlist_id: watchlist.id, symbol: p.symbol.toUpperCase() } }
            )
        ));
        return sendSuccess(req, res, { updated: updates.reduce((s, r) => s + r[0], 0) });
    } catch (err) { return next(err); }
};

module.exports = { listWatchlists, createWatchlist, getWatchlist, updateWatchlist, deleteWatchlist, addItem, removeItem, updateItemPrice };

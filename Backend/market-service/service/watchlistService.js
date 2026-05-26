'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const listWatchlists = async (userId) => {
    return db.Watchlist.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
    });
};

const createWatchlist = async (userId, orgId, data) => {
    if (data.is_default) {
        await db.Watchlist.update({ is_default: false }, { where: { user_id: userId } });
    }
    return db.Watchlist.create({ ...data, user_id: userId, org_id: orgId });
};

const getWatchlist = async (id, userId) => {
    const wl = await db.Watchlist.findOne({
        where: { id, user_id: userId },
        include: [{ model: db.WatchlistItem, as: 'items' }],
    });
    if (!wl) throw new AppError('NOT_FOUND', 'Watchlist not found', 404);
    return wl;
};

const updateWatchlist = async (id, userId, data) => {
    const wl = await db.Watchlist.findOne({ where: { id, user_id: userId } });
    if (!wl) throw new AppError('NOT_FOUND', 'Watchlist not found', 404);
    if (data.is_default) {
        await db.Watchlist.update({ is_default: false }, { where: { user_id: userId } });
    }
    await wl.update(data);
    return wl;
};

const deleteWatchlist = async (id, userId) => {
    const wl = await db.Watchlist.findOne({ where: { id, user_id: userId } });
    if (!wl) throw new AppError('NOT_FOUND', 'Watchlist not found', 404);
    await wl.destroy();
};

const addItem = async (watchlistId, userId, data) => {
    const wl = await db.Watchlist.findOne({ where: { id: watchlistId, user_id: userId } });
    if (!wl) throw new AppError('NOT_FOUND', 'Watchlist not found', 404);

    const existing = await db.WatchlistItem.findOne({ where: { watchlist_id: watchlistId, symbol: data.symbol } });
    if (existing) throw new AppError('CONFLICT', 'Symbol already in watchlist', 409);

    const item = await db.WatchlistItem.create({ ...data, watchlist_id: watchlistId });
    await wl.update({ items_count: wl.items_count + 1 });
    return item;
};

const removeItem = async (watchlistId, userId, symbol) => {
    const wl = await db.Watchlist.findOne({ where: { id: watchlistId, user_id: userId } });
    if (!wl) throw new AppError('NOT_FOUND', 'Watchlist not found', 404);

    const item = await db.WatchlistItem.findOne({ where: { watchlist_id: watchlistId, symbol } });
    if (!item) throw new AppError('NOT_FOUND', 'Item not found', 404);
    await item.destroy();
    await wl.update({ items_count: Math.max(0, wl.items_count - 1) });
};

module.exports = {
    listWatchlists,
    createWatchlist,
    getWatchlist,
    updateWatchlist,
    deleteWatchlist,
    addItem,
    removeItem,
};

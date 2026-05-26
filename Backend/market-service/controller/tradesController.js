'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { Trade, Portfolio, PortfolioHolding } = db;
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');

const listTrades = async (req, res, next) => {
    try {
        const { symbol, trade_type, portfolio_id, page = 1, limit = 20 } = req.query;
        const where = { user_id: req.user.id };
        if (symbol) where.symbol = symbol.toUpperCase();
        if (trade_type) where.trade_type = trade_type;
        if (portfolio_id) where.portfolio_id = portfolio_id;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await Trade.findAndCountAll({
            where,
            order: [['traded_at', 'DESC']],
            limit: parseInt(limit),
            offset,
        });
        const totalPages = Math.ceil(count / parseInt(limit));
        return sendPaginated(req, res, { items: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages } });
    } catch (err) { return next(err); }
};

const createTrade = async (req, res, next) => {
    try {
        const { portfolio_id, symbol, name, asset_type, trade_type, quantity, price, fees, currency, exchange, notes, traded_at } = req.body;
        if (!portfolio_id || !symbol || !trade_type || !quantity || !price) {
            return next(new AppError('VALIDATION_ERROR', 'portfolio_id, symbol, trade_type, quantity, price are required', 400));
        }
        if (!['buy', 'sell'].includes(trade_type)) {
            return next(new AppError('VALIDATION_ERROR', 'trade_type must be buy or sell', 400));
        }
        const portfolio = await Portfolio.findOne({ where: { id: portfolio_id, user_id: req.user.id } });
        if (!portfolio) return next(new AppError('NOT_FOUND', 'Portfolio not found', 404));

        const qty = parseFloat(quantity);
        const priceVal = parseFloat(price);
        const feesVal = parseFloat(fees || 0);
        const totalAmount = (qty * priceVal) + feesVal;
        const sym = symbol.toUpperCase();

        const trade = await Trade.create({
            portfolio_id, user_id: req.user.id, symbol: sym, name, asset_type,
            trade_type, quantity: qty, price: priceVal, total_amount: totalAmount,
            fees: feesVal, currency: currency || 'USD', exchange, notes,
            traded_at: traded_at ? new Date(traded_at) : new Date(),
        });

        // Update portfolio_holdings
        const existing = await PortfolioHolding.findOne({ where: { portfolio_id, symbol: sym } });
        if (trade_type === 'buy') {
            if (existing) {
                const oldQty = parseFloat(existing.quantity);
                const oldAvg = parseFloat(existing.avg_buy_price);
                const newAvg = ((oldQty * oldAvg) + (qty * priceVal)) / (oldQty + qty);
                const newQty = oldQty + qty;
                const newCurrentValue = newQty * parseFloat(existing.current_price || priceVal);
                const newGainLoss = newCurrentValue - (newQty * newAvg);
                const newGainLossPct = newAvg > 0 ? ((parseFloat(existing.current_price || priceVal) - newAvg) / newAvg * 100) : 0;
                await existing.update({
                    quantity: newQty.toFixed(6),
                    avg_buy_price: newAvg.toFixed(4),
                    current_value: newCurrentValue.toFixed(2),
                    gain_loss: newGainLoss.toFixed(2),
                    gain_loss_pct: newGainLossPct.toFixed(2),
                    last_updated_at: new Date(),
                });
            } else {
                await PortfolioHolding.create({
                    portfolio_id, symbol: sym, name, asset_type,
                    quantity: qty.toFixed(6),
                    avg_buy_price: priceVal.toFixed(4),
                    current_price: priceVal.toFixed(4),
                    current_value: (qty * priceVal).toFixed(2),
                    gain_loss: '0.00',
                    gain_loss_pct: '0.00',
                    last_updated_at: new Date(),
                });
            }
        } else if (trade_type === 'sell' && existing) {
            const oldQty = parseFloat(existing.quantity);
            const newQty = Math.max(0, oldQty - qty);
            if (newQty === 0) {
                await existing.destroy();
            } else {
                const curPrice = parseFloat(existing.current_price || priceVal);
                const newCurrentValue = newQty * curPrice;
                const avgBuy = parseFloat(existing.avg_buy_price);
                const newGainLoss = newCurrentValue - (newQty * avgBuy);
                const newGainLossPct = avgBuy > 0 ? ((curPrice - avgBuy) / avgBuy * 100) : 0;
                await existing.update({
                    quantity: newQty.toFixed(6),
                    current_value: newCurrentValue.toFixed(2),
                    gain_loss: newGainLoss.toFixed(2),
                    gain_loss_pct: newGainLossPct.toFixed(2),
                    last_updated_at: new Date(),
                });
            }
        }

        // Recalculate portfolio current_value
        const allHoldings = await PortfolioHolding.findAll({ where: { portfolio_id } });
        const totalValue = allHoldings.reduce((s, h) => s + parseFloat(h.current_value || 0), 0);
        const totalGainLoss = allHoldings.reduce((s, h) => s + parseFloat(h.gain_loss || 0), 0);
        const initVal = parseFloat(portfolio.initial_value) || 0;
        const totalGainLossPct = initVal > 0 ? ((totalGainLoss / initVal) * 100).toFixed(2) : '0.00';
        await portfolio.update({ current_value: totalValue.toFixed(2), total_gain_loss: totalGainLoss.toFixed(2), total_gain_loss_pct: totalGainLossPct });

        return sendSuccess(req, res, trade, 201);
    } catch (err) { return next(err); }
};

const getTrade = async (req, res, next) => {
    try {
        const trade = await Trade.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!trade) return next(new AppError('NOT_FOUND', 'Trade not found', 404));
        return sendSuccess(req, res, trade);
    } catch (err) { return next(err); }
};

const getTradeHistory = async (req, res, next) => {
    try {
        const trades = await Trade.findAll({
            where: { symbol: req.params.symbol.toUpperCase(), user_id: req.user.id },
            order: [['traded_at', 'DESC']],
            limit: 50,
        });
        return sendPaginated(req, res, { items: trades, pagination: { total: trades.length, page: 1, limit: 50, totalPages: 1 } });
    } catch (err) { return next(err); }
};

module.exports = { listTrades, createTrade, getTrade, getTradeHistory };

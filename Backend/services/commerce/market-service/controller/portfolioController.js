'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { Portfolio, PortfolioHolding } = db;
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');

const listPortfolios = async (req, res, next) => {
    try {
        const portfolios = await Portfolio.findAll({
            where: { user_id: req.user.id },
            include: [{ model: PortfolioHolding, as: 'holdings', attributes: ['id'] }],
            order: [['created_at', 'DESC']],
        });
        const result = portfolios.map(p => {
            const plain = p.toJSON();
            plain.holdings_count = plain.holdings ? plain.holdings.length : 0;
            delete plain.holdings;
            return plain;
        });
        return sendPaginated(req, res, { items: result, pagination: { total: result.length, page: 1, limit: result.length, totalPages: 1 } });
    } catch (err) { return next(err); }
};

const createPortfolio = async (req, res, next) => {
    try {
        const { name, description, currency, initial_value, cash_balance, is_default } = req.body;
        if (!name) return next(new AppError('VALIDATION_ERROR', 'name is required', 400));
        if (is_default) {
            await Portfolio.update({ is_default: false }, { where: { user_id: req.user.id } });
        }
        const portfolio = await Portfolio.create({
            user_id: req.user.id,
            org_id: req.user.orgId || null,
            name, description,
            currency: currency || 'USD',
            initial_value: initial_value || 0,
            current_value: initial_value || 0,
            cash_balance: cash_balance || 0,
            is_default: is_default || false,
        });
        return sendSuccess(req, res, portfolio, 201);
    } catch (err) { return next(err); }
};

const getPortfolio = async (req, res, next) => {
    try {
        const portfolio = await Portfolio.findOne({
            where: { id: req.params.id, user_id: req.user.id },
            include: [{ model: PortfolioHolding, as: 'holdings' }],
        });
        if (!portfolio) return next(new AppError('NOT_FOUND', 'Portfolio not found', 404));
        const plain = portfolio.toJSON();
        const totalValue = plain.holdings.reduce((sum, h) => sum + parseFloat(h.current_value || 0), 0);
        plain.calculated_value = totalValue;
        return sendSuccess(req, res, plain);
    } catch (err) { return next(err); }
};

const updatePortfolio = async (req, res, next) => {
    try {
        const portfolio = await Portfolio.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!portfolio) return next(new AppError('NOT_FOUND', 'Portfolio not found', 404));
        const allowed = ['name', 'description', 'currency', 'cash_balance', 'is_default'];
        const updates = {};
        for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
        if (updates.is_default) {
            await Portfolio.update({ is_default: false }, { where: { user_id: req.user.id } });
        }
        await portfolio.update(updates);
        return sendSuccess(req, res, portfolio);
    } catch (err) { return next(err); }
};

const deletePortfolio = async (req, res, next) => {
    try {
        const portfolio = await Portfolio.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!portfolio) return next(new AppError('NOT_FOUND', 'Portfolio not found', 404));
        if (portfolio.is_default) return next(new AppError('FORBIDDEN', 'Cannot delete the default portfolio', 403));
        await portfolio.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

const getPerformance = async (req, res, next) => {
    try {
        const portfolio = await Portfolio.findOne({
            where: { id: req.params.id, user_id: req.user.id },
            include: [{ model: PortfolioHolding, as: 'holdings' }],
        });
        if (!portfolio) return next(new AppError('NOT_FOUND', 'Portfolio not found', 404));
        const holdings = portfolio.holdings || [];
        const byAssetType = {};
        let totalCurrentValue = 0;
        let totalCost = 0;
        let totalGainLoss = 0;
        for (const h of holdings) {
            const currentVal = parseFloat(h.current_value || 0);
            const cost = parseFloat(h.quantity) * parseFloat(h.avg_buy_price);
            const gainLoss = parseFloat(h.gain_loss || 0);
            totalCurrentValue += currentVal;
            totalCost += cost;
            totalGainLoss += gainLoss;
            const type = h.asset_type || 'unknown';
            if (!byAssetType[type]) byAssetType[type] = { asset_type: type, count: 0, total_value: 0, total_gain_loss: 0 };
            byAssetType[type].count++;
            byAssetType[type].total_value += currentVal;
            byAssetType[type].total_gain_loss += gainLoss;
        }
        const totalGainLossPct = totalCost > 0 ? ((totalGainLoss / totalCost) * 100).toFixed(2) : '0.00';
        return sendSuccess(req, res, {
            portfolio_id: portfolio.id,
            total_current_value: totalCurrentValue.toFixed(2),
            total_cost: totalCost.toFixed(2),
            total_gain_loss: totalGainLoss.toFixed(2),
            total_gain_loss_pct: totalGainLossPct,
            by_asset_type: Object.values(byAssetType),
            holdings_count: holdings.length,
        });
    } catch (err) { return next(err); }
};

const getHoldings = async (req, res, next) => {
    try {
        const portfolio = await Portfolio.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!portfolio) return next(new AppError('NOT_FOUND', 'Portfolio not found', 404));
        const { sort = 'current_value', order = 'DESC' } = req.query;
        const allowedSort = ['current_value', 'symbol', 'quantity', 'gain_loss', 'gain_loss_pct', 'created_at'];
        const sortField = allowedSort.includes(sort) ? sort : 'current_value';
        const holdings = await PortfolioHolding.findAll({
            where: { portfolio_id: req.params.id },
            order: [[sortField, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
        });
        return sendPaginated(req, res, { items: holdings, pagination: { total: holdings.length, page: 1, limit: holdings.length, totalPages: 1 } });
    } catch (err) { return next(err); }
};

const updateHolding = async (req, res, next) => {
    try {
        const portfolio = await Portfolio.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!portfolio) return next(new AppError('NOT_FOUND', 'Portfolio not found', 404));
        const holding = await PortfolioHolding.findOne({ where: { portfolio_id: req.params.id, symbol: req.params.symbol } });
        if (!holding) return next(new AppError('NOT_FOUND', 'Holding not found', 404));
        const updates = {};
        if (req.body.current_price !== undefined) {
            const currentPrice = parseFloat(req.body.current_price);
            const qty = parseFloat(holding.quantity);
            const avgBuy = parseFloat(holding.avg_buy_price);
            const currentValue = qty * currentPrice;
            const gainLoss = currentValue - (qty * avgBuy);
            const gainLossPct = avgBuy > 0 ? ((currentPrice - avgBuy) / avgBuy * 100) : 0;
            updates.current_price = currentPrice;
            updates.current_value = currentValue.toFixed(2);
            updates.gain_loss = gainLoss.toFixed(2);
            updates.gain_loss_pct = gainLossPct.toFixed(2);
            updates.last_updated_at = new Date();
        }
        if (req.body.notes !== undefined) updates.notes = req.body.notes;
        await holding.update(updates);
        // Recalculate portfolio totals
        const allHoldings = await PortfolioHolding.findAll({ where: { portfolio_id: req.params.id } });
        const totalValue = allHoldings.reduce((s, h) => s + parseFloat(h.current_value || 0), 0);
        const totalGainLoss = allHoldings.reduce((s, h) => s + parseFloat(h.gain_loss || 0), 0);
        const initVal = parseFloat(portfolio.initial_value) || 0;
        const totalGainLossPct = initVal > 0 ? ((totalGainLoss / initVal) * 100).toFixed(2) : '0.00';
        await portfolio.update({ current_value: totalValue.toFixed(2), total_gain_loss: totalGainLoss.toFixed(2), total_gain_loss_pct: totalGainLossPct });
        return sendSuccess(req, res, holding);
    } catch (err) { return next(err); }
};

const addHolding = async (req, res, next) => {
    try {
        const portfolio = await Portfolio.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!portfolio) return next(new AppError('NOT_FOUND', 'Portfolio not found', 404));
        const { symbol, name, asset_type, quantity, avg_buy_price, current_price } = req.body;
        if (!symbol || quantity === undefined || avg_buy_price === undefined) {
            return next(new AppError('VALIDATION_ERROR', 'symbol, quantity and avg_buy_price are required', 400));
        }
        const qty = parseFloat(quantity);
        const avg = parseFloat(avg_buy_price);
        const price = current_price !== undefined ? parseFloat(current_price) : avg;
        const currentValue = qty * price;
        const gainLoss = currentValue - (qty * avg);
        const gainLossPct = avg > 0 ? ((price - avg) / avg) * 100 : 0;
        const holding = await PortfolioHolding.create({
            portfolio_id: portfolio.id,
            symbol: String(symbol).toUpperCase(),
            name: name || null,
            asset_type: asset_type || 'equity',
            quantity: qty,
            avg_buy_price: avg,
            current_price: price,
            current_value: currentValue.toFixed(2),
            gain_loss: gainLoss.toFixed(2),
            gain_loss_pct: gainLossPct.toFixed(2),
            last_updated_at: new Date(),
        });
        return sendSuccess(req, res, holding, 201);
    } catch (err) { return next(err); }
};

const removeHolding = async (req, res, next) => {
    try {
        const portfolio = await Portfolio.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!portfolio) return next(new AppError('NOT_FOUND', 'Portfolio not found', 404));
        const holding = await PortfolioHolding.findOne({ where: { portfolio_id: req.params.id, symbol: req.params.symbol } });
        if (!holding) return next(new AppError('NOT_FOUND', 'Holding not found', 404));
        await holding.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listPortfolios, createPortfolio, getPortfolio, updatePortfolio, deletePortfolio, getPerformance, getHoldings, addHolding, updateHolding, removeHolding };

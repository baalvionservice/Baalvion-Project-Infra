'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');

const listPortfolios = async (userId) => {
    return db.Portfolio.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
    });
};

const createPortfolio = async (userId, orgId, data) => {
    if (data.is_default) {
        await db.Portfolio.update({ is_default: false }, { where: { user_id: userId } });
    }
    return db.Portfolio.create({ ...data, user_id: userId, org_id: orgId });
};

const getPortfolio = async (id, userId) => {
    const portfolio = await db.Portfolio.findOne({
        where: { id, user_id: userId },
        include: [{ model: db.PortfolioHolding, as: 'holdings' }],
    });
    if (!portfolio) throw new AppError('NOT_FOUND', 'Portfolio not found', 404);
    return portfolio;
};

const updatePortfolio = async (id, userId, data) => {
    const portfolio = await db.Portfolio.findOne({ where: { id, user_id: userId } });
    if (!portfolio) throw new AppError('NOT_FOUND', 'Portfolio not found', 404);
    if (data.is_default) {
        await db.Portfolio.update({ is_default: false }, { where: { user_id: userId } });
    }
    await portfolio.update(data);
    return portfolio;
};

const deletePortfolio = async (id, userId) => {
    const portfolio = await db.Portfolio.findOne({ where: { id, user_id: userId } });
    if (!portfolio) throw new AppError('NOT_FOUND', 'Portfolio not found', 404);
    await portfolio.destroy();
};

const getPerformance = async (id, userId) => {
    const portfolio = await db.Portfolio.findOne({ where: { id, user_id: userId } });
    if (!portfolio) throw new AppError('NOT_FOUND', 'Portfolio not found', 404);
    const trades = await db.Trade.findAll({
        where: { portfolio_id: id },
        order: [['traded_at', 'ASC']],
        attributes: ['traded_at', 'trade_type', 'total_amount', 'symbol', 'quantity', 'price'],
    });
    return {
        portfolio_id: id,
        total_invested: portfolio.total_invested,
        current_value: portfolio.current_value,
        total_pnl: portfolio.total_pnl,
        total_pnl_pct: portfolio.total_pnl_pct,
        holdings_count: portfolio.holdings_count,
        trades_count: trades.length,
        trade_history: trades,
    };
};

const addHolding = async (portfolioId, userId, data) => {
    const portfolio = await db.Portfolio.findOne({ where: { id: portfolioId, user_id: userId } });
    if (!portfolio) throw new AppError('NOT_FOUND', 'Portfolio not found', 404);

    const [holding, created] = await db.PortfolioHolding.findOrCreate({
        where: { portfolio_id: portfolioId, symbol: data.symbol },
        defaults: { ...data, portfolio_id: portfolioId },
    });

    if (!created) {
        const newQty = parseFloat(holding.quantity) + parseFloat(data.quantity);
        const newInvested = parseFloat(holding.invested_amount) + parseFloat(data.invested_amount);
        const newAvg = newInvested / newQty;
        await holding.update({
            quantity: newQty,
            invested_amount: newInvested,
            avg_buy_price: newAvg,
            name: data.name || holding.name,
            last_updated_at: new Date(),
        });
    }

    // Update portfolio totals
    const holdings = await db.PortfolioHolding.findAll({ where: { portfolio_id: portfolioId } });
    const totalInvested = holdings.reduce((s, h) => s + parseFloat(h.invested_amount), 0);
    const currentValue = holdings.reduce((s, h) => s + parseFloat(h.current_value || h.invested_amount), 0);
    await portfolio.update({
        total_invested: totalInvested,
        current_value: currentValue,
        total_pnl: currentValue - totalInvested,
        total_pnl_pct: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
        holdings_count: holdings.length,
    });

    return holding;
};

const removeHolding = async (portfolioId, userId, symbol) => {
    const portfolio = await db.Portfolio.findOne({ where: { id: portfolioId, user_id: userId } });
    if (!portfolio) throw new AppError('NOT_FOUND', 'Portfolio not found', 404);

    const holding = await db.PortfolioHolding.findOne({ where: { portfolio_id: portfolioId, symbol } });
    if (!holding) throw new AppError('NOT_FOUND', 'Holding not found', 404);
    await holding.destroy();

    const holdings = await db.PortfolioHolding.findAll({ where: { portfolio_id: portfolioId } });
    const totalInvested = holdings.reduce((s, h) => s + parseFloat(h.invested_amount), 0);
    const currentValue = holdings.reduce((s, h) => s + parseFloat(h.current_value || h.invested_amount), 0);
    await portfolio.update({
        total_invested: totalInvested,
        current_value: currentValue,
        total_pnl: currentValue - totalInvested,
        total_pnl_pct: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
        holdings_count: holdings.length,
    });
};

module.exports = {
    listPortfolios,
    createPortfolio,
    getPortfolio,
    updatePortfolio,
    deletePortfolio,
    getPerformance,
    addHolding,
    removeHolding,
};

'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const listTrades = async (userId, { page, limit }) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.Trade.findAndCountAll({
        where: { user_id: userId },
        order: [['traded_at', 'DESC']],
        limit,
        offset,
    });
    return {
        items: rows,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
    };
};

const createTrade = async (userId, data) => {
    const portfolio = await db.Portfolio.findOne({ where: { id: data.portfolio_id, user_id: userId } });
    if (!portfolio) throw new AppError('NOT_FOUND', 'Portfolio not found', 404);

    const trade = await db.Trade.create({ ...data, user_id: userId });

    // Update or create holding
    if (data.trade_type === 'buy') {
        const [holding, created] = await db.PortfolioHolding.findOrCreate({
            where: { portfolio_id: data.portfolio_id, symbol: data.symbol },
            defaults: {
                portfolio_id: data.portfolio_id,
                symbol: data.symbol,
                name: data.name,
                quantity: data.quantity,
                avg_buy_price: data.price,
                invested_amount: data.total_amount,
                first_bought_at: data.traded_at || new Date(),
            },
        });
        if (!created) {
            const newQty = parseFloat(holding.quantity) + parseFloat(data.quantity);
            const newInvested = parseFloat(holding.invested_amount) + parseFloat(data.total_amount);
            await holding.update({
                quantity: newQty,
                invested_amount: newInvested,
                avg_buy_price: newInvested / newQty,
                last_updated_at: new Date(),
            });
        }
    } else if (data.trade_type === 'sell') {
        const holding = await db.PortfolioHolding.findOne({ where: { portfolio_id: data.portfolio_id, symbol: data.symbol } });
        if (holding) {
            const newQty = parseFloat(holding.quantity) - parseFloat(data.quantity);
            if (newQty <= 0) {
                await holding.destroy();
            } else {
                const newInvested = newQty * parseFloat(holding.avg_buy_price);
                await holding.update({ quantity: newQty, invested_amount: newInvested, last_updated_at: new Date() });
            }
        }
    }

    // Recalculate portfolio totals
    const holdings = await db.PortfolioHolding.findAll({ where: { portfolio_id: data.portfolio_id } });
    const totalInvested = holdings.reduce((s, h) => s + parseFloat(h.invested_amount), 0);
    const currentValue = holdings.reduce((s, h) => s + parseFloat(h.current_value || h.invested_amount), 0);
    await portfolio.update({
        total_invested: totalInvested,
        current_value: currentValue,
        total_pnl: currentValue - totalInvested,
        total_pnl_pct: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
        holdings_count: holdings.length,
    });

    return trade;
};

const getTrade = async (id, userId) => {
    const trade = await db.Trade.findOne({ where: { id, user_id: userId } });
    if (!trade) throw new AppError('NOT_FOUND', 'Trade not found', 404);
    return trade;
};

module.exports = { listTrades, createTrade, getTrade };

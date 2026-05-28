'use strict';
const { Op, fn, col, literal } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');

const getPerformanceStats = async (userId) => {
    const portfolios = await db.Portfolio.findAll({ where: { user_id: userId } });
    const totalInvested = portfolios.reduce((s, p) => s + parseFloat(p.total_invested), 0);
    const currentValue = portfolios.reduce((s, p) => s + parseFloat(p.current_value), 0);
    const totalPnl = currentValue - totalInvested;
    const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    const portfolioIds = portfolios.map(p => p.id);
    const buyCount = await db.Trade.count({ where: { user_id: userId, trade_type: 'buy' } });
    const sellCount = await db.Trade.count({ where: { user_id: userId, trade_type: 'sell' } });

    const topHoldings = await db.PortfolioHolding.findAll({
        where: { portfolio_id: { [Op.in]: portfolioIds.length ? portfolioIds : [0] } },
        order: [['current_value', 'DESC']],
        limit: 5,
    });

    return {
        portfolios_count: portfolios.length,
        total_invested: totalInvested,
        current_value: currentValue,
        total_pnl: totalPnl,
        total_pnl_pct: totalPnlPct,
        buy_trades: buyCount,
        sell_trades: sellCount,
        top_holdings: topHoldings,
    };
};

module.exports = { getPerformanceStats };

'use strict';
const { Sequelize } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    schema: 'market',
    logging: config.env === 'development' ? console.log : false,
    define: { underscored: true },
});

const Portfolio = require('./portfolios')(sequelize);
const PortfolioHolding = require('./portfolio_holdings')(sequelize);
const Watchlist = require('./watchlists')(sequelize);
const WatchlistItem = require('./watchlist_items')(sequelize);
const Trade = require('./trades')(sequelize);
const PriceAlert = require('./price_alerts')(sequelize);
const MarketNews = require('./market_news')(sequelize);
const TechnicalIndicator = require('./technical_indicators')(sequelize);

// Associations
Portfolio.hasMany(PortfolioHolding, { foreignKey: 'portfolio_id', as: 'holdings' });
PortfolioHolding.belongsTo(Portfolio, { foreignKey: 'portfolio_id', as: 'portfolio' });

Portfolio.hasMany(Trade, { foreignKey: 'portfolio_id', as: 'trades' });
Trade.belongsTo(Portfolio, { foreignKey: 'portfolio_id', as: 'portfolio' });

Watchlist.hasMany(WatchlistItem, { foreignKey: 'watchlist_id', as: 'items' });
WatchlistItem.belongsTo(Watchlist, { foreignKey: 'watchlist_id', as: 'watchlist' });

module.exports = {
    sequelize,
    Sequelize,
    Portfolio,
    PortfolioHolding,
    Watchlist,
    WatchlistItem,
    Trade,
    PriceAlert,
    MarketNews,
    TechnicalIndicator,
};

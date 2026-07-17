'use strict';

// Reference table for the newsroom "Live Market Data" dashboard. NOT read by
// marketDataService at runtime yet (it still uses its own hardcoded instrument
// lists per provider) — this is the seed for a future dynamic /quote/:symbol page,
// so a symbol can be looked up without redeploying the service.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('market_assets', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true, allowNull: false },
            symbol: { type: Sequelize.STRING(40), allowNull: false },
            provider_symbol: { type: Sequelize.STRING(80), allowNull: false },
            name: { type: Sequelize.STRING(120), allowNull: false },
            type: { type: Sequelize.ENUM('index', 'stock', 'crypto', 'forex', 'commodity', 'bond'), allowNull: false },
            region: { type: Sequelize.STRING(40), allowNull: true },
            provider: { type: Sequelize.STRING(40), allowNull: false },
            category: { type: Sequelize.STRING(40), allowNull: true },
            news_keyword: { type: Sequelize.STRING(120), allowNull: true },
            sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'cms' });

        await queryInterface.addConstraint('cms.market_assets', {
            fields: ['symbol'],
            type: 'unique',
            name: 'market_assets_symbol_unique',
        });
        await queryInterface.addIndex('cms.market_assets', ['type']);
        await queryInterface.addIndex('cms.market_assets', ['region']);

        const now = new Date();
        const row = (symbol, providerSymbol, name, type, region, provider, category, newsKeyword, sortOrder) => ({
            id: Sequelize.literal('gen_random_uuid()'),
            symbol, provider_symbol: providerSymbol, name, type, region, provider, category,
            news_keyword: newsKeyword, sort_order: sortOrder, is_active: true,
            created_at: now, updated_at: now,
        });

        await queryInterface.bulkInsert({ tableName: 'market_assets', schema: 'cms' }, [
            row('DJI', 'DIA', 'Dow Jones', 'index', 'US', 'finnhub', 'US_INDEX', null, 1),
            row('SPX', 'SPY', 'S&P 500', 'index', 'US', 'finnhub', 'US_INDEX', null, 2),
            row('IXIC', 'QQQ', 'Nasdaq', 'index', 'US', 'finnhub', 'US_INDEX', null, 3),
            row('RUT', 'IWM', 'Russell 2000', 'index', 'US', 'finnhub', 'US_INDEX', null, 4),
            row('VIX', 'VIXY', 'VIX', 'index', 'US', 'finnhub', 'US_INDEX', null, 5),
            row('EUROPE', 'VGK', 'Europe', 'index', 'Europe', 'finnhub', 'GLOBAL_INDEX', null, 10),
            row('APAC', 'VPL', 'Asia-Pacific', 'index', 'Asia-Pacific', 'finnhub', 'GLOBAL_INDEX', null, 11),
            row('CHINA', 'FXI', 'China', 'index', 'China', 'finnhub', 'GLOBAL_INDEX', null, 12),
            row('EM', 'EEM', 'Emerging Markets', 'index', 'Emerging Markets', 'finnhub', 'GLOBAL_INDEX', null, 13),
            row('AAPL', 'AAPL', 'Apple', 'stock', 'US', 'finnhub', 'TECH', 'Apple', 20),
            row('MSFT', 'MSFT', 'Microsoft', 'stock', 'US', 'finnhub', 'TECH', 'Microsoft', 21),
            row('GOOGL', 'GOOGL', 'Alphabet', 'stock', 'US', 'finnhub', 'TECH', 'Google', 22),
            row('AMZN', 'AMZN', 'Amazon', 'stock', 'US', 'finnhub', 'TECH', 'Amazon', 23),
            row('TSLA', 'TSLA', 'Tesla', 'stock', 'US', 'finnhub', 'AUTO', 'Tesla', 24),
            row('NVDA', 'NVDA', 'Nvidia', 'stock', 'US', 'finnhub', 'TECH', 'Nvidia', 25),
            row('BTC', 'bitcoin', 'Bitcoin', 'crypto', 'GLOBAL', 'coingecko', 'CRYPTO', 'Bitcoin', 30),
            row('ETH', 'ethereum', 'Ethereum', 'crypto', 'GLOBAL', 'coingecko', 'CRYPTO', 'Ethereum', 31),
            row('SOL', 'solana', 'Solana', 'crypto', 'GLOBAL', 'coingecko', 'CRYPTO', 'Solana', 32),
            row('EURUSD', 'EUR/USD', 'EUR / USD', 'forex', 'GLOBAL', 'twelvedata', 'FX', null, 40),
            row('GBPUSD', 'GBP/USD', 'GBP / USD', 'forex', 'GLOBAL', 'twelvedata', 'FX', null, 41),
            row('USDJPY', 'USD/JPY', 'USD / JPY', 'forex', 'GLOBAL', 'twelvedata', 'FX', null, 42),
            row('USDINR', 'USD/INR', 'USD / INR', 'forex', 'GLOBAL', 'twelvedata', 'FX', null, 43),
            row('USDCNY', 'USD/CNY', 'USD / CNY', 'forex', 'GLOBAL', 'twelvedata', 'FX', null, 44),
            row('XAUUSD', 'XAU/USD', 'Gold', 'commodity', 'GLOBAL', 'twelvedata', 'METALS', null, 50),
            row('WTI', 'WTI', 'Crude Oil (WTI)', 'commodity', 'US', 'alphavantage', 'ENERGY', null, 51),
            row('BRENT', 'BRENT', 'Crude Oil (Brent)', 'commodity', 'GLOBAL', 'alphavantage', 'ENERGY', null, 52),
            row('NATGAS', 'NATURAL_GAS', 'Natural Gas', 'commodity', 'US', 'alphavantage', 'ENERGY', null, 53),
            row('COPPER', 'COPPER', 'Copper', 'commodity', 'GLOBAL', 'alphavantage', 'METALS', null, 54),
            row('DGS3MO', 'DGS3MO', '3-Month Treasury', 'bond', 'US', 'fred', 'YIELD', null, 60),
            row('DGS2', 'DGS2', '2-Year Treasury', 'bond', 'US', 'fred', 'YIELD', null, 61),
            row('DGS10', 'DGS10', '10-Year Treasury', 'bond', 'US', 'fred', 'YIELD', null, 62),
            row('DGS30', 'DGS30', '30-Year Treasury', 'bond', 'US', 'fred', 'YIELD', null, 63),
        ]);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'market_assets', schema: 'cms' });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "cms"."enum_market_assets_type";');
    },
};

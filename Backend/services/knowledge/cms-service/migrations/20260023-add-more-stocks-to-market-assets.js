'use strict';

// Expands the tracked stock universe so "Market Movers" (top gainers/losers) has
// a real pool to rank instead of just the original 6 names, and adds the 5 SPDR
// sector ETF proxies used for "Sector Performance". Logo URLs verified live before
// writing this migration — META's isn't in Finnhub's logo CDN under this ticker,
// so it's left null rather than storing a broken image link.
module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();
        const logo = (symbol) => `https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/${symbol}.png`;
        const row = (symbol, name, newsKeyword, sortOrder, logoUrl) => ({
            id: Sequelize.literal('gen_random_uuid()'),
            symbol, provider_symbol: symbol, name, type: 'stock', region: 'US', provider: 'finnhub',
            category: 'TECH', news_keyword: newsKeyword, sort_order: sortOrder, is_active: true,
            exchange: 'NASDAQ', currency: 'USD', logo_url: logoUrl,
            created_at: now, updated_at: now,
        });

        const sectorRow = (symbol, name, sortOrder) => ({
            id: Sequelize.literal('gen_random_uuid()'),
            symbol, provider_symbol: symbol, name, type: 'index', region: 'US', provider: 'finnhub',
            category: 'SECTOR', news_keyword: null, sort_order: sortOrder, is_active: true,
            exchange: 'NYSE ARCA', currency: 'USD', logo_url: null,
            created_at: now, updated_at: now,
        });

        await queryInterface.bulkInsert({ tableName: 'market_assets', schema: 'cms' }, [
            row('AMD', 'AMD', 'AMD', 26, logo('AMD')),
            row('META', 'Meta Platforms', 'Meta', 27, null),
            row('NFLX', 'Netflix', 'Netflix', 28, logo('NFLX')),
            row('JPM', 'JPMorgan Chase', 'JPMorgan', 29, logo('JPM')),
            sectorRow('XLK', 'Technology', 70),
            sectorRow('XLE', 'Energy', 71),
            sectorRow('XLV', 'Healthcare', 72),
            sectorRow('XLF', 'Financials', 73),
            sectorRow('XLY', 'Consumer', 74),
        ]);
    },
    async down(queryInterface) {
        await queryInterface.bulkDelete(
            { tableName: 'market_assets', schema: 'cms' },
            { symbol: ['AMD', 'META', 'NFLX', 'JPM', 'XLK', 'XLE', 'XLV', 'XLF', 'XLY'] },
        );
    },
};

'use strict';

// Individual country-index ETF proxies + USD/BRL, needed to fully migrate the
// public Imperialpedia /world pages off their old Yahoo-Finance-direct
// integration onto this pipeline. All 12 tickers + USD/BRL verified live
// (real quotes) before writing this migration.
module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();
        const logo = (symbol) => `https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/${symbol}.png`;
        const row = (symbol, canonical, name, sortOrder) => ({
            id: Sequelize.literal('gen_random_uuid()'),
            symbol: canonical, provider_symbol: symbol, name, type: 'index', region: 'GLOBAL',
            provider: 'finnhub', category: 'COUNTRY_INDEX', news_keyword: null, sort_order: sortOrder,
            exchange: 'NYSE ARCA', currency: 'USD', logo_url: logo(symbol), is_active: true,
            created_at: now, updated_at: now,
        });

        await queryInterface.bulkInsert({ tableName: 'market_assets', schema: 'cms' }, [
            row('EWZ', 'BOVESPA', 'Bovespa', 80),
            row('EWU', 'FTSE100', 'FTSE 100', 81),
            row('EWG', 'DAX', 'DAX', 82),
            row('EWQ', 'CAC40', 'CAC 40', 83),
            row('EWJ', 'NIKKEI', 'Nikkei 225', 84),
            row('EWH', 'HANGSENG', 'Hang Seng', 85),
            row('ASHR', 'SHANGHAI', 'Shanghai / CSI 300', 86),
            row('EWP', 'IBEX35', 'IBEX 35', 87),
            row('EWI', 'FTSEMIB', 'FTSE MIB', 88),
            row('EWY', 'KOSPI', 'Kospi', 89),
            row('EWA', 'ASX200', 'ASX 200', 90),
            row('INDA', 'SENSEX', 'Sensex / Nifty', 91),
            {
                id: Sequelize.literal('gen_random_uuid()'),
                symbol: 'USDBRL', provider_symbol: 'USD/BRL', name: 'USD / BRL', type: 'forex', region: 'GLOBAL',
                provider: 'twelvedata', category: 'FX', news_keyword: null, sort_order: 45,
                exchange: null, currency: 'USD', logo_url: null, is_active: true,
                created_at: now, updated_at: now,
            },
        ]);
    },
    async down(queryInterface) {
        await queryInterface.bulkDelete({ tableName: 'market_assets', schema: 'cms' }, {
            symbol: ['BOVESPA', 'FTSE100', 'DAX', 'CAC40', 'NIKKEI', 'HANGSENG', 'SHANGHAI', 'IBEX35', 'FTSEMIB', 'KOSPI', 'ASX200', 'SENSEX', 'USDBRL'],
        });
    },
};

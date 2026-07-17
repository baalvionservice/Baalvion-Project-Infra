'use strict';

// Berkshire Hathaway — the 8th flagship company profile on the public Imperialpedia
// site (STOCKS_PILLAR_STATUS.md) needs a live quote source. Verified live on Finnhub
// under "BRK.B" before writing this (logo CDN also resolves for BRK.B specifically,
// not BRK.A). canonicalSymbol is dot-free ("BRKB") so it works cleanly as a URL path
// segment on /quote/:symbol.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert({ tableName: 'market_assets', schema: 'cms' }, [{
            id: Sequelize.literal('gen_random_uuid()'),
            symbol: 'BRKB', provider_symbol: 'BRK.B', name: 'Berkshire Hathaway',
            type: 'stock', region: 'US', provider: 'finnhub', category: 'FINANCIALS',
            news_keyword: 'Berkshire Hathaway', sort_order: 29,
            exchange: 'NYSE', currency: 'USD',
            logo_url: 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/BRK.B.png',
            is_active: true, created_at: new Date(), updated_at: new Date(),
        }]);
    },
    async down(queryInterface) {
        await queryInterface.bulkDelete({ tableName: 'market_assets', schema: 'cms' }, { symbol: 'BRKB' });
    },
};

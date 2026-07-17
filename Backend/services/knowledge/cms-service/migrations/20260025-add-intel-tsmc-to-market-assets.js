'use strict';

// Intel and TSMC — 2 of the 10 company entities actually seeded in
// imperialpedia-service (amd/alphabet/amazon/apple/intel/microsoft/nvidia/openai/
// tsmc/tesla) that didn't yet have live quote coverage. OpenAI is privately held —
// intentionally left without a market_assets row (no ticker exists to track).
module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();
        const logo = (symbol) => `https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/${symbol}.png`;
        await queryInterface.bulkInsert({ tableName: 'market_assets', schema: 'cms' }, [
            {
                id: Sequelize.literal('gen_random_uuid()'),
                symbol: 'INTC', provider_symbol: 'INTC', name: 'Intel', type: 'stock', region: 'US',
                provider: 'finnhub', category: 'TECH', news_keyword: 'Intel', sort_order: 30,
                exchange: 'NASDAQ', currency: 'USD', logo_url: logo('INTC'), is_active: true,
                created_at: now, updated_at: now,
            },
            {
                id: Sequelize.literal('gen_random_uuid()'),
                symbol: 'TSM', provider_symbol: 'TSM', name: 'TSMC', type: 'stock', region: 'US',
                provider: 'finnhub', category: 'TECH', news_keyword: 'TSMC', sort_order: 31,
                exchange: 'NYSE', currency: 'USD', logo_url: logo('TSM'), is_active: true,
                created_at: now, updated_at: now,
            },
        ]);
    },
    async down(queryInterface) {
        await queryInterface.bulkDelete({ tableName: 'market_assets', schema: 'cms' }, { symbol: ['INTC', 'TSM'] });
    },
};

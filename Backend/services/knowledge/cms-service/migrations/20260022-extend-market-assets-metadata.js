'use strict';

// Adds display metadata so market_assets can drive CMS-controlled quote pages
// (exchange/currency/logo) instead of relying on hardcoded arrays in the service.
// `sort_order` from the 20260021 migration already covers "display_order" — not
// duplicating that column.
module.exports = {
    async up(queryInterface, Sequelize) {
        const table = { tableName: 'market_assets', schema: 'cms' };
        await queryInterface.addColumn(table, 'exchange', { type: Sequelize.STRING(40), allowNull: true });
        await queryInterface.addColumn(table, 'currency', { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'USD' });
        await queryInterface.addColumn(table, 'logo_url', { type: Sequelize.STRING(500), allowNull: true });

        // Finnhub's public logo CDN follows a stable, documented pattern for the
        // stock tickers it covers (verified live for AAPL before writing this) —
        // safe to construct by convention for our finnhub stock rows without an
        // API call at migration time.
        await queryInterface.sequelize.query(`
            UPDATE cms.market_assets
            SET logo_url = 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/' || provider_symbol || '.png',
                exchange = 'NASDAQ'
            WHERE type = 'stock' AND provider = 'finnhub';
        `);
        await queryInterface.sequelize.query(`UPDATE cms.market_assets SET exchange = 'NYSE ARCA' WHERE type = 'index';`);
        await queryInterface.sequelize.query(`UPDATE cms.market_assets SET currency = 'USD' WHERE currency IS NULL;`);
    },
    async down(queryInterface) {
        const table = { tableName: 'market_assets', schema: 'cms' };
        await queryInterface.removeColumn(table, 'exchange');
        await queryInterface.removeColumn(table, 'currency');
        await queryInterface.removeColumn(table, 'logo_url');
    },
};

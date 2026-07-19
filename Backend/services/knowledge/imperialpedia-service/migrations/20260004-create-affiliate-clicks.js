'use strict';

// Append-only click log for affiliate-product attribution. Kept separate from
// affiliate_products.clicks_count (a denormalized fast counter) — this table is the
// source of truth for per-click detail (who/when/referrer), the counter is a cache of its count.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            { tableName: 'affiliate_clicks', schema: 'imperialpedia' },
            {
                id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
                product_id: { type: Sequelize.UUID, allowNull: false },
                user_id: { type: Sequelize.UUID, allowNull: true },
                // SHA-256 hash, never the raw IP — enough for basic abuse/duplicate detection
                // without storing PII (mirrors the platform's hash-chain-over-raw-data bias,
                // see audit-service).
                ip_hash: { type: Sequelize.STRING(64), allowNull: true },
                referrer_url: { type: Sequelize.STRING(2048), allowNull: true },
                user_agent: { type: Sequelize.STRING(512), allowNull: true },
                created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
            }
        );
        await queryInterface.addIndex({ tableName: 'affiliate_clicks', schema: 'imperialpedia' }, ['product_id', 'created_at']);
        await queryInterface.addConstraint({ tableName: 'affiliate_clicks', schema: 'imperialpedia' }, {
            fields: ['product_id'],
            type: 'foreign key',
            name: 'affiliate_clicks_product_id_fkey',
            references: { table: { tableName: 'affiliate_products', schema: 'imperialpedia' }, field: 'id' },
            onDelete: 'CASCADE',
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'affiliate_clicks', schema: 'imperialpedia' });
    },
};

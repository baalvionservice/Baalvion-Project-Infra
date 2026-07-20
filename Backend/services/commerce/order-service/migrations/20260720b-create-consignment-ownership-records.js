'use strict';
/**
 * Chain-of-custody / ownership history for a consigned item. Populated automatically at key
 * lifecycle points (consignor submission, platform receipt) and extendable by ops for anything
 * self-reported by the seller (prior owner, purchase provenance) that a human has reviewed.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'consignment_ownership_records', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false },
            consignment_item_id: { type: Sequelize.UUID, allowNull: false },
            event_type: {
                type: Sequelize.ENUM('prior_ownership', 'consignor_submission', 'platform_custody', 'sold', 'returned'),
                allowNull: false,
            },
            owner_label: { type: Sequelize.STRING(200), allowNull: true },
            event_date: { type: Sequelize.DATE, allowNull: true },
            location: { type: Sequelize.STRING(200), allowNull: true },
            notes: { type: Sequelize.TEXT, allowNull: true },
            recorded_by: { type: Sequelize.BIGINT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'consignment_ownership_records', schema: 'orders' }, ['store_id', 'consignment_item_id']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'consignment_ownership_records', schema: 'orders' });
    },
};

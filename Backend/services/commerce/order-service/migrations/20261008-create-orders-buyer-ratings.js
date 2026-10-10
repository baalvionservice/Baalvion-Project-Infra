'use strict';
/**
 * A seller's rating of a buyer, one per (order, seller). Keyed on the customer record so the
 * score follows the buyer across orders. Rating a buyer is only allowed once the order is
 * delivered and paid (enforced in sellerOrderService).
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'orders_buyer_ratings', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false },
            order_id: { type: Sequelize.UUID, allowNull: false },
            customer_id: { type: Sequelize.UUID, allowNull: false },
            seller_user_id: { type: Sequelize.BIGINT, allowNull: false },
            rating: { type: Sequelize.SMALLINT, allowNull: false },
            comment: { type: Sequelize.TEXT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        });
        await queryInterface.sequelize.query(
            'ALTER TABLE orders.orders_buyer_ratings ADD CONSTRAINT orders_buyer_ratings_range CHECK (rating BETWEEN 1 AND 5)'
        );
        await queryInterface.addIndex({ tableName: 'orders_buyer_ratings', schema: 'orders' }, ['order_id', 'seller_user_id'], { unique: true, name: 'orders_buyer_ratings_order_seller_uq' });
        await queryInterface.addIndex({ tableName: 'orders_buyer_ratings', schema: 'orders' }, ['customer_id']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'orders_buyer_ratings', schema: 'orders' }); },
};

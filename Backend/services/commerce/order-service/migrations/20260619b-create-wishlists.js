'use strict';
/**
 * Wishlist persistence. One wishlist per (store,user); items reference a product (+ optional variant).
 * A NULL variant_id means "the product itself"; the partial unique below keeps the (product) and
 * (product,variant) rows distinct without colliding NULLs.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'wishlists', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false },
            user_id: { type: Sequelize.BIGINT, allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'wishlists', schema: 'orders' }, { fields: ['store_id', 'user_id'], unique: true, name: 'uq_wishlist_store_user' });

        await queryInterface.createTable({ tableName: 'wishlist_items', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            wishlist_id: { type: Sequelize.UUID, allowNull: false },
            product_id: { type: Sequelize.UUID, allowNull: false },
            variant_id: { type: Sequelize.UUID, allowNull: true },
            added_at: { type: Sequelize.DATE, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'wishlist_items', schema: 'orders' }, ['wishlist_id']);
        // Distinct line per (wishlist,product,variant). Two partial uniques so NULL variant rows are
        // still deduplicated (a plain composite unique treats every NULL as distinct in Postgres).
        await queryInterface.addIndex({ tableName: 'wishlist_items', schema: 'orders' }, {
            fields: ['wishlist_id', 'product_id', 'variant_id'], unique: true, name: 'uq_wishlist_item_with_variant', where: { variant_id: { [Sequelize.Op.ne]: null } },
        });
        await queryInterface.addIndex({ tableName: 'wishlist_items', schema: 'orders' }, {
            fields: ['wishlist_id', 'product_id'], unique: true, name: 'uq_wishlist_item_no_variant', where: { variant_id: null },
        });

        // FK to wishlists (cascade so deleting a wishlist clears its items).
        await queryInterface.sequelize.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_wishlist_items_wishlist') THEN
                ALTER TABLE orders.wishlist_items
                    ADD CONSTRAINT fk_wishlist_items_wishlist FOREIGN KEY (wishlist_id)
                    REFERENCES orders.wishlists(id) ON DELETE CASCADE NOT VALID;
            END IF;
        END $$;`);
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query('ALTER TABLE orders.wishlist_items DROP CONSTRAINT IF EXISTS fk_wishlist_items_wishlist');
        await queryInterface.dropTable({ tableName: 'wishlist_items', schema: 'orders' });
        await queryInterface.dropTable({ tableName: 'wishlists', schema: 'orders' });
    },
};

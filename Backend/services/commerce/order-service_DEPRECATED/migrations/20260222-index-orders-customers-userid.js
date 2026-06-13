'use strict';
// Hot-path index for the account area: listMyOrders, listMyReturns and resolveMyCustomer
// (/me/addresses) all query orders_customers WHERE store_id AND user_id on every authed page load.
// Only (store_id) and UNIQUE(store_id,email) existed — user_id lookups were sequential scans.
// (store_id, user_id) turns those into index scans. Idempotent (IF NOT EXISTS); user_id is nullable
// (guest-created rows) so this is a plain, non-unique partial-free btree.
//
// NOTE: the filename uses 20260222 (not the 20260205 in the plan) because 20260205 already names
// the create-orders-orders migration; this keeps the sequence monotonic and collision-free.
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_orders_customers_store_user
               ON orders.orders_customers (store_id, user_id);`,
        );
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS orders.idx_orders_customers_store_user;');
    },
};

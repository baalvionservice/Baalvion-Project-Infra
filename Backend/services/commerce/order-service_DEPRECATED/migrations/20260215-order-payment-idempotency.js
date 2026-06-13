'use strict';
// Hard idempotency for order payments: at most ONE payment row per (order, provider transaction).
// Partial unique index because transaction_id is nullable (a pending record may exist before the
// provider id is known). This turns the prior advisory dedup (findOne-before-insert) into a DB
// guarantee — concurrent intent/record requests can never create duplicate payment rows.
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS uq_order_payments_order_txn
               ON orders.orders_order_payments (order_id, transaction_id)
               WHERE transaction_id IS NOT NULL;`,
        );
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS orders.uq_order_payments_order_txn;');
    },
};

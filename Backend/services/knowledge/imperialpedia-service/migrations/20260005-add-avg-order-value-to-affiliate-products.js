'use strict';

// Enables revenue ESTIMATION for the affiliate report module. There is no purchase/conversion
// postback from merchants anywhere in this system — affiliate_clicks only records click-through,
// never a confirmed sale. avg_order_value is an admin-entered assumption ("if a click from this
// product converts, the order is typically worth $X"), and the report explicitly labels the
// resulting figure as an estimate, never as confirmed revenue. Real revenue requires a merchant
// conversion-tracking integration — out of scope here.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            { tableName: 'affiliate_products', schema: 'imperialpedia' },
            'avg_order_value',
            { type: Sequelize.DECIMAL(10, 2), allowNull: true }
        );
    },
    async down(queryInterface) {
        await queryInterface.removeColumn({ tableName: 'affiliate_products', schema: 'imperialpedia' }, 'avg_order_value');
    },
};

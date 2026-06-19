'use strict';
/**
 * Showroom / virtual / in-home / phone appointments. Bookings may be made by a guest (user_id NULL,
 * ownership via owner_session_id) or an authenticated shopper. Admin/ops confirm or close them.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'appointments', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false },
            user_id: { type: Sequelize.BIGINT, allowNull: true },
            customer_name: { type: Sequelize.STRING(200), allowNull: false },
            customer_email: { type: Sequelize.STRING(254), allowNull: false },
            customer_phone: { type: Sequelize.STRING(30), allowNull: true },
            type: { type: Sequelize.ENUM('showroom', 'virtual', 'in_home', 'phone'), defaultValue: 'showroom' },
            status: { type: Sequelize.ENUM('requested', 'confirmed', 'cancelled', 'completed', 'no_show'), defaultValue: 'requested' },
            preferred_at: { type: Sequelize.DATE, allowNull: false },
            confirmed_at: { type: Sequelize.DATE, allowNull: true },
            location: { type: Sequelize.STRING(200), allowNull: true },
            notes: { type: Sequelize.TEXT, allowNull: true },
            owner_session_id: { type: Sequelize.STRING(200), allowNull: true },
            processed_by: { type: Sequelize.BIGINT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'appointments', schema: 'orders' }, ['store_id', 'status']);
        await queryInterface.addIndex({ tableName: 'appointments', schema: 'orders' }, ['store_id', 'user_id']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'appointments', schema: 'orders' });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS orders.enum_appointments_type');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS orders.enum_appointments_status');
    },
};

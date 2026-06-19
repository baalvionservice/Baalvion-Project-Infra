'use strict';
/**
 * Luxury-resale core: consignment requests + items, in-house authentication, and the public
 * certificate of authenticity. All under the `orders` schema. Sellers may be guests (no platform
 * account) so seller_profiles.user_id is nullable; guest ownership of a request is carried via
 * owner_session_id (the signed X-Cart-Session, same mechanism as guest orders/carts).
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // ── consignment_seller_profiles ───────────────────────────────────────────────
        await queryInterface.createTable({ tableName: 'consignment_seller_profiles', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false },
            user_id: { type: Sequelize.BIGINT, allowNull: true },
            display_name: { type: Sequelize.STRING(200), allowNull: true },
            email: { type: Sequelize.STRING(254), allowNull: false },
            phone: { type: Sequelize.STRING(30), allowNull: true },
            payout_method: { type: Sequelize.STRING(50), allowNull: true },
            payout_details: { type: Sequelize.JSONB, allowNull: true },
            status: { type: Sequelize.ENUM('active', 'suspended'), defaultValue: 'active' },
            total_consignments: { type: Sequelize.INTEGER, defaultValue: 0 },
            total_paid_out: { type: Sequelize.DECIMAL(15, 4), defaultValue: 0 },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        // One profile per (store,user) when the seller is a registered user. Partial unique so guest
        // profiles (user_id NULL) are not collapsed together.
        await queryInterface.addIndex({ tableName: 'consignment_seller_profiles', schema: 'orders' }, {
            fields: ['store_id', 'user_id'], unique: true, name: 'uq_consignment_seller_store_user', where: { user_id: { [Sequelize.Op.ne]: null } },
        });
        await queryInterface.addIndex({ tableName: 'consignment_seller_profiles', schema: 'orders' }, ['store_id', 'email']);

        // ── consignment_requests ──────────────────────────────────────────────────────
        await queryInterface.createTable({ tableName: 'consignment_requests', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false },
            seller_profile_id: { type: Sequelize.UUID, allowNull: true },
            user_id: { type: Sequelize.BIGINT, allowNull: true },
            contact_email: { type: Sequelize.STRING(254), allowNull: false },
            contact_name: { type: Sequelize.STRING(200), allowNull: true },
            contact_phone: { type: Sequelize.STRING(30), allowNull: true },
            reference: { type: Sequelize.STRING(50), allowNull: false, unique: true },
            status: {
                type: Sequelize.ENUM('submitted', 'quoted', 'accepted', 'rejected', 'received', 'authenticating', 'authenticated', 'listed', 'sold', 'withdrawn'),
                defaultValue: 'submitted',
            },
            quote_amount: { type: Sequelize.DECIMAL(15, 4), allowNull: true },
            quote_currency: { type: Sequelize.STRING(3), allowNull: true },
            payout_type: { type: Sequelize.ENUM('consignment', 'buyout'), allowNull: true },
            commission_rate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
            listed_product_id: { type: Sequelize.UUID, allowNull: true },
            notes: { type: Sequelize.TEXT, allowNull: true },
            reviewer_notes: { type: Sequelize.TEXT, allowNull: true },
            metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
            owner_session_id: { type: Sequelize.STRING(200), allowNull: true },
            submitted_at: { type: Sequelize.DATE, allowNull: true },
            processed_by: { type: Sequelize.BIGINT, allowNull: true },
            processed_at: { type: Sequelize.DATE, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'consignment_requests', schema: 'orders' }, ['store_id', 'status']);
        await queryInterface.addIndex({ tableName: 'consignment_requests', schema: 'orders' }, ['store_id', 'user_id']);
        await queryInterface.addIndex({ tableName: 'consignment_requests', schema: 'orders' }, { fields: ['reference'], unique: true, name: 'uq_consignment_request_reference' });

        // ── consignment_items ─────────────────────────────────────────────────────────
        await queryInterface.createTable({ tableName: 'consignment_items', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            consignment_request_id: { type: Sequelize.UUID, allowNull: false },
            brand: { type: Sequelize.STRING(120), allowNull: false },
            model: { type: Sequelize.STRING(200), allowNull: true },
            category: { type: Sequelize.STRING(120), allowNull: true },
            color: { type: Sequelize.STRING(120), allowNull: true },
            material: { type: Sequelize.STRING(120), allowNull: true },
            condition_grade: { type: Sequelize.ENUM('pristine', 'excellent', 'very_good', 'good', 'fair'), allowNull: true },
            asking_price: { type: Sequelize.DECIMAL(15, 4), allowNull: true },
            currency: { type: Sequelize.STRING(3), allowNull: true },
            description: { type: Sequelize.TEXT, allowNull: true },
            photo_urls: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            accessories: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            serial_number: { type: Sequelize.STRING(120), allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'consignment_items', schema: 'orders' }, ['consignment_request_id']);

        // ── consignment_authentications ───────────────────────────────────────────────
        await queryInterface.createTable({ tableName: 'consignment_authentications', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            consignment_item_id: { type: Sequelize.UUID, allowNull: false },
            consignment_request_id: { type: Sequelize.UUID, allowNull: false },
            store_id: { type: Sequelize.UUID, allowNull: false },
            status: { type: Sequelize.ENUM('pending', 'in_review', 'authenticated', 'rejected'), defaultValue: 'pending' },
            authenticator_id: { type: Sequelize.BIGINT, allowNull: true },
            authenticator_name: { type: Sequelize.STRING(200), allowNull: true },
            method: { type: Sequelize.STRING(100), allowNull: true },
            findings: { type: Sequelize.TEXT, allowNull: true },
            confidence: { type: Sequelize.ENUM('high', 'medium', 'low'), allowNull: true },
            photo_urls: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
            decided_at: { type: Sequelize.DATE, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'consignment_authentications', schema: 'orders' }, ['consignment_item_id']);
        await queryInterface.addIndex({ tableName: 'consignment_authentications', schema: 'orders' }, ['store_id', 'status']);

        // ── consignment_certificates ──────────────────────────────────────────────────
        await queryInterface.createTable({ tableName: 'consignment_certificates', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            consignment_item_id: { type: Sequelize.UUID, allowNull: false },
            item_authentication_id: { type: Sequelize.UUID, allowNull: true },
            store_id: { type: Sequelize.UUID, allowNull: false },
            product_id: { type: Sequelize.UUID, allowNull: true },
            code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
            serial_number: { type: Sequelize.STRING(120), allowNull: true },
            brand: { type: Sequelize.STRING(120), allowNull: true },
            model: { type: Sequelize.STRING(200), allowNull: true },
            condition_grade: { type: Sequelize.STRING(50), allowNull: true },
            issued_by: { type: Sequelize.BIGINT, allowNull: true },
            issuer_name: { type: Sequelize.STRING(200), allowNull: true },
            issued_at: { type: Sequelize.DATE, allowNull: true },
            status: { type: Sequelize.ENUM('valid', 'revoked'), defaultValue: 'valid' },
            revoked_reason: { type: Sequelize.STRING(500), allowNull: true },
            verification_hash: { type: Sequelize.STRING(64), allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'consignment_certificates', schema: 'orders' }, { fields: ['code'], unique: true, name: 'uq_consignment_certificate_code' });
        await queryInterface.addIndex({ tableName: 'consignment_certificates', schema: 'orders' }, ['store_id']);
        await queryInterface.addIndex({ tableName: 'consignment_certificates', schema: 'orders' }, ['product_id']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'consignment_certificates', schema: 'orders' });
        await queryInterface.dropTable({ tableName: 'consignment_authentications', schema: 'orders' });
        await queryInterface.dropTable({ tableName: 'consignment_items', schema: 'orders' });
        await queryInterface.dropTable({ tableName: 'consignment_requests', schema: 'orders' });
        await queryInterface.dropTable({ tableName: 'consignment_seller_profiles', schema: 'orders' });
        // Drop ENUM types Postgres leaves behind.
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS orders.enum_consignment_certificates_status');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS orders.enum_consignment_authentications_status');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS orders.enum_consignment_authentications_confidence');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS orders.enum_consignment_items_condition_grade');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS orders.enum_consignment_requests_status');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS orders.enum_consignment_requests_payout_type');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS orders.enum_consignment_seller_profiles_status');
    },
};

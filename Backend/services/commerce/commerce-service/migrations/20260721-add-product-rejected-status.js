'use strict';
// Adds 'rejected' to commerce_products.status — the outcome of an admin moderation rejection
// (see service/productService.js:moderateProduct). Distinct from 'draft' so a seller can tell
// "never submitted" apart from "reviewed and sent back" (customFields.moderationRejectionReason
// carries why). Postgres requires ALTER TYPE ... ADD VALUE to run outside a transaction block.
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(
            "ALTER TYPE \"commerce\".\"enum_commerce_products_status\" ADD VALUE IF NOT EXISTS 'rejected'",
            { raw: true }
        );
    },
    // Postgres cannot drop an enum value directly; down is a documented no-op (matches the
    // project's existing precedent for additive-only enum migrations).
    async down() {},
};

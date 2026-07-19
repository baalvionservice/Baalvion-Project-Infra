'use strict';
// Adds envelope-encryption metadata to commerce_product_media, plus a storage_key column so
// deleteMedia/replaceMedia can locate the underlying object without reverse-parsing it out of
// `url` — necessary now that an encrypted image's `url` points at the decrypt-and-stream route
// (GET /media/:mediaId/raw) instead of the storage object directly (see lib/encryption.js and
// service/productMediaService.js). Additive & non-breaking: every column is nullable or
// defaulted, so existing rows (all implicitly encryption_algo='none') are untouched and still
// resolve their storage key via the existing keyFromUrl(url) fallback.
const TABLE = { tableName: 'commerce_product_media', schema: 'commerce' };

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(TABLE, 'storage_key', { type: Sequelize.TEXT, allowNull: true });
        // The decrypt-and-stream route (GET /media/:mediaId/raw) needs the original content-type
        // to set the response header — url-based serving used to infer it from the file extension.
        await queryInterface.addColumn(TABLE, 'mime_type', { type: Sequelize.TEXT, allowNull: true });
        await queryInterface.addColumn(TABLE, 'encryption_algo', { type: Sequelize.TEXT, allowNull: false, defaultValue: 'none' });
        await queryInterface.addColumn(TABLE, 'encryption_key_id', { type: Sequelize.TEXT, allowNull: true });
        await queryInterface.addColumn(TABLE, 'encryption_iv', { type: Sequelize.TEXT, allowNull: true });
        await queryInterface.addColumn(TABLE, 'encryption_tag', { type: Sequelize.TEXT, allowNull: true });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn(TABLE, 'encryption_tag');
        await queryInterface.removeColumn(TABLE, 'encryption_iv');
        await queryInterface.removeColumn(TABLE, 'encryption_key_id');
        await queryInterface.removeColumn(TABLE, 'encryption_algo');
        await queryInterface.removeColumn(TABLE, 'mime_type');
        await queryInterface.removeColumn(TABLE, 'storage_key');
    },
};

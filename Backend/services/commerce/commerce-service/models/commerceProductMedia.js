'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commerce_product_media', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        productId: { type: DataTypes.UUID, allowNull: false, references: { model: { tableName: 'commerce_products', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
        variantId: { type: DataTypes.UUID, allowNull: true },
        mediaType: { type: DataTypes.ENUM('image', 'video', 'document'), defaultValue: 'image' },
        url: { type: DataTypes.TEXT, allowNull: false },
        thumbnailUrl: { type: DataTypes.TEXT, allowNull: true },
        altText: { type: DataTypes.STRING(500), allowNull: true },
        sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
        isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
        // Underlying storage key for the main object — populated for every row going forward so
        // deleteMedia/replaceMedia never have to reverse-parse it out of `url` (which, for an
        // encrypted image, points at the decrypt-and-stream route, not the storage object).
        storageKey: { type: DataTypes.TEXT, allowNull: true },
        // Needed by the decrypt-and-stream route to set the response Content-Type (url-based
        // serving used to infer this from the file extension).
        mimeType: { type: DataTypes.TEXT, allowNull: true },
        // Envelope encryption (lib/encryption.js). 'none' = stored plaintext (thumbnails always;
        // full-res images when MEDIA_ENCRYPTION_KEY is unset).
        encryptionAlgo: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'none' },
        encryptionKeyId: { type: DataTypes.TEXT, allowNull: true }, // non-secret key fingerprint
        encryptionIv: { type: DataTypes.TEXT, allowNull: true },    // base64 nonce
        encryptionTag: { type: DataTypes.TEXT, allowNull: true },   // base64 GCM auth tag
    }, { schema: 'commerce', tableName: 'commerce_product_media', underscored: true, timestamps: true, indexes: [{ fields: ['product_id'] }, { fields: ['variant_id'] }] });
};

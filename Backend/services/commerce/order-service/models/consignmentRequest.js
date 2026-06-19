'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ConsignmentRequest', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        storeId: { type: DataTypes.UUID, allowNull: false },
        sellerProfileId: { type: DataTypes.UUID, allowNull: true },
        // Authenticated owner (nullable: guests submit via ownerSessionId).
        userId: { type: DataTypes.BIGINT, allowNull: true },
        contactEmail: { type: DataTypes.STRING(254), allowNull: false },
        contactName: { type: DataTypes.STRING(200), allowNull: true },
        contactPhone: { type: DataTypes.STRING(30), allowNull: true },
        // Public-facing reference (CSN-XXXX). Unique across the table.
        reference: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        status: {
            type: DataTypes.ENUM('submitted', 'quoted', 'accepted', 'rejected', 'received', 'authenticating', 'authenticated', 'listed', 'sold', 'withdrawn'),
            defaultValue: 'submitted',
        },
        quoteAmount: { type: DataTypes.DECIMAL(15, 4), allowNull: true },
        quoteCurrency: { type: DataTypes.STRING(3), allowNull: true },
        payoutType: { type: DataTypes.ENUM('consignment', 'buyout'), allowNull: true },
        commissionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
        // Set when admin lists the authenticated item as a product on commerce.
        listedProductId: { type: DataTypes.UUID, allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        reviewerNotes: { type: DataTypes.TEXT, allowNull: true },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        // Guest ownership: the signed X-Cart-Session bound at submit time (same mechanism as carts).
        ownerSessionId: { type: DataTypes.STRING(200), allowNull: true },
        submittedAt: { type: DataTypes.DATE, allowNull: true },
        processedBy: { type: DataTypes.BIGINT, allowNull: true },
        processedAt: { type: DataTypes.DATE, allowNull: true },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'consignment_requests' });
};

'use strict';
// Shipment Tracking & Global Visibility Platform — one row per completed
// delivery capture, written by service/tracking-platform/proofOfDeliveryService.js.
module.exports = (sequelize, DataTypes) => {
    const ProofOfDelivery = sequelize.define('ProofOfDelivery', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        shipment_id: { type: DataTypes.UUID, allowNull: false },
        receiver_name: { type: DataTypes.TEXT },
        signature_url: { type: DataTypes.TEXT },
        photo_urls: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        barcode: { type: DataTypes.TEXT },
        qr_code: { type: DataTypes.TEXT },
        latitude: { type: DataTypes.DECIMAL(9, 6) },
        longitude: { type: DataTypes.DECIMAL(9, 6) },
        delivered_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        otp_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        notes: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'proof_of_delivery',
        underscored: true,
        timestamps: true,
    });

    ProofOfDelivery.associate = (db) => {
        ProofOfDelivery.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
    };

    return ProofOfDelivery;
};

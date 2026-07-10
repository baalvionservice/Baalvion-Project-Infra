'use strict';
// Shipment Tracking & Global Visibility Platform — append-only history of
// live in-transit ETA re-predictions, written by
// service/tracking-platform/etaPredictionEngine.js. Distinct from the pure
// pre-booking quote-ETA calculator in service/freight/eta.js.
module.exports = (sequelize, DataTypes) => {
    const EtaPrediction = sequelize.define('EtaPrediction', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        shipment_id: { type: DataTypes.UUID, allowNull: false },
        predicted_eta: { type: DataTypes.DATE },
        confidence_pct: { type: DataTypes.DECIMAL(5, 2) },
        risk_score: { type: DataTypes.DECIMAL(5, 2) },
        delay_probability_pct: { type: DataTypes.DECIMAL(5, 2) },
        factors: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        model_version: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'rule-based-v1' },
        computed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        schema: 'tradeops',
        tableName: 'eta_predictions',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    EtaPrediction.associate = (db) => {
        EtaPrediction.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
    };

    return EtaPrediction;
};

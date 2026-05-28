'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PriceAlert = sequelize.define('PriceAlert', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        symbol: { type: DataTypes.STRING(20), allowNull: false },
        name: { type: DataTypes.STRING(200) },
        alert_type: { type: DataTypes.ENUM('above', 'below', 'change_pct'), allowNull: false },
        target_value: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
        current_price: { type: DataTypes.DECIMAL(12, 4), defaultValue: 0 },
        is_triggered: { type: DataTypes.BOOLEAN, defaultValue: false },
        triggered_at: { type: DataTypes.DATE },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        notification_channels: { type: DataTypes.JSONB, defaultValue: ['app'] },
    }, {
        sequelize,
        modelName: 'PriceAlert',
        tableName: 'price_alerts',
        schema: 'market',
        underscored: true,
        timestamps: true,
    });
    return PriceAlert;
};

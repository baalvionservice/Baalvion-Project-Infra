'use strict';

module.exports = (sequelize, DataTypes) => {
    const LogisticsShipment = sequelize.define('LogisticsShipment', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        org_id: { type: DataTypes.UUID, allowNull: true },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: { tableName: 'orders', schema: 'mining' }, key: 'id' },
        },
        carrier: { type: DataTypes.STRING(200), allowNull: true },
        vessel_name: { type: DataTypes.STRING(200), allowNull: true },
        container_number: { type: DataTypes.STRING(100), allowNull: true },
        bl_number: { type: DataTypes.STRING(100), allowNull: true },
        origin_port: { type: DataTypes.STRING(200), allowNull: true },
        destination_port: { type: DataTypes.STRING(200), allowNull: true },
        departure_date: { type: DataTypes.DATEONLY, allowNull: true },
        estimated_arrival: { type: DataTypes.DATEONLY, allowNull: true },
        actual_arrival: { type: DataTypes.DATEONLY, allowNull: true },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'booked',
            validate: { isIn: [['booked', 'in_transit', 'at_port', 'delivered']] },
        },
        tracking_events: { type: DataTypes.JSONB, defaultValue: [] },
        documents: { type: DataTypes.JSONB, defaultValue: [] },
    }, {
        tableName: 'logistics_shipments',
        schema: 'mining',
        underscored: true,
        timestamps: true,
    });

    LogisticsShipment.associate = (models) => {
        LogisticsShipment.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
    };

    return LogisticsShipment;
};

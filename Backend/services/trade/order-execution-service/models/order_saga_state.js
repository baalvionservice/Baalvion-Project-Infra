'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('OrderSagaState', {
    order_id: { type: DataTypes.TEXT, primaryKey: true },
    tenant_id: { type: DataTypes.TEXT, allowNull: false },
    state: { type: DataTypes.TEXT, allowNull: false },
    last_event: { type: DataTypes.TEXT },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { schema: 'oms', tableName: 'order_saga_state', underscored: true, timestamps: false });

'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('Order', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    tenant_id: { type: DataTypes.TEXT, allowNull: false },
    deal_id: { type: DataTypes.TEXT },
    buyer_org_id: { type: DataTypes.TEXT },
    seller_org_id: { type: DataTypes.TEXT },
    lines: { type: DataTypes.JSONB, defaultValue: [] },
    total_value: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: 'USD' },
    status: {
        type: DataTypes.ENUM('draft', 'placed', 'payment_confirmed', 'in_fulfillment', 'shipped', 'delivered', 'closed', 'cancelled'),
        defaultValue: 'draft',
    },
    payment_status: {
        type: DataTypes.ENUM('unpaid', 'pending', 'confirmed', 'failed', 'refunded'),
        defaultValue: 'unpaid',
    },
}, { schema: 'oms', tableName: 'orders', underscored: true, timestamps: true });

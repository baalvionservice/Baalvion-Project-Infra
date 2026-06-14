'use strict';
// Consumer-checkout gateway payment against an oms.orders row (Razorpay/Stripe/PayU/bank). Settled
// provider-authoritatively; tenant-isolated by RLS (tenant_id, app.current_tenant GUC) like Order.
module.exports = (sequelize, DataTypes) => sequelize.define('OrderPayment', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    order_id: { type: DataTypes.UUID, allowNull: false },
    tenant_id: { type: DataTypes.TEXT, allowNull: false },
    gateway: { type: DataTypes.TEXT },          // chosen slug: razorpay|stripe|payu|bank
    provider: { type: DataTypes.TEXT },          // capture provider name
    intent_id: { type: DataTypes.TEXT, allowNull: false },
    amount: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: 'USD' },
    status: { type: DataTypes.TEXT, defaultValue: 'pending' }, // pending|captured|failed
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
    paid_at: { type: DataTypes.DATE },
}, { schema: 'oms', tableName: 'order_payments', underscored: true, timestamps: true });

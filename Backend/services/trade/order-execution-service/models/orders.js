'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('Order', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    tenant_id: { type: DataTypes.TEXT, allowNull: false },
    deal_id: { type: DataTypes.TEXT },
    buyer_org_id: { type: DataTypes.TEXT },
    seller_org_id: { type: DataTypes.TEXT },
    lines: { type: DataTypes.JSONB, defaultValue: [] },
    // Money-truth breakdown (R3): every figure is SERVER-COMPUTED from lines + duty/tax + FX,
    // never client-supplied. base_currency_amount + fx_rate_used give an auditable, normalized
    // ledger so order money can never diverge from settlement money.
    subtotal: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    duty_amount: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    tax_amount: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    total_value: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: 'USD' },
    base_currency: { type: DataTypes.STRING(10), defaultValue: 'USD' },
    base_currency_amount: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    fx_rate_used: { type: DataTypes.DECIMAL(18, 8), defaultValue: 1 },
    destination_country: { type: DataTypes.STRING(2) },
    status: {
        type: DataTypes.ENUM('draft', 'placed', 'payment_confirmed', 'in_fulfillment', 'shipped', 'delivered', 'closed', 'cancelled'),
        defaultValue: 'draft',
    },
    payment_status: {
        type: DataTypes.ENUM('unpaid', 'pending', 'confirmed', 'failed', 'refunded'),
        defaultValue: 'unpaid',
    },
}, { schema: 'oms', tableName: 'orders', underscored: true, timestamps: true });

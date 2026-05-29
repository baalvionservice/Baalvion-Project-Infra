'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Payment', {
    id:             { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    org_id:         { type: DataTypes.UUID, allowNull: false },
    candidate_id:   { type: DataTypes.BIGINT, allowNull: true },
    candidate_name: { type: DataTypes.STRING(255), allowNull: true },
    amount:         { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    currency:       { type: DataTypes.STRING(10), defaultValue: 'USD' },
    method:         { type: DataTypes.STRING(20), defaultValue: 'BANK', validate: { isIn: [['SWIFT', 'BTC', 'PAYPAL', 'STRIPE', 'BANK']] } },
    status: {
        type: DataTypes.STRING(24), defaultValue: 'PENDING_APPROVAL',
        validate: { isIn: [['PENDING_APPROVAL', 'APPROVED', 'PAID', 'REJECTED']] },
    },
    payment_date:   { type: DataTypes.DATEONLY, allowNull: true },
    reference:      { type: DataTypes.STRING(255), allowNull: true },
}, { schema: 'jobs', tableName: 'payments', underscored: true, timestamps: true });

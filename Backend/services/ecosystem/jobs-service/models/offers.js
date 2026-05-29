'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Offer', {
    id:             { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    org_id:         { type: DataTypes.UUID, allowNull: false },
    application_id: {
        type: DataTypes.BIGINT, allowNull: false,
        references: { model: { tableName: 'applications', schema: 'jobs' }, key: 'id' }, onDelete: 'CASCADE',
    },
    candidate_id:   { type: DataTypes.BIGINT, allowNull: true },
    base_salary:    { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    equity_value:   { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    bonus:          { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    currency:       { type: DataTypes.STRING(10), defaultValue: 'INR' },
    status: {
        type: DataTypes.STRING(32), defaultValue: 'DRAFT',
        validate: { isIn: [['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']] },
    },
    approvals:      { type: DataTypes.JSONB, defaultValue: [] },
    valid_until:    { type: DataTypes.DATEONLY, allowNull: true },
    created_by:     { type: DataTypes.BIGINT, allowNull: true },
}, { schema: 'jobs', tableName: 'offers', underscored: true, timestamps: true });

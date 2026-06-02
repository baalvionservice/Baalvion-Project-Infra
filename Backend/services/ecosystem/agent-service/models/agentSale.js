'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('agent_sale', {
        id:           { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        agent_id:     { type: DataTypes.UUID, allowNull: false },
        org_id:       { type: DataTypes.STRING(128), allowNull: true },
        customer_ref: { type: DataTypes.STRING(128), allowNull: true }, // external order/customer id
        description:  { type: DataTypes.STRING(255), allowNull: true },
        amount:       { type: DataTypes.DECIMAL(16, 2), allowNull: false },
        currency:     { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'USD' },
        kind:         { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'new' }, // new|recurring
        status:       { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'confirmed' }, // confirmed|pending|reversed
        period:       { type: DataTypes.STRING(7), allowNull: true }, // YYYY-MM bucket
        occurred_at:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        metadata:     { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_at:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'agent_sales', schema: 'agent', timestamps: false,
        indexes: [{ fields: ['agent_id'] }, { fields: ['org_id'] }, { fields: ['period'] }, { fields: ['occurred_at'] }],
    });
};

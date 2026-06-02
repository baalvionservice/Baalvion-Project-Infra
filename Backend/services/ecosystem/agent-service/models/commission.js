'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commission', {
        id:          { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        agent_id:    { type: DataTypes.UUID, allowNull: false },
        org_id:      { type: DataTypes.STRING(128), allowNull: true },
        sale_id:     { type: DataTypes.UUID, allowNull: true },
        plan_id:     { type: DataTypes.UUID, allowNull: true },
        basis:       { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'direct' }, // direct|recurring|override
        level:       { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, // 0 = the selling agent, 1+ = override ancestor
        amount:      { type: DataTypes.DECIMAL(16, 2), allowNull: false },
        currency:    { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'USD' },
        period:      { type: DataTypes.STRING(7), allowNull: true }, // YYYY-MM
        status:      { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'accrued' }, // accrued|approved|paid|reversed
        approved_at: { type: DataTypes.DATE, allowNull: true },
        paid_at:     { type: DataTypes.DATE, allowNull: true },
        payout_ref:  { type: DataTypes.STRING(128), allowNull: true },
        metadata:    { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_at:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'commissions', schema: 'agent', timestamps: false,
        indexes: [{ fields: ['agent_id'] }, { fields: ['sale_id'] }, { fields: ['status'] }, { fields: ['period'] }],
    });
};
